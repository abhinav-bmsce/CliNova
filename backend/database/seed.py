import os
import sqlite3
import json
from pathlib import Path
from backend.core.security import hash_password
from backend.core.config import settings
from backend.database.dataset_generator import generate_uci_diabetes_dataset

DEFAULT_ROLES = [
    (1, "Administrator", "Full system administration, user management, and audit inspection."),
    (2, "Researcher", "Full access to KDD pipelines, dataset uploads, mining execution, and reports."),
    (3, "Viewer", "Read-only access to view discovered patterns, visual analytics, and project summaries.")
]

DEFAULT_USERS = [
    (
        "arao@clinova-health.org",
        "arao",
        "Dr. Ananya Rao",
        "Clinical Outcomes & Predictive Modeling",
        "Clinova2026!Secure",
        2 # Researcher
    ),
    (
        "elena.vance@clinova-health.org",
        "evance",
        "Dr. Elena Vance",
        "Clinical Informatics & Data Science",
        "Clinova2026!Secure",
        1 # Administrator
    ),
    (
        "marcus.reid@clinova-health.org",
        "mreid",
        "Dr. Marcus Reid",
        "Cardiovascular Outcomes Research",
        "Clinova2026!Secure",
        2 # Researcher
    ),
    (
        "sarah.chen@clinova-health.org",
        "schen",
        "Sarah Chen, RN",
        "Clinical Quality & Safety Directorate",
        "Clinova2026!Secure",
        3 # Viewer
    )
]

def seed_database(conn: sqlite3.Connection):
    """Seed essential roles and default staff accounts. Only seed demo data if CLINOVA_DEMO_MODE is enabled."""
    cursor = conn.cursor()

    # 1. Seed Roles
    for role_id, name, desc in DEFAULT_ROLES:
        cursor.execute("""
            INSERT OR IGNORE INTO roles (id, name, description)
            VALUES (?, ?, ?);
        """, (role_id, name, desc))

    # 2. Seed Default Staff Accounts
    user_id_map = {}
    for email, username, full_name, dept, raw_pass, role_id in DEFAULT_USERS:
        cursor.execute("SELECT id FROM users WHERE email = ?;", (email,))
        existing = cursor.fetchone()
        if existing:
            user_id_map[username] = existing[0]
        else:
            hashed = hash_password(raw_pass)
            cursor.execute("""
                INSERT INTO users (email, username, password_hash, full_name, department, role_id, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1);
            """, (email, username, hashed, full_name, dept, role_id))
            user_id_map[username] = cursor.lastrowid

    # 3. Seed Demonstration Benchmark Records ONLY IF explicitly requested via environment variable
    demo_enabled = os.getenv("CLINOVA_DEMO_MODE", "false").lower() in ("true", "1", "yes")
    if demo_enabled:
        seed_demo_data(conn, user_id_map)
    else:
        conn.commit()

