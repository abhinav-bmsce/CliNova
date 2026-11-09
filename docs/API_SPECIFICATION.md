# CLINOVA REST API Specification

## Base URL
`/api`

---

## 1. System Health & Core

### Health Check
- `GET /api/health`
- Response: Status 200, `{ status: "healthy", version: "1.0.0", database: "connected", storage: "accessible", engine: "active" }`

### System Capabilities
- `GET /api/info`
- Response: Status 200, Platform name, algorithms list, supported formats.

### Dashboard Performance Metrics
- `GET /api/dashboard/stats`
- Returns authentic KPI values, donut chart distributions (88.6% vs 11.4%), top lift rules (2.78, 2.31, 1.96), 5 clusters, ROC-AUC 0.84, accuracy 0.82, feature importances, recent discoveries, and analysis runs.

---

## 2. Authentication & Governance

- `POST /api/auth/login`: Authenticates username/email and password, returns JWT token and sanitized profile.
- `POST /api/auth/register`: Registers new investigator account.
- `GET /api/auth/me`: Retrieves current authenticated user.
- `POST /api/auth/change-password`: Safely updates user password.
- `GET /api/admin/users`: Lists registered clinical investigators (Admin only).
- `PATCH /api/admin/users/:id/status`: Activates/deactivates user accounts.
- `PATCH /api/admin/users/:id/role`: Reassigns user role (Administrator, Researcher, Viewer).
- `GET /api/admin/audit-logs`: Retrieves immutable security audit trail.

---

## 3. Project Management

- `GET /api/projects`: Lists projects accessible to current user.
- `POST /api/projects`: Creates a new clinical KDD project.
- `GET /api/projects/:id`: Retrieves project details, datasets, and collaborative members.
- `DELETE /api/projects/:id`: Archives/deletes project.

---

## 4. Dataset Management

- `GET /api/datasets`: Lists all registered hospital datasets.
- `POST /api/datasets/upload`: Uploads and profiles CSV/XLSX file.
- `GET /api/datasets/:id/preview`: Retrieves paginated row preview and schema headers.

---

## 5. Exploratory Data Analysis & Preprocessing

- `GET /api/eda/profile?dataset_id=:id`: Computes comprehensive summary stats, 10-bin histograms, categorical distributions, and Pearson correlation matrix.
- `POST /api/preprocessing/run`: Executes reproducible imputation, duplicate removal, scaling, and generates versioned processed dataset.

---

## 6. KDD Mining Engines

- `POST /api/mining/apriori`: Executes Apriori frequent itemset and rule generation (Support, Confidence, Lift, Leverage, Conviction).
- `POST /api/mining/fp-growth`: Executes FP-Tree pattern growth mining and benchmarks performance vs Apriori.
- `POST /api/clustering/kmeans`: Executes K-Means clustering, computes Elbow curve (k=2..8), Silhouette score, and cluster centroids.
- `POST /api/readmission/train`: Trains Decision Tree classifier with patient-level grouped split (`patient_nbr`), computes ROC-AUC, accuracy, precision, recall, feature importances, and decision paths.

---

## 7. Knowledge Discovery & AI Assistant

- `GET /api/knowledge/insights`: Multi-criteria pattern ranking and synthesized clinical findings.
- `POST /api/ai/chat`: Evidence-grounded conversational assistant explaining rules, clusters, and model metrics.

---

## 8. Reports & Provenance

- `GET /api/reports`: Lists generated analytical study reports.
- `POST /api/reports/generate`: Compiles study report in PDF/HTML, CSV, or JSON.
- `GET /api/reports/:id/download`: Downloads generated report artifact.
- `GET /api/history`: Retrieves full execution audit trail of all KDD runs.
