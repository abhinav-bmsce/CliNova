import unittest
import io
import json
import uuid
import os
import pandas as pd
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import create_app
from backend.database.session import init_db

class EmptyStateAndUserIsolationTestCase(unittest.TestCase):
    """Rigorous verification of user isolation, clean zero-state dashboard, and real file ingestion."""

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_new_user_starts_with_clean_zero_state(self):
        """Newly registered user must see 0 datasets, 0 encounters, 0 rules, 0 clusters, and no preloaded analytics."""
        uid = uuid.uuid4().hex[:6]
        username = f"user_{uid}"
        email = f"{username}@clinova-research.org"

        # 1. Register new researcher
        res_reg = self.client.post("/api/auth/register", json={
            "email": email,
            "username": username,
            "password": "SecurePassword2026!",
            "full_name": f"Dr. Test User {uid}",
            "department": "Department of Biostatistics",
            "role_id": 2
        })
        self.assertEqual(res_reg.status_code, 201)

        # 2. Login to get JWT
        res_login = self.client.post("/api/auth/login", json={
            "username": username,
            "password": "SecurePassword2026!"
        })
        self.assertEqual(res_login.status_code, 200)
        token = res_login.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Verify Dashboard stats are strictly clean zeros
        res_stats = self.client.get("/api/dashboard/stats", headers=headers)
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.get_json()

        self.assertEqual(stats["kpi"]["datasets"], 0)
        self.assertEqual(stats["kpi"]["encounters"], 0)
        self.assertEqual(stats["kpi"]["association_rules"], 0)
        self.assertEqual(stats["kpi"]["patient_clusters"], 0)
        self.assertIsNone(stats["kpi"]["best_model_roc_auc"])

        self.assertEqual(stats["dataset_overview"]["total_encounters"], 0)
        self.assertEqual(stats["association_rules_top_lift"], [])
        self.assertEqual(stats["patient_clustering"], [])
        self.assertIsNone(stats["readmission_analysis"])
        self.assertEqual(stats["feature_importance"], [])
        self.assertEqual(stats["recent_discoveries"], [])
        self.assertEqual(stats["recent_analyses"], [])

        # 4. Verify AI Assistant honest response on zero-state
        res_ai = self.client.post("/api/ai/chat", headers=headers, json={
            "query": "Explain the strongest rule by lift."
        })
        self.assertEqual(res_ai.status_code, 200)
        self.assertIn("No completed analytical runs", res_ai.get_json()["explanation"])

    def test_02_real_csv_and_xlsx_upload_and_profiling(self):
        """Verify real CSV and XLSX upload, column profiling table population, and preview."""
        uid = uuid.uuid4().hex[:6]
        username = f"user_{uid}"
        email = f"{username}@clinova-research.org"

        # Register & Login
        self.client.post("/api/auth/register", json={
            "email": email,
            "username": username,
            "password": "SecurePassword2026!",
            "full_name": f"Dr. Uploader {uid}",
            "department": "Cardiology",
            "role_id": 2
        })
        res_login = self.client.post("/api/auth/login", json={
            "username": username,
            "password": "SecurePassword2026!"
        })
        token = res_login.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Upload Real CSV Dataset
        csv_content = """encounter_id,patient_nbr,age,time_in_hospital,num_lab_procedures,num_procedures,num_medications,number_inpatient,readmitted
101,1001,[60-70),4,45,1,12,0,NO
102,1002,[70-80),8,62,2,24,2,<30
103,1003,[50-60),2,30,0,8,0,NO
104,1004,[80-90),6,55,1,18,3,<30
105,1005,[40-50),3,25,0,10,0,NO
106,1006,[70-80),5,48,2,16,1,<30
107,1007,[60-70),7,70,3,22,2,<30
108,1008,[50-60),1,15,0,6,0,NO
"""
        data = {
            "name": f"Cardiac Pilot {uid}",
            "description": "Retrospective cardiovascular pilot encounter dataset.",
            "file": (io.BytesIO(csv_content.encode("utf-8")), f"cardiac_{uid}.csv")
        }
        res_up_csv = self.client.post("/api/datasets/upload", headers=headers, data=data, content_type="multipart/form-data")
        self.assertEqual(res_up_csv.status_code, 201)
        csv_ds = res_up_csv.get_json()["dataset"]
        self.assertEqual(csv_ds["row_count"], 8)
        self.assertEqual(csv_ds["column_count"], 9)
        csv_ds_id = csv_ds["id"]

        # Preview CSV Dataset
        res_prev_csv = self.client.get(f"/api/datasets/{csv_ds_id}/preview", headers=headers)
        self.assertEqual(res_prev_csv.status_code, 200)
        prev_data = res_prev_csv.get_json()
        self.assertEqual(len(prev_data["rows"]), 8)
        self.assertIn("columns", prev_data)
        col_names = [c["name"] for c in prev_data["columns"]]
        self.assertIn("time_in_hospital", col_names)
        self.assertIn("readmitted", col_names)

        # 2. Upload Real XLSX Dataset
        xlsx_df = pd.DataFrame({
            "encounter_id": [201, 202, 203, 204, 205],
            "patient_nbr": [501, 502, 503, 504, 505],
            "time_in_hospital": [3, 7, 2, 9, 4],
            "num_medications": [11, 25, 7, 30, 15],
            "number_inpatient": [0, 2, 0, 3, 1],
            "readmitted": ["NO", "<30", "NO", "<30", "NO"]
        })
        xlsx_buf = io.BytesIO()
        xlsx_df.to_excel(xlsx_buf, index=False, engine="openpyxl")
        xlsx_buf.seek(0)

        data_xlsx = {
            "name": f"Metabolic Registry {uid}",
            "description": "Registry encounters in Excel format.",
            "file": (xlsx_buf, f"metabolic_{uid}.xlsx")
        }
        res_up_xlsx = self.client.post("/api/datasets/upload", headers=headers, data=data_xlsx, content_type="multipart/form-data")
        self.assertEqual(res_up_xlsx.status_code, 201)
        xlsx_ds = res_up_xlsx.get_json()["dataset"]
        self.assertEqual(xlsx_ds["row_count"], 5)
        self.assertEqual(xlsx_ds["column_count"], 6)

        # Verify preview on XLSX dataset
        res_prev_xlsx = self.client.get(f"/api/datasets/{xlsx_ds['id']}/preview", headers=headers)
        self.assertEqual(res_prev_xlsx.status_code, 200)
        self.assertEqual(len(res_prev_xlsx.get_json()["rows"]), 5)

        # 3. Verify user's datasets count updated to exactly 2
        res_datasets = self.client.get("/api/datasets", headers=headers)
        self.assertEqual(res_datasets.status_code, 200)
        user_datasets = res_datasets.get_json()["datasets"]
        self.assertEqual(len(user_datasets), 2)

    def test_03_multi_user_isolation_and_permissions(self):
        """Ensure User A cannot see User B's private datasets or delete them."""
        uid_a = uuid.uuid4().hex[:6]
        user_a = f"usera_{uid_a}"
        email_a = f"{user_a}@clinova-research.org"

        uid_b = uuid.uuid4().hex[:6]
        user_b = f"userb_{uid_b}"
        email_b = f"{user_b}@clinova-research.org"

        # Register User A & Upload Dataset
        self.client.post("/api/auth/register", json={
            "email": email_a, "username": user_a, "password": "SecurePassword2026!",
            "full_name": f"Dr. User A {uid_a}", "department": "Cardiology", "role_id": 2
        })
        res_login_a = self.client.post("/api/auth/login", json={"username": user_a, "password": "SecurePassword2026!"})
        headers_a = {"Authorization": f"Bearer {res_login_a.get_json()['token']}"}

        csv_content = "patient_nbr,encounter_id,val\n1,10,5\n2,20,6\n"
        up_res = self.client.post("/api/datasets/upload", headers=headers_a, data={
            "name": f"Dataset A {uid_a}",
            "file": (io.BytesIO(csv_content.encode("utf-8")), f"data_a_{uid_a}.csv")
        }, content_type="multipart/form-data")
        ds_a_id = up_res.get_json()["dataset"]["id"]

        # Register User B
        self.client.post("/api/auth/register", json={
            "email": email_b, "username": user_b, "password": "SecurePassword2026!",
            "full_name": f"Dr. User B {uid_b}", "department": "Oncology", "role_id": 2
        })
        res_login_b = self.client.post("/api/auth/login", json={"username": user_b, "password": "SecurePassword2026!"})
        headers_b = {"Authorization": f"Bearer {res_login_b.get_json()['token']}"}

        # User B should see 0 datasets
        res_ds_b = self.client.get("/api/datasets", headers=headers_b)
        self.assertEqual(res_ds_b.status_code, 200)
        self.assertEqual(len(res_ds_b.get_json()["datasets"]), 0)

        # User B cannot delete User A's dataset
        res_delete_unauth = self.client.delete(f"/api/datasets/{ds_a_id}", headers=headers_b)
        self.assertEqual(res_delete_unauth.status_code, 403)

        # User A can delete their own dataset
        res_delete_auth = self.client.delete(f"/api/datasets/{ds_a_id}", headers=headers_a)
        self.assertEqual(res_delete_auth.status_code, 200)

if __name__ == "__main__":
    unittest.main()
