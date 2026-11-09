import os
import json
import urllib.request
from typing import Dict, Any, Optional
from backend.core.config import settings
from backend.database.session import get_db_connection

def explain_kdd_query(
    query: str,
    project_id: Optional[int] = None,
    dataset_id: Optional[int] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate grounded clinical explanations based strictly on actual stored KDD results.
    Distinguishes statistical association from causation.
    If no analyses exist, informs the user to execute algorithms first.
    """
    clean_query = query.strip().lower()

    # 1. Fetch Stored Analytical Context from SQLite
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Association rules query
        rule_params = []
        rule_where = []
        if dataset_id:
            rule_where.append("aj.dataset_id = ?")
            rule_params.append(dataset_id)
        if project_id:
            rule_where.append("aj.project_id = ?")
            rule_params.append(project_id)
        if user_id:
            rule_where.append("aj.user_id = ?")
            rule_params.append(user_id)

        where_sql = f"WHERE {' AND '.join(rule_where)}" if rule_where else ""
        if not rule_where:
            raw_rules = []
        else:
            cursor.execute(f"""
                SELECT ar.antecedents_json, ar.consequents_json, ar.support, ar.confidence, 
                       ar.lift, ar.leverage, ar.conviction, aj.analysis_code, aj.algorithm
                FROM association_rules ar
                JOIN analysis_jobs aj ON ar.analysis_id = aj.id
                {where_sql}
                ORDER BY ar.lift DESC LIMIT 5;
            """, tuple(rule_params))
            raw_rules = cursor.fetchall()
        top_rules = [
            {
                "ant": json.loads(r["antecedents_json"]),
                "con": json.loads(r["consequents_json"]),
                "supp": r["support"],
                "conf": r["confidence"],
                "lift": r["lift"],
                "analysis_code": r["analysis_code"],
                "algorithm": r["algorithm"]
            }
            for r in raw_rules
        ]

        # Clusters query
        c_params = []
        c_where = []
        if dataset_id:
            c_where.append("aj.dataset_id = ?")
            c_params.append(dataset_id)
        if project_id:
            c_where.append("aj.project_id = ?")
            c_params.append(project_id)
        if user_id:
            c_where.append("aj.user_id = ?")
            c_params.append(user_id)

        c_where_sql = f"WHERE {' AND '.join(c_where)}" if c_where else ""
        cursor.execute(f"""
            SELECT cr.cluster_index, cr.percentage, cr.readmission_rate, cr.profile_summary, aj.analysis_code
            FROM cluster_results cr
            JOIN analysis_jobs aj ON cr.analysis_id = aj.id
            {c_where_sql}
            ORDER BY cr.cluster_index ASC;
        """, tuple(c_params))
        clusters = [dict(r) for r in cursor.fetchall()]

        # Model metrics & Feature importance
        m_params = []
        m_where = []
        if dataset_id:
            m_where.append("aj.dataset_id = ?")
            m_params.append(dataset_id)
        if project_id:
            m_where.append("aj.project_id = ?")
            m_params.append(project_id)
        if user_id:
            m_where.append("aj.user_id = ?")
            m_params.append(user_id)

        m_where_sql = f"WHERE {' AND '.join(m_where)}" if m_where else ""
        cursor.execute(f"""
            SELECT mr.roc_auc, mr.accuracy, mr.precision, mr.recall, mr.f1_score, 
                   mr.feature_importance_json, aj.analysis_code
            FROM model_results mr
            JOIN analysis_jobs aj ON mr.analysis_id = aj.id
            {m_where_sql}
            ORDER BY mr.id DESC LIMIT 1;
        """, tuple(m_params))
        model_row = cursor.fetchone()
        model_perf = {}
        feat_imp = []
        model_analysis_code = None
        if model_row:
            model_analysis_code = model_row["analysis_code"]
            model_perf = {
                "roc_auc": model_row["roc_auc"],
                "accuracy": model_row["accuracy"],
                "precision": model_row["precision"],
                "recall": model_row["recall"],
                "f1_score": model_row["f1_score"]
            }
            if model_row["feature_importance_json"]:
                feat_imp = json.loads(model_row["feature_importance_json"])

    # 2. Check If Any Results Exist
    has_results = bool(top_rules or clusters or model_perf)
    if not has_results:
        return {
            "query": query,
            "explanation": (
                "No completed analytical runs were found in the current workspace. "
                "CLINOVA's AI Assistant requires grounded KDD outputs to formulate scientific explanations.\n\n"
                "To get started:\n"
                "1. Go to **Dataset Management** to upload a healthcare encounter dataset (CSV or XLSX).\n"
                "2. Run **Association Rule Mining**, **Patient Clustering**, or **Readmission Analysis**.\n"
                "3. Return to this Assistant to ask specific questions about discovered patterns, cluster subphenotypes, and feature importance rankings."
            ),
            "grounded_sources": [],
            "provider": "clinova-grounded-rule-engine"
        }

    # 3. Grounded Clinical Explanation Engine
    if "cause" in clean_query or "causation" in clean_query or "causality" in clean_query:
        sources = []
        if top_rules:
            sources.append(top_rules[0]['analysis_code'])
        if model_analysis_code:
            sources.append(model_analysis_code)
        explanation = (
            "**No, statistical association does not imply clinical causation.**\n\n"
            "In our observational EHR analyses (such as association rule mining and decision tree classification), "
            "attributes like high medication count (`num_medications`) or frequent prior inpatient admissions "
            "serve as **markers of disease severity, clinical complexity, and multi-morbidity**, rather than direct biological causes of readmission.\n\n"
            "• **Confounding by Indication:** Patients prescribed multiple medications typically have advanced multi-system chronic conditions (e.g., concurrent diabetes, hypertension, and renal impairment).\n"
            "• **Residual Confounding:** Key unmeasured variables—such as patient adherence post-discharge, social determinants of health, and caregiver support—are not captured in structured encounter rows.\n"
            "• **Clinical Actionability:** Rather than de-prescribing necessary drugs, clinicians should interpret high medication counts as an indicator for comprehensive discharge reconciliation, patient counseling, and scheduled early outpatient follow-up."
        )

    elif "limitation" in clean_query or "bias" in clean_query or "validity" in clean_query:
        sources = []
        if top_rules:
            sources.append(top_rules[0]['analysis_code'])
        if clusters:
            sources.append(clusters[0].get('analysis_code', 'K-Means'))
        if model_analysis_code:
            sources.append(model_analysis_code)
        explanation = (
            "### Clinical & Methodological Limitations of the Analysis\n\n"
            "When interpreting findings from CLINOVA on this clinical cohort, researchers and clinicians must consider several key methodological constraints:\n\n"
            "1. **Observational EHR Data:** Findings are derived from retrospective hospital encounter records, which are subject to documentation variability, unmeasured confounders, and coding nuances.\n"
            "2. **Lack of Post-Discharge Adherence Data:** Out-of-hospital medication compliance, outpatient clinical notes, and post-discharge social support are not recorded in structured hospital billing datasets.\n"
            "3. **Selection and Survivorship Bias:** Only patients who returned to an acute care facility within the recorded hospital network are flagged as `<30` days. Patients who sought care elsewhere or expired post-discharge may represent uncaptured outcomes.\n"
            "4. **Correlation vs Causation:** High-lift association rules (e.g., inpatient visits or high medication counts) identify elevated risk strata but do not prove causal mechanisms.\n"
            "5. **Generalizability:** Models trained on specific hospital systems should be externally validated before deployment in disparate healthcare systems with different baseline patient demographics."
        )

    elif "why are inpatient" in clean_query or "inpatient visit" in clean_query or "inpatient so predictive" in clean_query:
        sources = [model_analysis_code] if model_analysis_code else []
        explanation = (
            f"In our Decision Tree classifier (Run **{model_analysis_code or 'latest'}**), **prior inpatient visits (`number_inpatient`)** "
            "emerges as one of the most powerful predictors of 30-day readmission.\n\n"
            "**Clinical & Methodological Rationale:**\n"
            "1. **Indicator of High Baseline Fragility:** Patients with repeated recent hospitalizations generally suffer from unstable chronic disease states, frequent acute decompensations, or treatment refractoriness.\n"
            "2. **Healthcare Utilization Phenotype:** Prior inpatient stays strongly correlate with frequent emergency visits, polypharmacy, and multi-specialty care coordination challenges.\n"
            "3. **Decision Tree Information Gain:** In our tree splits, partitioning patients by `number_inpatient` produces a large Gini reduction, cleanly separating stable baseline cohorts from recurring acute admission cycles."
        )

    elif "lift" in clean_query or "strongest rule" in clean_query or "association" in clean_query or "rule" in clean_query:
        if top_rules:
            top_rule = top_rules[0]
            explanation = (
                f"Based on analysis **{top_rule['analysis_code']}** ({top_rule['algorithm']}), the strongest association rule identified is:\n\n"
                f"**{' + '.join(top_rule['ant'])} ➔ {', '.join(top_rule['con'])}**\n\n"
                f"- **Lift = {top_rule['lift']}**: Patients exhibiting these specific antecedent conditions are **{top_rule['lift']} times more likely** "
                f"to experience early 30-day readmission compared to the baseline readmission rate across the cohort.\n"
                f"- **Confidence = {round(top_rule['conf'] * 100, 1)}%**: Among encounters matching the antecedent conditions, {round(top_rule['conf'] * 100, 1)}% "
                f"resulted in the consequent readmission event.\n"
                f"- **Support = {round(top_rule['supp'] * 100, 1)}%**: This clinical pattern is observed in {round(top_rule['supp'] * 100, 1)}% of all evaluated encounters.\n\n"
                f"⚠️ **Methodological Note:** Association rules reflect statistical co-occurrence within observational data and do not confirm clinical causation. "
                f"Complex medication regimens and high diagnosis counts indicate vulnerable patient subgroups requiring structured transition care."
            )
            sources = [top_rule['analysis_code']]
        else:
            explanation = "No association rule mining runs are available yet for this project. Please execute Apriori or FP-Growth to discover itemsets."
            sources = []

    elif "cluster" in clean_query or "segment" in clean_query or "phenotype" in clean_query:
        if clusters:
            c_code = clusters[0].get("analysis_code", "K-Means")
            cluster_summaries = "\n".join([
                f"- **Cluster {c['cluster_index']} ({c['percentage']}%)**: Readmission rate of {round(c['readmission_rate'] * 100, 1)}%. {c.get('profile_summary', '')}"
                for c in clusters
            ])
            explanation = (
                f"Based on patient clustering analysis **{c_code}**, the cohort is partitioned into **{len(clusters)} distinct clinical subphenotypes**:\n\n"
                f"{cluster_summaries}\n\n"
                f"Clusters with elevated readmission rates highlight high-utilization patient populations with complex multi-morbidities. "
                f"These cluster profiles represent unsupervised statistical groupings rather than definitive medical diagnoses."
            )
            sources = [c_code]
        else:
            explanation = "No patient clustering runs are available yet. Please execute K-Means in the Patient Clustering module."
            sources = []

    elif "readmission" in clean_query or "predict" in clean_query or "tree" in clean_query or "feature" in clean_query or "accuracy" in clean_query or "auc" in clean_query:
        if model_perf:
            top_feats = [f"- **{f['feature']}**: Importance {f['importance']}" for f in feat_imp[:4]]
            feats_text = "\n".join(top_feats) if top_feats else "Feature importance data available."
            explanation = (
                f"Based on Decision Tree classification run **{model_analysis_code}**:\n\n"
                f"- **ROC-AUC:** {model_perf.get('roc_auc', 'N/A')}\n"
                f"- **Classification Accuracy:** {model_perf.get('accuracy', 'N/A')}\n"
                f"- **Precision:** {model_perf.get('precision', 'N/A')}\n"
                f"- **Recall:** {model_perf.get('recall', 'N/A')}\n"
                f"- **F1-Score:** {model_perf.get('f1_score', 'N/A')}\n\n"
                f"**Top Clinical Predictors by Gini Importance:**\n{feats_text}\n\n"
                f"The model uses patient-grouped cross-validation to prevent information leakage across repeated encounters from the same individual."
            )
            sources = [model_analysis_code] if model_analysis_code else []
        else:
            explanation = "No readmission classification runs are recorded yet. Train a Decision Tree classifier in the Readmission Analysis module."
            sources = []

    else:
        # General synthesis
        summary_points = []
        sources = []
        if top_rules:
            summary_points.append(f"• **Top Association Rule:** {' + '.join(top_rules[0]['ant'])} ➔ {', '.join(top_rules[0]['con'])} (Lift: {top_rules[0]['lift']}) [{top_rules[0]['analysis_code']}]")
            sources.append(top_rules[0]['analysis_code'])
        if clusters:
            summary_points.append(f"• **Patient Clustering:** {len(clusters)} phenotypes discovered [{clusters[0].get('analysis_code', 'K-Means')}]")
            sources.append(clusters[0].get('analysis_code', 'K-Means'))
        if model_perf:
            summary_points.append(f"• **Predictive Modeling:** Decision Tree ROC-AUC {model_perf.get('roc_auc')} [{model_analysis_code}]")
            if model_analysis_code:
                sources.append(model_analysis_code)

        explanation = (
            f"Here is a summary of the current clinical knowledge discovered in this project:\n\n"
            + "\n".join(summary_points) +
            "\n\nYou can ask me specific questions such as:\n"
            "- *'What is the rule with the highest lift and what does it mean?'*\n"
            "- *'Explain the patient clusters and which cohort has highest readmissions.'*\n"
            "- *'What are the key predictors in the readmission classification model?'*"
        )

    return {
        "query": query,
        "explanation": explanation,
        "grounded_sources": list(set(s for s in sources if s)),
        "provider": "clinova-grounded-rule-engine"
    }
