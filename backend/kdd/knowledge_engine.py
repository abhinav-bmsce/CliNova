import json
from typing import List, Dict, Any, Optional
from backend.database.session import get_db_connection

def evaluate_and_rank_patterns(
    user_id: Optional[int] = None,
    project_id: Optional[int] = None,
    dataset_id: Optional[int] = None,
    analysis_ids: Optional[List[int]] = None
) -> Dict[str, Any]:
    """
    Synthesize discoveries from Association Rules, Patient Clusters, and Readmission Decision Tree.
    Calculates multi-criteria interestingness scores, isolates highest-lift vs most-interesting rules,
    and produces grounded clinical evidence cards directly from database entities without synthetic fallbacks.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Fetch Association Rules
        where_clauses = []
        params = []
        if analysis_ids and len(analysis_ids) > 0:
            placeholders = ",".join("?" for _ in analysis_ids)
            where_clauses.append(f"ar.analysis_id IN ({placeholders})")
            params.extend(analysis_ids)
        else:
            if dataset_id:
                where_clauses.append("aj.dataset_id = ?")
                params.append(dataset_id)
            if project_id:
                where_clauses.append("aj.project_id = ?")
                params.append(project_id)
            if user_id:
                where_clauses.append("aj.user_id = ?")
                params.append(user_id)

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        rule_query = f"""
            SELECT ar.antecedents_json, ar.consequents_json, ar.support, ar.confidence, 
                   ar.lift, ar.leverage, ar.conviction, ar.is_readmission_related, aj.algorithm, aj.analysis_code
            FROM association_rules ar
            JOIN analysis_jobs aj ON ar.analysis_id = aj.id
            {where_sql}
            ORDER BY ar.lift DESC
            LIMIT 50;
        """
        cursor.execute(rule_query, tuple(params))
        raw_rules = cursor.fetchall()

        ranked_rules = []
        for r in raw_rules:
            ant = json.loads(r["antecedents_json"])
            con = json.loads(r["consequents_json"])
            supp = float(r["support"])
            conf = float(r["confidence"])
            lift = float(r["lift"])
            lev = float(r["leverage"])
            conv = float(r["conviction"])

            # Multi-criteria Interestingness Score:
            # I = 0.40 * (Lift / 3.0) + 0.35 * Confidence + 0.25 * (Support / 0.10)
            score = round((0.40 * min(1.0, lift / 3.0)) + (0.35 * conf) + (0.25 * min(1.0, supp / 0.10)), 3)

            ranked_rules.append({
                "antecedents": ant,
                "consequents": con,
                "support": supp,
                "confidence": conf,
                "lift": lift,
                "leverage": lev,
                "conviction": conv,
                "interestingness_score": score,
                "is_readmission_related": bool(r["is_readmission_related"]),
                "analysis_code": r["analysis_code"],
                "algorithm": r["algorithm"],
                "summary": f"{' + '.join(ant)} ➔ {', '.join(con)}"
            })

        rules_by_lift = sorted(ranked_rules, key=lambda x: x["lift"], reverse=True)
        rules_by_score = sorted(ranked_rules, key=lambda x: x["interestingness_score"], reverse=True)

        highest_lift_rule = rules_by_lift[0] if rules_by_lift else None
        most_interesting_rule = None
        if rules_by_score:
            if len(rules_by_score) > 1 and highest_lift_rule and rules_by_score[0]["summary"] == highest_lift_rule["summary"]:
                most_interesting_rule = rules_by_score[1]
            else:
                most_interesting_rule = rules_by_score[0]

        # 2. Fetch Clusters
        c_where_clauses = []
        c_params = []
        if analysis_ids and len(analysis_ids) > 0:
            placeholders = ",".join("?" for _ in analysis_ids)
            c_where_clauses.append(f"cr.analysis_id IN ({placeholders})")
            c_params.extend(analysis_ids)
        else:
            if dataset_id:
                c_where_clauses.append("aj.dataset_id = ?")
                c_params.append(dataset_id)
            if project_id:
                c_where_clauses.append("aj.project_id = ?")
                c_params.append(project_id)
            if user_id:
                c_where_clauses.append("aj.user_id = ?")
                c_params.append(user_id)

        c_where_sql = f"WHERE {' AND '.join(c_where_clauses)}" if c_where_clauses else ""
        cluster_query = f"""
            SELECT cr.cluster_index, cr.size, cr.percentage, cr.readmission_rate, 
                   cr.centroids_json, cr.profile_summary, aj.analysis_code
            FROM cluster_results cr
            JOIN analysis_jobs aj ON cr.analysis_id = aj.id
            {c_where_sql}
            ORDER BY cr.cluster_index ASC;
        """
        cursor.execute(cluster_query, tuple(c_params))
        raw_clusters = cursor.fetchall()

        clusters = [
            {
                "cluster_index": r["cluster_index"],
                "size": r["size"],
                "percentage": r["percentage"],
                "readmission_rate": r["readmission_rate"],
                "readmission_pct": round(r["readmission_rate"] * 100, 1),
                "centroids": json.loads(r["centroids_json"]) if r["centroids_json"] else {},
                "profile_summary": r["profile_summary"],
                "analysis_code": r["analysis_code"]
            }
            for r in raw_clusters
        ]

        # 3. Fetch Latest Model Results
        m_where_clauses = []
        m_params = []
        if analysis_ids and len(analysis_ids) > 0:
            placeholders = ",".join("?" for _ in analysis_ids)
            m_where_clauses.append(f"mr.analysis_id IN ({placeholders})")
            m_params.extend(analysis_ids)
        else:
            if dataset_id:
                m_where_clauses.append("aj.dataset_id = ?")
                m_params.append(dataset_id)
            if project_id:
                m_where_clauses.append("aj.project_id = ?")
                m_params.append(project_id)
            if user_id:
                m_where_clauses.append("aj.user_id = ?")
                m_params.append(user_id)

        m_where_sql = f"WHERE {' AND '.join(m_where_clauses)}" if m_where_clauses else ""
        model_query = f"""
            SELECT mr.roc_auc, mr.accuracy, mr.precision, mr.recall, mr.f1_score,
                   mr.feature_importance_json, mr.confusion_matrix_json, mr.tree_rules_json,
                   aj.analysis_code
            FROM model_results mr
            JOIN analysis_jobs aj ON mr.analysis_id = aj.id
            {m_where_sql}
            ORDER BY mr.id DESC LIMIT 1;
        """
        cursor.execute(model_query, tuple(m_params))
        model_row = cursor.fetchone()
        model_metrics = {}
        feature_importances = []
        confusion_matrix = None
        tree_rules = []
        if model_row:
            model_metrics = {
                "analysis_code": model_row["analysis_code"],
                "roc_auc": model_row["roc_auc"],
                "accuracy": model_row["accuracy"],
                "precision": model_row["precision"],
                "recall": model_row["recall"],
                "f1_score": model_row["f1_score"]
            }
            if model_row["feature_importance_json"]:
                feature_importances = json.loads(model_row["feature_importance_json"])
            if model_row["confusion_matrix_json"]:
                confusion_matrix = json.loads(model_row["confusion_matrix_json"])
            if model_row["tree_rules_json"]:
                tree_rules = json.loads(model_row["tree_rules_json"])

        # 4. Synthesize Clinical Discoveries ONLY when real evidence exists
        discoveries = []

        if highest_lift_rule:
            top_rule_lift = highest_lift_rule["lift"]
            top_rule_summary = highest_lift_rule["summary"]
            discoveries.append({
                "id": "disc-01",
                "title": f"Rule with highest lift ({top_rule_lift}) identified",
                "evidence": f"{top_rule_summary} displays {top_rule_lift}x higher probability than independent occurrence.",
                "category": "Association",
                "badge_variant": "sage"
            })

        if clusters:
            valid_rates = [c["readmission_rate"] for c in clusters if c["readmission_rate"] is not None]
            if valid_rates:
                min_rate = min(valid_rates) * 100
                max_rate = max(valid_rates) * 100
                rate_text = f"varying from {round(min_rate, 1)}% to {round(max_rate, 1)}%"
            else:
                rate_text = "demonstrating distinct clinical utilization phenotypes"
            discoveries.append({
                "id": "disc-02",
                "title": f"{len(clusters)} distinct patient clusters discovered",
                "evidence": f"Unsupervised phenotyping isolates {len(clusters)} cohorts with readmission rates {rate_text}.",
                "category": "Clustering",
                "badge_variant": "teal"
            })

        if feature_importances:
            top_feat = feature_importances[0]
            discoveries.append({
                "id": "disc-03",
                "title": f"Key predictor for readmission: {top_feat.get('feature', 'clinical predictor')}",
                "evidence": f"Most influential feature in decision tree classifier (Gini importance: {top_feat.get('importance', 0.0)}).",
                "category": "Classification",
                "badge_variant": "lavender"
            })

        return {
            "total_rules_ranked": len(ranked_rules),
            "highest_lift_rule": highest_lift_rule,
            "most_interesting_rule": most_interesting_rule,
            "top_rules": ranked_rules[:10],
            "patient_clusters": clusters,
            "model_performance": model_metrics,
            "confusion_matrix": confusion_matrix,
            "feature_importance": feature_importances[:8],
            "tree_rules": tree_rules,
            "discoveries": discoveries,
            "scientific_disclaimer": "All metrics represent statistical associations and machine-learned correlations within the observational cohort. They do not constitute clinical diagnoses, established causal relationships, or prescriptive medical guidelines."
        }
