# CLINOVA — User Guide & Clinical KDD Manual

## 1. Introduction

CLINOVA is a professional healthcare Knowledge Discovery in Databases (KDD) SaaS platform. It guides investigators through the complete 6-stage knowledge discovery lifecycle:
1. **Data Selection:** Uploading de-identified hospital encounter records or loading the pre-bundled UCI Diabetes 130-US Hospitals dataset.
2. **Data Cleaning & Profiling:** Auditing data types, categorical frequencies, missing values, and executing reproducible imputation.
3. **Data Transformation:** Discretizing clinical vitals, binarizing transactions for ARM, and standardizing features for clustering.
4. **Data Mining:**
   - **Apriori & FP-Growth:** Mining high-confidence association rules.
   - **K-Means Clustering:** Discovering distinct patient phenotyping sub-groups.
   - **Decision Tree Classification:** Predicting 30-day early readmission with patient-level grouped leakage prevention.
5. **Pattern Evaluation:** Ranking rules by multi-criteria interestingness scores (Lift, Support, Confidence) and isolating high-risk pathways.
6. **Knowledge Presentation & Grounded AI:** Visualizing distributions and conversing with the CLINOVA Intelligence Assistant.

---

## 2. Default Clinical Roles & Users

For demonstration and access governance testing, the database is pre-seeded with four clinical personas:

| Name | Role | Email | Password | Permissions |
|---|---|---|---|---|
| **Dr. Ananya Rao** | Researcher | `arao@clinova-health.org` | `Clinova2026!Secure` | Full KDD pipelines, projects, dataset uploads, report generation |
| **Dr. Elena Vance** | Administrator | `elena.vance@clinova-health.org` | `Clinova2026!Secure` | User management, role modification, audit log inspection, project management |
| **Dr. Marcus Reid** | Researcher | `marcus.reid@clinova-health.org` | `Clinova2026!Secure` | KDD mining, cohort exploration |
| **Sarah Chen, RN** | Viewer | `sarah.chen@clinova-health.org` | `Clinova2026!Secure` | Read-only access to projects, visual analytics, and reports |

*Switching between personas can be done instantly from the top-right profile dropdown menu.*

---

## 3. Navigating the KDD Pipeline

### 3.1 Dashboard Overview
The primary cockpit displays authentic statistics from the relational database:
- **1 Datasets:** UCI Diabetes 130-US Hospitals (1999–2008).
- **101,766 Patient Encounters:** 90,145 not readmitted (88.6%), 11,621 early readmitted (11.4%).
- **4 Analysis Projects:** ICU Readmission Study, Patient Segmentation, Hospital Associations, Glycemic Profiling.
- **248 Association Rules:** Discovered multi-condition co-occurrences.
- **5 Patient Clusters:** Phenotypes with readmission rates from 6.2% to 18.7%.
- **0.84 Best Model ROC-AUC:** Decision Tree performance.

### 3.2 Association Rule Mining
- Toggle between **Apriori** and **FP-Growth**.
- Adjust minimum support, confidence, and lift thresholds.
- Filter for target consequence: `readmitted = <30`.
- Review discovered rules with Confidence, Lift, Leverage, and Conviction metrics.

### 3.3 Patient Clustering (K-Means)
- Select cluster count \(k\) (from 2 to 8).
- Inspect the **Elbow Method** inertia curve to verify the optimal elbow at \(k=5\).
- Examine cluster persona cards to understand clinical characteristics and baseline readmission hazard.

### 3.4 Readmission Analysis (Decision Tree)
- Trained specifically on pre-discharge variables.
- Employs **patient-level grouped splitting** (`patient_nbr`) to ensure repeated hospitalizations for a single patient do not contaminate the evaluation set.
- Inspect Feature Importance: Number of Inpatient Visits (0.28), Time in Hospital (0.18), Number of Medications (0.15).

### 3.5 AI Knowledge Explanation Assistant
- Ask questions regarding rules, lift interpretations, cluster centroids, or decision tree splits.
- The assistant is strictly grounded in the database; it cites empirical evidence and explicitly distinguishes statistical correlation from causation.

### 3.6 Reports & Exports
- Generate one-click study reports in PDF/HTML, CSV of discovered rules, or JSON raw configurations.
- Download artifacts directly to your local workstation.

