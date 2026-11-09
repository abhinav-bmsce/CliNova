# CLINOVA Relational Database Schema

## 1. Architectural Overview

CLINOVA utilizes a normalized relational database schema with full foreign-key constraints, cascading rules, and performance indexes. The system runs on SQLite with Write-Ahead Logging (`WAL` mode) for local development and is fully compatible with PostgreSQL for production cloud deployment.

---

## 2. Table Specifications

### 2.1 Core Authentication & Access Control

#### `roles`
Stores Role-Based Access Control (RBAC) tiers.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `name` (TEXT, UNIQUE, NOT NULL): `'Administrator'`, `'Researcher'`, `'Viewer'`
- `description` (TEXT, NOT NULL)

#### `users`
Registered clinical investigators, data scientists, and reviewers.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `email` (TEXT, UNIQUE, NOT NULL)
- `username` (TEXT, UNIQUE, NOT NULL)
- `password_hash` (TEXT, NOT NULL): PBKDF2-HMAC-SHA256 with 100,000 iterations and 16-byte random salt.
- `full_name` (TEXT, NOT NULL)
- `department` (TEXT)
- `role_id` (INTEGER, FK -> `roles.id`)
- `is_active` (INTEGER, DEFAULT 1)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### 2.2 Workspace & Multi-User Collaboration

#### `projects`
Collaborative KDD studies and investigation workspaces.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `target_objective` (TEXT)
- `owner_id` (INTEGER, FK -> `users.id`)
- `is_archived` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `project_members`
Association table assigning users to projects with granular roles.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `project_id` (INTEGER, FK -> `projects.id`)
- `user_id` (INTEGER, FK -> `users.id`)
- `member_role` (TEXT): `'owner'`, `'contributor'`, `'viewer'`
- `added_at` (TIMESTAMP)
- `UNIQUE(project_id, user_id)`

---

### 2.3 Datasets & Provenance

#### `datasets`
Electronic Health Record (EHR) encounter cohorts.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `source` (TEXT)
- `filename` (TEXT, NOT NULL)
- `file_path` (TEXT, NOT NULL)
- `file_size_bytes` (INTEGER, NOT NULL)
- `row_count` (INTEGER)
- `column_count` (INTEGER)
- `owner_id` (INTEGER, FK -> `users.id`)
- `project_id` (INTEGER, FK -> `projects.id`)
- `is_processed` (INTEGER, DEFAULT 0)
- `parent_dataset_id` (INTEGER, FK -> `datasets.id`)
- `created_at` (TIMESTAMP)

#### `preprocessing_jobs`
Audit trail of reproducible data transformations.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `dataset_id` (INTEGER, FK -> `datasets.id`)
- `user_id` (INTEGER, FK -> `users.id`)
- `config_json` (TEXT, NOT NULL)
- `resulting_dataset_id` (INTEGER, FK -> `datasets.id`)
- `rows_before` (INTEGER), `rows_after` (INTEGER)
- `duplicates_removed` (INTEGER)
- `status` (TEXT)
- `created_at` (TIMESTAMP)

---

### 2.4 KDD Mining Results & Provenance

#### `analysis_jobs`
Master registry for all executed algorithms.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `analysis_code` (TEXT, UNIQUE): e.g. `'AN-0043'`
- `project_id` (INTEGER, FK -> `projects.id`)
- `dataset_id` (INTEGER, FK -> `datasets.id`)
- `user_id` (INTEGER, FK -> `users.id`)
- `algorithm` (TEXT): `'Apriori'`, `'FP-Growth'`, `'K-Means'`, `'Decision Tree'`
- `parameters_json` (TEXT)
- `status` (TEXT): `'completed'`, `'failed'`, `'running'`
- `execution_time_ms` (INTEGER)
- `created_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)

#### `association_rules`
Discovered clinical co-occurrence patterns.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `analysis_id` (INTEGER, FK -> `analysis_jobs.id`)
- `antecedents_json` (TEXT, NOT NULL)
- `consequents_json` (TEXT, NOT NULL)
- `support` (REAL), `confidence` (REAL), `lift` (REAL), `leverage` (REAL), `conviction` (REAL)
- `is_readmission_related` (INTEGER)

#### `cluster_results`
Patient phenotyping profiles from K-Means.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `analysis_id` (INTEGER, FK -> `analysis_jobs.id`)
- `cluster_index` (INTEGER)
- `size` (INTEGER), `percentage` (REAL), `readmission_rate` (REAL)
- `centroids_json` (TEXT), `profile_summary` (TEXT)

#### `model_results`
Supervised classification performance and feature importance.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `analysis_id` (INTEGER, FK -> `analysis_jobs.id`)
- `target_variable` (TEXT)
- `roc_auc` (REAL), `accuracy` (REAL), `precision` (REAL), `recall` (REAL), `f1_score` (REAL)
- `confusion_matrix_json` (TEXT)
- `feature_importance_json` (TEXT)
- `tree_rules_json` (TEXT)

---

### 2.5 Compliance, AI, and Reporting

#### `reports`
Generated study documents and artifacts.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `report_code` (TEXT, UNIQUE)
- `project_id` (INTEGER, FK -> `projects.id`)
- `user_id` (INTEGER, FK -> `users.id`)
- `title` (TEXT, NOT NULL)
- `format` (TEXT): `'pdf'`, `'csv'`, `'json'`
- `file_path` (TEXT, NOT NULL)
- `summary_json` (TEXT)
- `created_at` (TIMESTAMP)

#### `audit_logs`
Immutable HIPAA and security compliance audit trail.
- `id` (INTEGER, PK, AUTOINCREMENT)
- `user_id` (INTEGER, FK -> `users.id`)
- `action` (TEXT, NOT NULL)
- `resource_type` (TEXT, NOT NULL)
- `resource_id` (TEXT)
- `ip_address` (TEXT)
- `details` (TEXT)
- `timestamp` (TIMESTAMP)