def seed_demo_data(conn: sqlite3.Connection, user_id_map: dict):
    """Seed optional demo dataset, benchmark projects, and reference KDD analysis runs."""
    cursor = conn.cursor()
    arao_id = user_id_map.get("arao", 1)
    evance_id = user_id_map.get("evance", 2)

    # 1. Ensure Dataset File Exists on Disk
    csv_file_path = generate_uci_diabetes_dataset(5000)
    file_size = Path(csv_file_path).stat().st_size

    # 2. Seed Projects
    projects_def = [
        ("Readmission Study", "Knowledge discovery study identifying predictors and high-risk pathways for 30-day hospital readmission.", "Evaluate decision tree classifiers and feature importance rankings on diabetic inpatient encounters.", arao_id),
        ("Patient Segmentation", "Unsupervised patient clustering exploring metabolic phenotypes and distinct comorbidity trajectories.", "Identify high-silhouette patient clusters with varying baseline readmission frequencies.", arao_id),
        ("Hospital Associations", "Frequent pattern and association rule mining over diagnosis co-occurrences and pharmacy orders.", "Discover actionable rules with lift > 2.0 to inform clinical discharge protocols.", arao_id),
        ("Glycemic Complication Profiling", "Retrospective cohort study analyzing HbA1c elevation and insulin modification impacts.", "Correlate medication adjustment with lengths of hospital stay.", evance_id)
    ]

    project_id_map = {}
    for name, desc, target, owner in projects_def:
        cursor.execute("SELECT id FROM projects WHERE name = ?;", (name,))
        row = cursor.fetchone()
        if row:
            project_id_map[name] = row[0]
        else:
            cursor.execute("""
                INSERT INTO projects (name, description, target_objective, owner_id)
                VALUES (?, ?, ?, ?);
            """, (name, desc, target, owner))
            pid = cursor.lastrowid
            project_id_map[name] = pid
            cursor.execute("""
                INSERT OR IGNORE INTO project_members (project_id, user_id, member_role)
                VALUES (?, ?, 'owner');
            """, (pid, owner))
            if owner != arao_id:
                cursor.execute("""
                    INSERT OR IGNORE INTO project_members (project_id, user_id, member_role)
                    VALUES (?, ?, 'contributor');
                """, (pid, arao_id))

    # 3. Seed Dataset Record
    cursor.execute("SELECT id FROM datasets WHERE name LIKE '%UCI Diabetes%';")
    dataset_row = cursor.fetchone()
    if not dataset_row:
        cursor.execute("""
            INSERT INTO datasets (name, description, source, filename, file_path, file_size_bytes, row_count, column_count, owner_id, project_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            "UCI Diabetes 130-US Hospitals (1999-2008)",
            "Clinical encounter records from 130 US hospitals representing 10 years of diabetic inpatient encounters, 50 attributes, medication regimens, and readmission outcomes.",
            "https://archive.ics.uci.edu/dataset/296/diabetes+130-us+hospitals+for+years+1999-2008",
            "diabetic_data.csv",
            csv_file_path,
            file_size,
            101766,
            50,
            arao_id,
            project_id_map.get("Readmission Study")
        ))
        dataset_id = cursor.lastrowid
    else:
        dataset_id = dataset_row[0]

    # 4. Seed Preprocessing Job Record
    cursor.execute("SELECT id FROM preprocessing_jobs WHERE dataset_id = ?;", (dataset_id,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO preprocessing_jobs (dataset_id, user_id, config_json, resulting_dataset_id, rows_before, rows_after, cols_before, cols_after, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed');
        """, (
            dataset_id,
            arao_id,
            json.dumps({
                "pipeline": "Clinical KDD Data Preparation Protocol v2.4",
                "imputation_strategy": "Median for continuous vitals / Mode for discrete clinical factors",
                "deduplication": "Unique encounter isolation by encounter_id",
                "normalization": "Z-Score Standardization on numerical predictors",
                "leakage_prevention": "Patient-level grouped cross-validation split (patient_nbr partition)",
                "target_definition": "Binarized 30-day early hospital readmission (<30 days vs NO/>30)"
            }),
            dataset_id,
            101766,
            101766,
            50,
            50
        ))

    # 5. Seed Benchmark Analysis History Jobs
    # AN-0040: Apriori
    cursor.execute("SELECT id FROM analysis_jobs WHERE analysis_code = 'AN-0040';")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO analysis_jobs (analysis_code, project_id, dataset_id, user_id, algorithm, parameters_json, status, execution_time_ms, created_at, completed_at)
            VALUES ('AN-0040', ?, ?, ?, 'Apriori', ?, 'completed', 1420, '2025-01-25 14:30:00', '2025-01-25 14:30:01');
        """, (
            project_id_map.get("Hospital Associations", 1),
            dataset_id,
            arao_id,
            json.dumps({"min_support": 0.03, "min_confidence": 0.60, "min_lift": 1.5, "consequent_target": "readmitted=<30"})
        ))
        an40_id = cursor.lastrowid

        rules = [
            (["num_medications > 5", "number_diagnoses > 3"], ["readmitted = <30"], 0.048, 0.812, 2.78, 0.031, 3.42, 1),
            (["number_inpatient > 2", "insulin = Down"], ["readmitted = <30"], 0.039, 0.764, 2.31, 0.022, 2.85, 1),
            (["time_in_hospital > 6", "num_lab_procedures > 50"], ["readmitted = <30"], 0.052, 0.698, 1.96, 0.025, 2.34, 1),
            (["age = [70-80)", "diabetesMed = Yes", "number_inpatient > 1"], ["readmitted = <30"], 0.041, 0.680, 1.88, 0.019, 2.15, 1),
            (["discharge_disposition_id = SNF", "num_medications > 15"], ["readmitted = <30"], 0.035, 0.655, 1.82, 0.016, 2.02, 1),
        ]
        for ant, con, supp, conf, lift, lev, conv, is_readm in rules:
            cursor.execute("""
                INSERT INTO association_rules (analysis_id, antecedents_json, consequents_json, support, confidence, lift, leverage, conviction, is_readmission_related)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (an40_id, json.dumps(ant), json.dumps(con), supp, conf, lift, lev, conv, is_readm))

    # AN-0041: FP-Growth
    cursor.execute("SELECT id FROM analysis_jobs WHERE analysis_code = 'AN-0041';")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO analysis_jobs (analysis_code, project_id, dataset_id, user_id, algorithm, parameters_json, status, execution_time_ms, created_at, completed_at)
            VALUES ('AN-0041', ?, ?, ?, 'FP-Growth', ?, 'completed', 380, '2025-01-25 16:12:00', '2025-01-25 16:12:00');
        """, (
            project_id_map.get("Hospital Associations", 1),
            dataset_id,
            arao_id,
            json.dumps({"min_support": 0.03, "min_confidence": 0.60, "min_lift": 1.5, "consequent_target": "readmitted=<30"})
        ))
        an41_id = cursor.lastrowid
        rules_fp = [
            (["num_medications > 5", "number_diagnoses > 3"], ["readmitted = <30"], 0.048, 0.812, 2.78, 0.031, 3.42, 1),
            (["number_inpatient > 2", "insulin = Down"], ["readmitted = <30"], 0.039, 0.764, 2.31, 0.022, 2.85, 1),
            (["time_in_hospital > 6", "num_lab_procedures > 50"], ["readmitted = <30"], 0.052, 0.698, 1.96, 0.025, 2.34, 1),
            (["age = [70-80)", "diabetesMed = Yes", "number_inpatient > 1"], ["readmitted = <30"], 0.041, 0.680, 1.88, 0.019, 2.15, 1),
            (["discharge_disposition_id = SNF", "num_medications > 15"], ["readmitted = <30"], 0.035, 0.655, 1.82, 0.016, 2.02, 1),
        ]
        for ant, con, supp, conf, lift, lev, conv, is_readm in rules_fp:
            cursor.execute("""
                INSERT INTO association_rules (analysis_id, antecedents_json, consequents_json, support, confidence, lift, leverage, conviction, is_readmission_related)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (an41_id, json.dumps(ant), json.dumps(con), supp, conf, lift, lev, conv, is_readm))

    # AN-0042: K-Means Clustering (5 Clusters)
    cursor.execute("SELECT id FROM analysis_jobs WHERE analysis_code = 'AN-0042';")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO analysis_jobs (analysis_code, project_id, dataset_id, user_id, algorithm, parameters_json, status, execution_time_ms, created_at, completed_at)
            VALUES ('AN-0042', ?, ?, ?, 'K-Means', ?, 'completed', 2150, '2025-01-26 09:47:00', '2025-01-26 09:47:02');
        """, (
            project_id_map.get("Patient Segmentation", 1),
            dataset_id,
            arao_id,
            json.dumps({"k": 5, "features": ["time_in_hospital", "num_lab_procedures", "num_procedures", "num_medications", "number_inpatient"], "scaler": "standard"})
        ))
        an42_id = cursor.lastrowid

        clusters = [
            (1, 27884, 27.4, 0.187, {"time_in_hospital": 6.8, "num_medications": 22.4, "number_inpatient": 2.1, "age_median": 75}, "Cluster 1: Elderly Multi-morbidity Cohort (High Readmission Risk: 18.7%)"),
            (2, 20455, 20.1, 0.142, {"time_in_hospital": 5.1, "num_medications": 18.2, "number_inpatient": 1.2, "age_median": 62}, "Cluster 2: Insulin-Adjusted Metabolic Instability (Readmission Rate: 14.2%)"),
            (3, 19946, 19.6, 0.062, {"time_in_hospital": 2.6, "num_medications": 9.8, "number_inpatient": 0.2, "age_median": 48}, "Cluster 3: Acute Transient Normative Recovery (Low Readmission: 6.2%)"),
            (4, 18114, 17.8, 0.098, {"time_in_hospital": 4.2, "num_medications": 14.5, "number_inpatient": 0.5, "age_median": 56}, "Cluster 4: Post-Procedural / Surgical Inpatients (Readmission Rate: 9.8%)"),
            (5, 15367, 15.1, 0.165, {"time_in_hospital": 7.4, "num_medications": 24.1, "number_inpatient": 1.8, "age_median": 71}, "Cluster 5: Cardio-Renal Complicated Comorbidities (High Readmission: 16.5%)"),
        ]
        for c_idx, size, pct, readm_rate, centroids, profile in clusters:
            cursor.execute("""
                INSERT INTO cluster_results (analysis_id, cluster_index, size, percentage, readmission_rate, centroids_json, profile_summary)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (an42_id, c_idx, size, pct, readm_rate, json.dumps(centroids), profile))

    # AN-0043: Decision Tree Classifier
    cursor.execute("SELECT id FROM analysis_jobs WHERE analysis_code = 'AN-0043';")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO analysis_jobs (analysis_code, project_id, dataset_id, user_id, algorithm, parameters_json, status, execution_time_ms, created_at, completed_at)
            VALUES ('AN-0043', ?, ?, ?, 'Decision Tree', ?, 'completed', 1840, '2025-01-26 10:24:00', '2025-01-26 10:24:02');
        """, (
            project_id_map.get("Readmission Study", 1),
            dataset_id,
            arao_id,
            json.dumps({"max_depth": 5, "min_samples_leaf": 20, "split_strategy": "grouped_patient_id", "target": "readmitted_<30"})
        ))
        an43_id = cursor.lastrowid

        conf_matrix = [[17480, 2450], [420, 1340]]
        feat_imp = [
            {"feature": "Number of Inpatient Visits", "importance": 0.28},
            {"feature": "Time in Hospital", "importance": 0.18},
            {"feature": "Number of Medications", "importance": 0.15},
            {"feature": "Number of Diagnoses", "importance": 0.12},
            {"feature": "Age Group", "importance": 0.09},
            {"feature": "Insulin Regimen Change", "importance": 0.07},
            {"feature": "Discharge to SNF", "importance": 0.06},
            {"feature": "Number of Emergency Visits", "importance": 0.05}
        ]
        cursor.execute("""
            INSERT INTO model_results (analysis_id, target_variable, roc_auc, accuracy, precision, recall, f1_score, confusion_matrix_json, feature_importance_json, tree_rules_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            an43_id,
            "readmitted_<30",
            0.84,
            0.82,
            0.78,
            0.76,
            0.77,
            json.dumps(conf_matrix),
            json.dumps(feat_imp),
            json.dumps([
                "IF number_inpatient > 1.5 AND time_in_hospital > 5.5 THEN Readmitted Prob = 0.78",
                "IF number_inpatient > 1.5 AND time_in_hospital <= 5.5 AND insulin = Down THEN Readmitted Prob = 0.65",
                "IF number_inpatient <= 1.5 AND num_medications > 18.5 AND num_diagnoses > 6.5 THEN Readmitted Prob = 0.38",
                "IF number_inpatient <= 1.5 AND num_medications <= 18.5 THEN Readmitted Prob = 0.08"
            ])
        ))

    conn.commit()
