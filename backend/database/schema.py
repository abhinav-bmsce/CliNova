import sqlite3
from backend.core.config import settings

SCHEMA_SQL = """
-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT,
    role_id INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT
);

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    target_objective TEXT,
    owner_id INTEGER NOT NULL,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 4. PROJECT MEMBERS TABLE (Multi-user collaboration)
CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    member_role TEXT NOT NULL DEFAULT 'contributor', -- 'owner', 'contributor', 'viewer'
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 5. DATASETS TABLE
CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    source TEXT,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    row_count INTEGER DEFAULT 0,
    column_count INTEGER DEFAULT 0,
    owner_id INTEGER NOT NULL,
    project_id INTEGER,
    is_processed INTEGER DEFAULT 0,
    parent_dataset_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
    FOREIGN KEY (parent_dataset_id) REFERENCES datasets (id) ON DELETE SET NULL
);

-- 6. DATASET COLUMNS TABLE (Schema profiling)
CREATE TABLE IF NOT EXISTS dataset_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    column_name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    null_count INTEGER DEFAULT 0,
    distinct_count INTEGER DEFAULT 0,
    sample_values_json TEXT,
    FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE
);

-- 7. PREPROCESSING JOBS TABLE
CREATE TABLE IF NOT EXISTS preprocessing_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    config_json TEXT NOT NULL,
    resulting_dataset_id INTEGER,
    rows_before INTEGER,
    rows_after INTEGER,
    cols_before INTEGER,
    cols_after INTEGER,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (resulting_dataset_id) REFERENCES datasets (id) ON DELETE SET NULL
);

-- 8. ANALYSIS JOBS TABLE (Master history of all KDD runs)
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_code TEXT UNIQUE NOT NULL, -- e.g. AN-0040
    project_id INTEGER NOT NULL,
    dataset_id INTEGER,
    user_id INTEGER NOT NULL,
    algorithm TEXT NOT NULL, -- 'Apriori', 'FP-Growth', 'K-Means', 'Decision Tree'
    parameters_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'running', 'completed', 'failed'
    execution_time_ms INTEGER DEFAULT 0,
    results_summary_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 9. FREQUENT ITEMSETS TABLE
CREATE TABLE IF NOT EXISTS frequent_itemsets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    itemset_json TEXT NOT NULL,
    support REAL NOT NULL,
    length INTEGER NOT NULL,
    FOREIGN KEY (analysis_id) REFERENCES analysis_jobs (id) ON DELETE CASCADE
);

-- 10. ASSOCIATION RULES TABLE
CREATE TABLE IF NOT EXISTS association_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    antecedents_json TEXT NOT NULL,
    consequents_json TEXT NOT NULL,
    support REAL NOT NULL,
    confidence REAL NOT NULL,
    lift REAL NOT NULL,
    leverage REAL NOT NULL,
    conviction REAL NOT NULL,
    is_readmission_related INTEGER DEFAULT 0,
    FOREIGN KEY (analysis_id) REFERENCES analysis_jobs (id) ON DELETE CASCADE
);

-- 11. CLUSTER RESULTS TABLE
CREATE TABLE IF NOT EXISTS cluster_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    cluster_index INTEGER NOT NULL,
    size INTEGER NOT NULL,
    percentage REAL NOT NULL,
    readmission_rate REAL NOT NULL,
    centroids_json TEXT NOT NULL,
    profile_summary TEXT,
    FOREIGN KEY (analysis_id) REFERENCES analysis_jobs (id) ON DELETE CASCADE
);

-- 12. MODEL RESULTS TABLE (Decision Tree & Classification)
CREATE TABLE IF NOT EXISTS model_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    target_variable TEXT NOT NULL,
    roc_auc REAL,
    accuracy REAL,
    precision REAL,
    recall REAL,
    f1_score REAL,
    confusion_matrix_json TEXT,
    feature_importance_json TEXT,
    tree_rules_json TEXT,
    FOREIGN KEY (analysis_id) REFERENCES analysis_jobs (id) ON DELETE CASCADE
);

-- 13. AI EXPLANATIONS TABLE
CREATE TABLE IF NOT EXISTS ai_explanations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    explanation TEXT NOT NULL,
    grounded_evidence_json TEXT,
    provider TEXT DEFAULT 'clinova-expert-engine',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 14. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_code TEXT UNIQUE NOT NULL,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'pdf', -- 'pdf', 'csv', 'json'
    file_path TEXT NOT NULL,
    summary_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 15. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects (owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_lookup ON project_members (project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_project ON datasets (project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project ON analysis_jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_association_rules_analysis ON association_rules (analysis_id);
CREATE INDEX IF NOT EXISTS idx_cluster_results_analysis ON cluster_results (analysis_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp);
"""

def apply_schema(conn: sqlite3.Connection):
    """Execute DDL statements to ensure all tables and indexes exist."""
    conn.executescript(SCHEMA_SQL)
    conn.commit()
