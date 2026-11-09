import io
import json
import os
import unittest
import uuid
import sys
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import create_app
from backend.database.session import get_db_connection

class EndToEndKddLifecycleTestCase(unittest.TestCase):
    """
    End-to-End verification of the complete CLINOVA KDD pipeline:
    Registration -> Clean Zero State -> CSV & XLSX Upload -> EDA -> Preprocessing ->
    Apriori & FP-Growth -> K-Means Clustering -> Decision Tree Classification (mathematical consistency) ->
    Knowledge Discovery Synthesis -> Grounded AI Assistance -> Report Generation -> Cleanup.
    """

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_complete_kdd_lifecycle(self):
        uid = uuid.uuid4().hex[:6]
        username = f"dr_researcher_{uid}"
        email = f"researcher_{uid}@hospital.org"
        password = "SecureResearchPass2025!"

        # Step 1: Register New Clinician
        reg_res = self.client.post("/api/auth/register", json={
            "full_name": f"Dr. Researcher {uid}",
            "email": email,
            "username": username,
            "password": password,
            "department": "Cardiology Research",
            "role_id": 2
        })
        self.assertEqual(reg_res.status_code, 201, f"Registration failed: {reg_res.get_json()}")

        # Step 1b: Login to get token
        login_res = self.client.post("/api/auth/login", json={
            "username": username,
            "password": password
        })
        self.assertEqual(login_res.status_code, 200, f"Login failed: {login_res.get_json()}")
        token = login_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Verify Initial Dashboard is Clean 0-State
        dash_res = self.client.get("/api/dashboard/stats", headers=headers)
        self.assertEqual(dash_res.status_code, 200)
        dash = dash_res.get_json()
        self.assertEqual(dash["kpi"]["datasets"], 0)
        self.assertEqual(dash["kpi"]["encounters"], 0)
        self.assertEqual(dash["kpi"]["association_rules"], 0)
        self.assertEqual(dash["kpi"]["patient_clusters"], 0)
        self.assertIsNone(dash["kpi"]["best_model_roc_auc"])
        self.assertEqual(len(dash["association_rules_top_lift"]), 0)
        self.assertEqual(len(dash["patient_clustering"]), 0)
        self.assertIsNone(dash["readmission_analysis"])

        # Step 3: Upload a Multi-Row Healthcare CSV Dataset
        csv_data = [
            "encounter_id,patient_nbr,race,gender,age,time_in_hospital,num_lab_procedures,num_procedures,num_medications,number_inpatient,insulin,diabetesMed,readmitted",
        ]
        # Generate 60 clinical records
        for i in range(1, 61):
            readm = "<30" if i % 4 == 0 else "NO"
            time_h = 3 + (i % 7)
            meds = 8 + (i % 15)
            inpatient = 0 if i % 3 != 0 else 2
            csv_data.append(f"{1000+i},{2000+i%20},Caucasian,Female,[60-70),{time_h},45,2,{meds},{inpatient},Up,Yes,{readm}")

        csv_content = "\n".join(csv_data).encode("utf-8")
        upload_res = self.client.post(
            "/api/datasets/upload",
            headers=headers,
            data={
                "name": f"Clinical Study Cohort {uid}",
                "description": "Validation study cohort for early readmission",
                "file": (io.BytesIO(csv_content), f"cohort_{uid}.csv")
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(upload_res.status_code, 201)
        upload_json = upload_res.get_json()
        dataset_id = upload_json["dataset"]["id"]
        self.assertEqual(upload_json["dataset"]["row_count"], 60)

        # Verify preview on uploaded dataset
        prev_res = self.client.get(f"/api/datasets/{dataset_id}/preview", headers=headers)
        self.assertEqual(prev_res.status_code, 200)
        self.assertGreater(len(prev_res.get_json()["columns"]), 5)

        # Step 4: Run EDA Profiling on the Uploaded Dataset
        eda_res = self.client.get(f"/api/eda/profile?dataset_id={dataset_id}", headers=headers)
        self.assertEqual(eda_res.status_code, 200)
        eda_json = eda_res.get_json()
        self.assertEqual(eda_json["total_rows"], 60)
        self.assertIn("columns", eda_json)
        self.assertIn("target_distribution", eda_json)

        # Step 5: Run Preprocessing on the Uploaded Dataset
        prep_res = self.client.post("/api/preprocessing/run", headers=headers, json={
            "dataset_id": dataset_id,
            "scale_numeric": "standard",
            "impute_strategy": "median",
            "remove_duplicates": False
        })
        self.assertEqual(prep_res.status_code, 200)
        prep_json = prep_res.get_json()
        self.assertEqual(prep_json["metrics"]["rows_after"], 60)

        # Step 6: Mine Association Rules with Apriori
        apriori_res = self.client.post("/api/mining/apriori", headers=headers, json={
            "dataset_id": dataset_id,
            "min_support": 0.05,
            "min_confidence": 0.50,
            "min_lift": 1.1,
            "target_consequent": "readmitted = <30"
        })
        self.assertEqual(apriori_res.status_code, 200)
        apriori_json = apriori_res.get_json()
        self.assertEqual(apriori_json["dataset_id"], dataset_id)
        self.assertEqual(apriori_json["algorithm"], "Apriori")

        # Step 7: Mine Association Rules with FP-Growth (Preserving Target)
        fpgrowth_res = self.client.post("/api/mining/fp-growth", headers=headers, json={
            "dataset_id": dataset_id,
            "min_support": 0.05,
            "min_confidence": 0.50,
            "min_lift": 1.1,
            "target_consequent": "readmitted = <30"
        })
        self.assertEqual(fpgrowth_res.status_code, 200)
        fpgrowth_json = fpgrowth_res.get_json()
        self.assertEqual(fpgrowth_json["dataset_id"], dataset_id)
        self.assertEqual(fpgrowth_json["algorithm"], "FP-Growth")

        # Step 8: Patient Clustering with K-Means (k=3)
        kmeans_res = self.client.post("/api/clustering/kmeans", headers=headers, json={
            "dataset_id": dataset_id,
            "k": 3
        })
        self.assertEqual(kmeans_res.status_code, 200)
        kmeans_json = kmeans_res.get_json()
        self.assertEqual(kmeans_json["dataset_id"], dataset_id)
        self.assertEqual(len(kmeans_json["clusters"]), 3)
        total_size = sum(c["size"] for c in kmeans_json["clusters"])
        self.assertEqual(total_size, 60, "Clustering must partition all 60 records without truncation")

        # Step 9: Decision Tree Classifier & Mathematical Verification
        tree_res = self.client.post("/api/readmission/train", headers=headers, json={
            "dataset_id": dataset_id,
            "max_depth": 4,
            "min_samples_leaf": 5
        })
        self.assertEqual(tree_res.status_code, 200)
        tree_json = tree_res.get_json()
        cm = tree_json["confusion_matrix"]
        tn, fp = cm[0][0], cm[0][1]
        fn, tp = cm[1][0], cm[1][1]
        total_test = tn + fp + fn + tp
        self.assertGreater(total_test, 0)

        # Mathematical formulas check:
        expected_acc = round((tp + tn) / total_test, 4)
        self.assertAlmostEqual(tree_json["accuracy"], expected_acc, places=2)

        if tp + fp > 0:
            expected_prec = round(tp / (tp + fp), 4)
            self.assertAlmostEqual(tree_json["precision"], expected_prec, places=2)

        if tp + fn > 0:
            expected_rec = round(tp / (tp + fn), 4)
            self.assertAlmostEqual(tree_json["recall"], expected_rec, places=2)

        # Step 10: Knowledge Discovery Synthesis for this Dataset
        insights_res = self.client.get(f"/api/knowledge/insights?dataset_id={dataset_id}", headers=headers)
        self.assertEqual(insights_res.status_code, 200)
        insights_json = insights_res.get_json()
        self.assertIn("discoveries", insights_json)
        self.assertIn("top_rules", insights_json)

        # Step 11: Grounded AI Assistant Query
        ai_res = self.client.post("/api/ai/chat", headers=headers, json={
            "query": "Explain the decision tree results for this cohort.",
            "dataset_id": dataset_id
        })
        self.assertEqual(ai_res.status_code, 200)
        ai_json = ai_res.get_json()
        self.assertIn("explanation", ai_json)
        self.assertIn("ROC-AUC", ai_json["explanation"])

        # Step 12: Generate Analytical Study Report with Provenance
        an_ids = [
            apriori_json.get("analysis_id"),
            kmeans_json.get("analysis_id"),
            tree_json.get("analysis_id")
        ]
        valid_an_ids = [aid for aid in an_ids if aid is not None]

        rep_res = self.client.post("/api/reports/generate", headers=headers, json={
            "title": f"Comprehensive Clinical KDD Report {uid}",
            "format": "html",
            "dataset_id": dataset_id,
            "analysis_ids": valid_an_ids
        })
        self.assertEqual(rep_res.status_code, 201)
        rep_json = rep_res.get_json()
        self.assertEqual(rep_json["report"]["format"], "html")
        self.assertTrue(rep_json["report"]["report_code"].startswith("REP-"))

        # Download report and verify dataset name and row count are present
        download_res = self.client.get(f"/api/reports/{rep_json['report']['id']}/download")
        self.assertEqual(download_res.status_code, 200)
        html_content = download_res.data.decode("utf-8")
        self.assertIn("60", html_content)
        self.assertIn(f"Clinical Study Cohort {uid}", html_content)

        # Step 13: Clean up dataset and verify file deletion
        del_res = self.client.delete(f"/api/datasets/{dataset_id}", headers=headers)
        self.assertEqual(del_res.status_code, 200)

        # Verify dataset is no longer accessible
        get_del_res = self.client.get(f"/api/datasets/{dataset_id}/preview", headers=headers)
        self.assertEqual(get_del_res.status_code, 404)

if __name__ == "__main__":
    unittest.main()
