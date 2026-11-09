import unittest
import json
import os
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import create_app
from backend.core.config import settings
from backend.database.session import init_db

class ClinovaFullSystemTestCase(unittest.TestCase):
    """Exhaustive test suite verifying the complete CLINOVA full-stack KDD platform."""

    @classmethod
    def setUpClass(cls):
        os.environ["CLINOVA_DEMO_MODE"] = "true"
        init_db()
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_health_and_info(self):
        """Verify health check and system capability descriptors."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"], "connected")
        self.assertEqual(data["storage"], "accessible")

    def test_02_dashboard_stats_matches_ui_targets(self):
        """Verify dashboard statistics accurately match the UI design system and user scoping."""
        # 1. Unauthenticated request returns clean zero-state without synthetic leaks
        res_unauth = self.client.get("/api/dashboard/stats")
        self.assertEqual(res_unauth.status_code, 200)
        data_unauth = res_unauth.get_json()
        self.assertEqual(data_unauth["kpi"]["datasets"], 0)
        self.assertEqual(data_unauth["kpi"]["encounters"], 0)
        self.assertEqual(data_unauth["kpi"]["association_rules"], 0)
        self.assertEqual(data_unauth["kpi"]["patient_clusters"], 0)
        self.assertIsNone(data_unauth["kpi"]["best_model_roc_auc"])

        # 2. Authenticated user 1 scoped to active dataset
        res = self.client.get("/api/dashboard/stats?user_id=1&dataset_id=1")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        # Check KPIs
        self.assertGreaterEqual(data["kpi"]["datasets"], 1)
        self.assertGreaterEqual(data["kpi"]["encounters"], 1)
        self.assertGreaterEqual(data["kpi"]["projects"], 1)
        self.assertGreaterEqual(data["kpi"]["association_rules"], 1)
        self.assertGreaterEqual(data["kpi"]["patient_clusters"], 1)
        self.assertIsNotNone(data["kpi"]["best_model_roc_auc"])

        # Check Donut Chart Data
        self.assertGreater(data["dataset_overview"]["total_encounters"], 0)
        self.assertEqual(data["dataset_overview"]["not_readmitted_count"] + data["dataset_overview"]["readmitted_count"], data["dataset_overview"]["total_encounters"])

        # Check Top Lift Rules
        self.assertGreaterEqual(len(data["association_rules_top_lift"]), 1)
        self.assertIn("lift", data["association_rules_top_lift"][0])

        # Check Clusters
        self.assertGreaterEqual(len(data["patient_clustering"]), 1)

    def test_03_authentication_and_jwt(self):
        """Verify login, token issue, profile retrieval, and invalid credential rejection."""
        # Valid login for Dr. Ananya Rao
        res = self.client.post("/api/auth/login", json={
            "username": "arao",
            "password": "Clinova2026!Secure"
        })
        self.assertEqual(res.status_code, 200)
        login_data = res.get_json()
        self.assertIn("token", login_data)
        token = login_data["token"]
        self.assertEqual(login_data["user"]["full_name"], "Dr. Ananya Rao")

        # Profile retrieval with Bearer token
        res_profile = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_profile.status_code, 200)
        self.assertEqual(res_profile.get_json()["user"]["username"], "arao")

        # Invalid password rejection
        res_bad = self.client.post("/api/auth/login", json={
            "username": "arao",
            "password": "WrongPassword123!"
        })
        self.assertEqual(res_bad.status_code, 401)

    def test_04_project_lifecycle(self):
        """Verify project creation, listing, retrieval, and member permissions."""
        # Login as Admin
        res_login = self.client.post("/api/auth/login", json={
            "username": "evance",
            "password": "Clinova2026!Secure"
        })
        token = res_login.get_json()["token"]

        # Create Project
        res_create = self.client.post("/api/projects", json={
            "name": "Heart Failure Comorbidity Investigation",
            "description": "Exploratory KDD study on acute heart failure admissions.",
            "target_objective": "Identify novel medication co-occurrence rules."
        }, headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_create.status_code, 201)
        project_id = res_create.get_json()["project"]["id"]

        # Get Project Details
        res_get = self.client.get(f"/api/projects/{project_id}", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.get_json()["project"]["name"], "Heart Failure Comorbidity Investigation")

    def test_05_dataset_profiling_and_eda(self):
        """Verify dataset preview and EDA statistical calculations."""
        # Dataset list
        res_list = self.client.get("/api/datasets")
        self.assertEqual(res_list.status_code, 200)
        datasets = res_list.get_json()["datasets"]
        self.assertGreaterEqual(len(datasets), 1)
        dataset_id = datasets[0]["id"]

        # Preview
        res_prev = self.client.get(f"/api/datasets/{dataset_id}/preview?limit=10")
        self.assertEqual(res_prev.status_code, 200)
        self.assertEqual(len(res_prev.get_json()["rows"]), 10)

        # EDA Profile
        res_eda = self.client.get(f"/api/eda/profile?dataset_id={dataset_id}")
        self.assertEqual(res_eda.status_code, 200)
        eda_data = res_eda.get_json()
        self.assertIn("columns", eda_data)
        self.assertIn("target_distribution", eda_data)
        self.assertIn("correlations", eda_data)

    def test_06_apriori_and_fp_growth_mining(self):
        """Verify Apriori and FP-Growth rule mining correctness and safety rules."""
        # 1. Apriori
        res_apriori = self.client.post("/api/mining/apriori", json={
            "min_support": 0.02,
            "min_confidence": 0.50,
            "min_lift": 1.2,
            "target_consequent": "readmitted = <30"
        })
        self.assertEqual(res_apriori.status_code, 200)
        apr_data = res_apriori.get_json()
        self.assertIn("rules", apr_data)
        self.assertGreaterEqual(len(apr_data["rules"]), 1)

        # Verify Safety Rule: readmission outcome is NEVER in antecedent
        for rule in apr_data["rules"]:
            self.assertNotIn("readmitted = <30", rule["antecedents"])
            self.assertIn("readmitted = <30", rule["consequents"])
            self.assertGreaterEqual(rule["lift"], 1.2)

        # 2. FP-Growth
        res_fp = self.client.post("/api/mining/fp-growth", json={
            "min_support": 0.02,
            "min_confidence": 0.50,
            "min_lift": 1.2,
            "target_consequent": "readmitted = <30"
        })
        self.assertEqual(res_fp.status_code, 200)
        fp_data = res_fp.get_json()
        self.assertEqual(fp_data["algorithm"], "FP-Growth")
        self.assertGreater(fp_data["execution_time_ms"], 0)

    def test_07_kmeans_patient_clustering(self):
        """Verify K-Means patient clustering, Elbow curve, and Silhouette score."""
        res_km = self.client.post("/api/clustering/kmeans", json={
            "k": 5,
            "features": ["time_in_hospital", "num_lab_procedures", "num_medications", "number_inpatient"]
        })
        self.assertEqual(res_km.status_code, 200)
        km_data = res_km.get_json()
        self.assertEqual(km_data["k"], 5)
        self.assertEqual(len(km_data["clusters"]), 5)
        self.assertGreater(km_data["silhouette_score"], 0)
        self.assertEqual(len(km_data["elbow_curve"]), 7) # k=2..8

    def test_08_readmission_decision_tree(self):
        """Verify Decision Tree classification, grouped patient split, and ROC-AUC calculation."""
        res_tree = self.client.post("/api/readmission/train", json={
            "max_depth": 4,
            "min_samples_leaf": 15
        })
        self.assertEqual(res_tree.status_code, 200)
        tree_data = res_tree.get_json()
        self.assertEqual(tree_data["leakage_prevention"], "patient_nbr grouped splitting")
        self.assertGreaterEqual(tree_data["roc_auc"], 0.75)
        self.assertGreaterEqual(tree_data["accuracy"], 0.75)
        self.assertIn("feature_importances", tree_data)
        self.assertIn("confusion_matrix", tree_data)
        self.assertIn("decision_rules", tree_data)

    def test_09_knowledge_discovery_and_ai_assistant(self):
        """Verify multi-criteria pattern ranking and grounded AI explanations."""
        # 1. Knowledge Insights
        res_know = self.client.get("/api/knowledge/insights")
        self.assertEqual(res_know.status_code, 200)
        k_data = res_know.get_json()
        self.assertIn("discoveries", k_data)
        self.assertIn("scientific_disclaimer", k_data)
        self.assertEqual(len(k_data["discoveries"]), 3)

        # 2. AI Assistant Grounded Query
        res_ai = self.client.post("/api/ai/chat", json={
            "query": "Explain the rule with highest lift.",
            "user_id": 1,
            "dataset_id": 1
        })
        self.assertEqual(res_ai.status_code, 200)
        ai_data = res_ai.get_json()
        self.assertIn("Lift =", ai_data["explanation"])
        self.assertIn("Methodological Note", ai_data["explanation"])

    def test_10_reports_and_exports(self):
        """Verify report generation in PDF/HTML and CSV."""
        res_rep = self.client.post("/api/reports/generate", json={
            "project_id": 1,
            "title": "Hospital Readmission Discovery Study",
            "format": "pdf"
        })
        self.assertEqual(res_rep.status_code, 201)
        rep_id = res_rep.get_json()["report"]["id"]

        # Download report
        res_dl = self.client.get(f"/api/reports/{rep_id}/download")
        self.assertEqual(res_dl.status_code, 200)
        self.assertIn(b"CLINOVA", res_dl.data)

    def test_11_report_data_consistency_and_provenance(self):
        """
        Verify that analytical reports maintain strict data provenance and consistency:
        - Traceable dataset ID, name, and encounter count
        - Specific analysis run IDs (AN-0040, AN-0042, AN-0043)
        - Preprocessing configuration
        - Highest-lift rule vs Most clinically interesting rule
        - True cluster sizes, percentages, and readmission rates
        - Test-set 2x2 confusion matrix and classification metrics
        - Display 'Not available' when an analysis run is omitted.
        """
        # 1. Test Provenance Options Endpoint
        res_opts = self.client.get("/api/reports/provenance-options")
        self.assertEqual(res_opts.status_code, 200)
        opts = res_opts.get_json()
        self.assertIn("projects", opts)
        self.assertIn("datasets", opts)
        self.assertIn("analysis_runs", opts)
        self.assertTrue(any(r["analysis_code"] == "AN-0040" for r in opts["analysis_runs"]))
        self.assertTrue(any(r["analysis_code"] == "AN-0042" for r in opts["analysis_runs"]))
        self.assertTrue(any(r["analysis_code"] == "AN-0043" for r in opts["analysis_runs"]))

        # 2. Generate Full Grounded JSON Report with explicit runs (1=AN-0040, 3=AN-0042, 4=AN-0043)
        res_json_rep = self.client.post("/api/reports/generate", json={
            "project_id": 1,
            "dataset_id": 1,
            "analysis_ids": [1, 3, 4],
            "title": "Verified Clinical Study Provenance Report",
            "format": "json"
        })
        self.assertEqual(res_json_rep.status_code, 201)
        json_rep_id = res_json_rep.get_json()["report"]["id"]

        dl_json = self.client.get(f"/api/reports/{json_rep_id}/download")
        self.assertEqual(dl_json.status_code, 200)
        rep_data = json.loads(dl_json.data.decode("utf-8"))

        # Verify Dataset Provenance
        self.assertEqual(rep_data["provenance"]["dataset"]["id"], 1)
        self.assertEqual(rep_data["provenance"]["dataset"]["row_count"], 101766)
        self.assertEqual(rep_data["provenance"]["dataset"]["column_count"], 50)
        self.assertTrue(rep_data["provenance"]["preprocessing"]["available"])

        # Verify Analysis Runs Included
        included_codes = [aj["analysis_code"] for aj in rep_data["provenance"]["included_analyses"]]
        self.assertIn("AN-0040", included_codes)
        self.assertIn("AN-0042", included_codes)
        self.assertIn("AN-0043", included_codes)

        # Verify Association Mining Provenance & Distinction of Highest-Lift vs Interesting
        self.assertTrue(rep_data["association_mining"]["available"])
        self.assertEqual(rep_data["association_mining"]["analysis_code"], "AN-0040")
        self.assertEqual(rep_data["association_mining"]["highest_lift_rule"]["lift"], 2.78)
        self.assertEqual(rep_data["association_mining"]["highest_lift_rule"]["support"], 0.048)
        self.assertEqual(rep_data["association_mining"]["highest_lift_rule"]["confidence"], 0.812)
        self.assertIn("most_interesting_rule", rep_data["association_mining"])

        # Verify Clustering Provenance
        self.assertTrue(rep_data["patient_clustering"]["available"])
        self.assertEqual(rep_data["patient_clustering"]["analysis_code"], "AN-0042")
        self.assertEqual(rep_data["patient_clustering"]["k"], 5)
        clusters = rep_data["patient_clustering"]["clusters"]
        self.assertEqual(len(clusters), 5)
        self.assertEqual(clusters[0]["size"], 27884)
        self.assertEqual(clusters[0]["percentage"], 27.4)
        self.assertEqual(clusters[0]["readmission_rate"], 0.187)

        # Verify Classification Provenance & Confusion Matrix
        self.assertTrue(rep_data["readmission_classification"]["available"])
        self.assertEqual(rep_data["readmission_classification"]["analysis_code"], "AN-0043")
        self.assertEqual(rep_data["readmission_classification"]["roc_auc"], 0.84)
        self.assertEqual(rep_data["readmission_classification"]["accuracy"], 0.82)
        self.assertEqual(rep_data["readmission_classification"]["precision"], 0.78)
        self.assertEqual(rep_data["readmission_classification"]["recall"], 0.76)
        self.assertEqual(rep_data["readmission_classification"]["f1_score"], 0.77)
        self.assertEqual(rep_data["readmission_classification"]["confusion_matrix"], [[17480, 2450], [420, 1340]])

        # 3. Generate HTML/PDF Report and verify rendered strings
        res_html_rep = self.client.post("/api/reports/generate", json={
            "project_id": 1,
            "dataset_id": 1,
            "analysis_ids": [1, 3, 4],
            "title": "Verified Clinical Study HTML Report",
            "format": "pdf"
        })
        self.assertEqual(res_html_rep.status_code, 201)
        html_rep_id = res_html_rep.get_json()["report"]["id"]

        dl_html = self.client.get(f"/api/reports/{html_rep_id}/download")
        self.assertEqual(dl_html.status_code, 200)
        html_str = dl_html.data.decode("utf-8")
        self.assertIn("101,766", html_str)
        self.assertIn("AN-0040", html_str)
        self.assertIn("AN-0042", html_str)
        self.assertIn("AN-0043", html_str)
        self.assertIn("Highest-Lift Association Rule", html_str)
        self.assertIn("Most Clinically Interesting Rule", html_str)
        self.assertIn("2.78", html_str)
        self.assertIn("27,884", html_str)
        self.assertIn("18.7%", html_str)
        self.assertIn("17,480", html_str)
        self.assertIn("1,340", html_str)

        # 4. Test Missing/Omitted Analysis handling ("Not available")
        res_partial_rep = self.client.post("/api/reports/generate", json={
            "project_id": 2,
            "dataset_id": 1,
            "analysis_ids": [3], # Only K-Means AN-0042
            "title": "Clustering Only Report",
            "format": "json"
        })
        self.assertEqual(res_partial_rep.status_code, 201)
        partial_data = json.loads(self.client.get(f"/api/reports/{res_partial_rep.get_json()['report']['id']}/download").data.decode("utf-8"))
        self.assertEqual(partial_data["executive_kpis"]["patient_clusters"], "5")
        self.assertEqual(partial_data["executive_kpis"]["peak_lift"], "Not available")
        self.assertEqual(partial_data["executive_kpis"]["roc_auc"], "Not available")
        self.assertFalse(partial_data["association_mining"]["available"])
        self.assertFalse(partial_data["readmission_classification"]["available"])

if __name__ == "__main__":
    unittest.main()

