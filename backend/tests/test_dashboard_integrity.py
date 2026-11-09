import unittest
import json
import uuid
import io
import pandas as pd
from pathlib import Path

from backend.main import create_app
from backend.core.security import hash_password, create_access_token
from backend.database.session import get_db_connection

class DashboardDataIntegrityTestCase(unittest.TestCase):
    """
    Direct verification of Acceptance Criteria A through I:
    - Criterion A: Fresh account starts completely empty.
    - Criterion B: Upload 240-row dataset -> dashboard displays 240 encounters, 0 rules, 0 clusters, ROC-AUC 'Not yet analyzed'.
    - Criterion C: Run association rule mining -> only rules mined from that dataset appear.
    - Criterion D: Run patient clustering -> cluster sizes sum to 240.
    - Criterion E: Run Decision Tree -> ROC-AUC and metrics calculated from test-set confusion matrix.
    - Criterion F: Switch dataset -> all dataset-dependent content updates immediately.
    - Criterion G: Page refresh / persistence -> correct values remain.
    - Criterion H: Sign in as another user -> user isolation.
    - Criterion I: Delete dataset -> metrics and analysis results disappear from dashboard.
    """

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def _create_user(self, prefix="dash_test"):
        unique = uuid.uuid4().hex[:6]
        email = f"{prefix}_{unique}@clinova.org"
        username = f"u_{unique}"
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (email, username, password_hash, full_name, department, role_id, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1);
            """, (email, username, hash_password("Clinova2026!Secure"), f"Dr. {prefix}", "Research", 2))
            uid = cursor.lastrowid
        token = create_access_token({"sub": str(uid), "username": username, "role": "Researcher"})
        return uid, username, email, token

    def _generate_synthetic_csv(self, n_rows=240):
        records = []
        for i in range(n_rows):
            records.append({
                "encounter_id": 1000 + i,
                "patient_nbr": 2000 + (i % 80),
                "age": "[50-60)",
                "time_in_hospital": 3 + (i % 6),
                "num_lab_procedures": 25 + (i % 30),
                "num_procedures": 1 + (i % 3),
                "num_medications": 10 + (i % 12),
                "number_outpatient": 0,
                "number_emergency": 0,
                "number_inpatient": i % 3,
                "number_diagnoses": 5 + (i % 5),
                "race": "Caucasian",
                "gender": "Female" if i % 2 == 0 else "Male",
                "admission_type_id": 1,
                "discharge_disposition_id": 1,
                "admission_source_id": 7,
                "diabetesMed": "Yes",
                "readmitted": "<30" if i % 4 == 0 else "NO"
            })
        df = pd.DataFrame(records)
        csv_buffer = io.BytesIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        return csv_buffer, df

    def test_criterion_a_to_i_lifecycle(self):
        # -----------------------------------------------------------------
        # CRITERION A: Fresh account starts completely empty
        # -----------------------------------------------------------------
        u1_id, u1_name, u1_email, u1_token = self._create_user("doctor_a")
        headers_u1 = {"Authorization": f"Bearer {u1_token}", "X-User-Id": str(u1_id)}

        res_a = self.client.get(f"/api/dashboard/stats?user_id={u1_id}", headers=headers_u1)
        self.assertEqual(res_a.status_code, 200)
        data_a = res_a.get_json()
        kpi_a = data_a["kpi"]

        self.assertEqual(kpi_a["datasets"], 0, "Fresh account must have 0 datasets")
        self.assertEqual(kpi_a["encounters"], 0, "Fresh account must have 0 encounters")
        self.assertEqual(kpi_a["projects"], 0, "Fresh account must have 0 projects")
        self.assertEqual(kpi_a["association_rules"], 0, "Fresh account must have 0 rules")
        self.assertEqual(kpi_a["patient_clusters"], 0, "Fresh account must have 0 clusters")
        self.assertIsNone(kpi_a["best_model_roc_auc"], "Fresh account must have None for ROC-AUC")
        self.assertEqual(len(data_a["association_rules_top_lift"]), 0)
        self.assertEqual(len(data_a["patient_clustering"]), 0)
        self.assertIsNone(data_a["readmission_analysis"])

        # -----------------------------------------------------------------
        # CRITERION B: Upload 240-row dataset -> displays 240 encounters, 0 rules, 0 clusters, ROC-AUC None
        # -----------------------------------------------------------------
        csv_buf_240, df_240 = self._generate_synthetic_csv(240)
        upload_res = self.client.post(
            "/api/datasets/upload",
            data={"file": (csv_buf_240, "cohort_240.csv"), "name": "Synthetic Cohort 240", "description": "240 records"},
            headers={"Authorization": f"Bearer {u1_token}"},
            content_type="multipart/form-data"
        )
        self.assertEqual(upload_res.status_code, 201)
        ds1_id = upload_res.get_json()["dataset"]["id"]

        # Request dashboard stats for this specific dataset
        res_b = self.client.get(f"/api/dashboard/stats?dataset_id={ds1_id}&user_id={u1_id}", headers=headers_u1)
        self.assertEqual(res_b.status_code, 200)
        data_b = res_b.get_json()
        kpi_b = data_b["kpi"]

        self.assertEqual(kpi_b["datasets"], 1)
        self.assertEqual(kpi_b["encounters"], 240, "Must display exactly 240 encounters")
        self.assertEqual(kpi_b["association_rules"], 0, "Must have 0 association rules before mining")
        self.assertEqual(kpi_b["patient_clusters"], 0, "Must have 0 clusters before clustering")
        self.assertIsNone(kpi_b["best_model_roc_auc"], "Must have None (Not yet analyzed) for ROC-AUC")
        self.assertEqual(data_b["dataset_overview"]["total_encounters"], 240)
        self.assertEqual(data_b["dataset_overview"]["not_readmitted_count"] + data_b["dataset_overview"]["readmitted_count"], 240)

        # -----------------------------------------------------------------
        # CRITERION C: Run ARM -> only rules from that dataset appear
        # -----------------------------------------------------------------
        arm_res = self.client.post("/api/mining/apriori", json={
            "dataset_id": ds1_id,
            "min_support": 0.05,
            "min_confidence": 0.3,
            "min_lift": 1.0,
            "target_consequent": "readmitted = <30"
        }, headers=headers_u1)
        self.assertEqual(arm_res.status_code, 200)
        arm_data = arm_res.get_json()
        arm_rules_count = len(arm_data.get("rules", []))
        self.assertGreater(arm_rules_count, 0)

        res_c = self.client.get(f"/api/dashboard/stats?dataset_id={ds1_id}&user_id={u1_id}", headers=headers_u1)
        data_c = res_c.get_json()
        self.assertEqual(data_c["kpi"]["association_rules"], arm_rules_count)
        self.assertGreater(len(data_c["association_rules_top_lift"]), 0)

        # -----------------------------------------------------------------
        # CRITERION D: Run Clustering -> cluster sizes sum to 240
        # -----------------------------------------------------------------
        cluster_res = self.client.post("/api/clustering/kmeans", json={
            "dataset_id": ds1_id,
            "k": 4,
            "features": ["time_in_hospital", "num_lab_procedures", "num_medications", "number_inpatient"]
        }, headers=headers_u1)
        self.assertEqual(cluster_res.status_code, 200)
        cl_data = cluster_res.get_json()
        sum_sizes = sum(c["size"] for c in cl_data["clusters"])
        self.assertEqual(sum_sizes, 240, "Cluster sizes must sum to exactly 240")

        res_d = self.client.get(f"/api/dashboard/stats?dataset_id={ds1_id}&user_id={u1_id}", headers=headers_u1)
        data_d = res_d.get_json()
        self.assertEqual(data_d["kpi"]["patient_clusters"], 4)
        self.assertEqual(len(data_d["patient_clustering"]), 4)

        # -----------------------------------------------------------------
        # CRITERION E: Run Decision Tree -> ROC-AUC calculated from test-set
        # -----------------------------------------------------------------
        dt_res = self.client.post("/api/readmission/train", json={
            "dataset_id": ds1_id,
            "target_col": "readmitted",
            "max_depth": 3,
            "min_samples_leaf": 5
        }, headers=headers_u1)
        self.assertEqual(dt_res.status_code, 200)
        dt_data = dt_res.get_json()
        roc_auc_val = dt_data["roc_auc"]
        self.assertIsNotNone(roc_auc_val)

        res_e = self.client.get(f"/api/dashboard/stats?dataset_id={ds1_id}&user_id={u1_id}", headers=headers_u1)
        data_e = res_e.get_json()
        self.assertEqual(data_e["kpi"]["best_model_roc_auc"], round(roc_auc_val, 3))
        self.assertIsNotNone(data_e["readmission_analysis"])
        self.assertEqual(data_e["readmission_analysis"]["roc_auc"], round(roc_auc_val, 3))

        # -----------------------------------------------------------------
        # CRITERION F: Switch dataset -> all dataset-dependent content updates immediately
        # -----------------------------------------------------------------
        csv_buf_50, _ = self._generate_synthetic_csv(50)
        upload_res_2 = self.client.post(
            "/api/datasets/upload",
            data={"file": (csv_buf_50, "cohort_50.csv"), "name": "Synthetic Cohort 50", "description": "50 records"},
            headers={"Authorization": f"Bearer {u1_token}"},
            content_type="multipart/form-data"
        )
        self.assertEqual(upload_res_2.status_code, 201)
        ds2_id = upload_res_2.get_json()["dataset"]["id"]

        # Fetch stats for ds2 (50 rows, not analyzed yet)
        res_f = self.client.get(f"/api/dashboard/stats?dataset_id={ds2_id}&user_id={u1_id}", headers=headers_u1)
        data_f = res_f.get_json()
        self.assertEqual(data_f["kpi"]["encounters"], 50, "Switching to dataset 2 must show 50 encounters")
        self.assertEqual(data_f["kpi"]["association_rules"], 0, "Dataset 2 has 0 rules")
        self.assertEqual(data_f["kpi"]["patient_clusters"], 0, "Dataset 2 has 0 clusters")
        self.assertIsNone(data_f["kpi"]["best_model_roc_auc"], "Dataset 2 has no model yet")
        self.assertIsNone(data_f["readmission_analysis"])

        # Switch back to ds1 (240 rows)
        res_f_back = self.client.get(f"/api/dashboard/stats?dataset_id={ds1_id}&user_id={u1_id}", headers=headers_u1)
        data_f_back = res_f_back.get_json()
        self.assertEqual(data_f_back["kpi"]["encounters"], 240)
        self.assertEqual(data_f_back["kpi"]["association_rules"], arm_rules_count)
        self.assertEqual(data_f_back["kpi"]["patient_clusters"], 4)

        # -----------------------------------------------------------------
        # CRITERION G: Persistence / page refresh -> correct values remain
        # -----------------------------------------------------------------
        res_g = self.client.get(f"/api/dashboard/stats?dataset_id={ds1_id}&user_id={u1_id}", headers=headers_u1)
        data_g = res_g.get_json()
        self.assertEqual(data_g["kpi"]["encounters"], 240)
        self.assertEqual(data_g["kpi"]["association_rules"], arm_rules_count)
        self.assertEqual(data_g["kpi"]["patient_clusters"], 4)
        self.assertEqual(data_g["kpi"]["best_model_roc_auc"], round(roc_auc_val, 3))

        # -----------------------------------------------------------------
        # CRITERION H: Sign in as another user -> user isolation
        # -----------------------------------------------------------------
        u2_id, u2_name, u2_email, u2_token = self._create_user("doctor_b")
        headers_u2 = {"Authorization": f"Bearer {u2_token}", "X-User-Id": str(u2_id)}

        res_h = self.client.get(f"/api/dashboard/stats?user_id={u2_id}", headers=headers_u2)
        data_h = res_h.get_json()
        self.assertEqual(data_h["kpi"]["datasets"], 0, "User 2 cannot see User 1's datasets")
        self.assertEqual(data_h["kpi"]["encounters"], 0, "User 2 cannot see User 1's encounters")
        self.assertEqual(data_h["kpi"]["association_rules"], 0, "User 2 cannot see User 1's rules")

        # User 2 attempting to view User 1's dataset ID gets clean zero or own data
        res_h_forbidden = self.client.get(f"/api/dashboard/stats?dataset_id={ds1_id}&user_id={u2_id}", headers=headers_u2)
        data_h_forbidden = res_h_forbidden.get_json()
        self.assertEqual(data_h_forbidden["kpi"]["datasets"], 0)
        self.assertEqual(data_h_forbidden["kpi"]["encounters"], 0)

        # -----------------------------------------------------------------
        # CRITERION I: Delete dataset -> metrics and analysis results disappear
        # -----------------------------------------------------------------
        del_res = self.client.delete(f"/api/datasets/{ds1_id}", headers=headers_u1)
        self.assertEqual(del_res.status_code, 200)

        # Querying with deleted dataset_id or fallback
        res_i = self.client.get(f"/api/dashboard/stats?user_id={u1_id}", headers=headers_u1)
        data_i = res_i.get_json()
        # Only ds2 (50 rows) remains
        self.assertEqual(data_i["kpi"]["datasets"], 1)
        self.assertEqual(data_i["kpi"]["encounters"], 50)
        self.assertEqual(data_i["kpi"]["association_rules"], 0, "Deleted dataset rules must be gone")
        self.assertEqual(data_i["kpi"]["patient_clusters"], 0, "Deleted dataset clusters must be gone")
        self.assertIsNone(data_i["kpi"]["best_model_roc_auc"], "Deleted dataset models must be gone")

if __name__ == "__main__":
    unittest.main()
