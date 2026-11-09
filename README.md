# CLINOVA — Clinical Knowledge Discovery and Readmission Intelligence Platform

> **Discover Beyond Data.**  
> A full-stack, multi-user healthcare Knowledge Discovery in Databases (KDD) application that transforms raw electronic health records (EHR) into meaningful, verified clinical knowledge through data preprocessing, association rule mining, patient clustering, readmission classification, multi-criteria pattern evaluation, and grounded AI explanation.

---

## 1. Architectural Philosophy & Core Principles

CLINOVA is engineered as a **Knowledge Discovery platform first, an AI-assisted analytical application second, and a dashboard third**. The application adheres strictly to analytical correctness, statistical rigor, and healthcare safety guidelines:

- **Zero Mock Policy:** All analytical metrics, frequent itemsets, association rules, cluster centroids, and decision boundaries are computed dynamically from actual loaded hospital encounter records. When a user has zero datasets or zero analyses, clean zero-state interfaces are rendered without synthetic demo fallback values.
- **Strict Clinical Design Language:** Light-themed, calm, research-grade aesthetic using a sophisticated sage-green and warm-white palette. No dark mode, no black or navy backgrounds, and no generic AI dashboard tropes.
- **Safe Machine Learning Practices:** Grouped train/test splitting (`patient_nbr`) strictly prevents patient-level data leakage across repeated hospitalizations. Clinical attributes and outcomes are separated to eliminate target leakage (e.g., `<30` days readmission is constrained solely to rule consequents).
- **Strict Analytical Provenance:** Every insight, cluster, and report artifact is directly tied to its source dataset ID, row count, execution parameters, and unique analysis run ID (e.g., `AN-CAAE`, `AN-C26E`, `AN-C0D8`).

---

## 2. System Architecture & Port Alignment

```
   ┌────────────────────────────────────────────────────────┐
   │                    Client Browser                      │
   │               http://localhost:3000                    │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                 Vite Frontend (Port 3000)              │
   │      - React 18, Tailwind CSS, Lucide React            │
   │      - Reverse Proxy: /api/* ──► http://127.0.0.1:5050 │
   │      - Defensive JSON error handling & proxy fallback  │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTP / JSON
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                 Flask Backend (Port 5050)              │
   │      - Python 3.13 REST API Blueprint                  │
   │      - 100 MB Request Payload Handling                 │
   │      - JWT Token Verification & RBAC                   │
   └───────────────┬────────────────────────┬───────────────┘
                   │                        │
                   ▼                        ▼
   ┌────────────────────────┐      ┌────────────────────────┐
   │  SQLite Relational DB  │      │   Storage Artifacts    │
   │  (WAL Mode / ACID)     │      │   - Raw Datasets       │
   │  storage/clinova.db    │      │   - Processed Cohorts  │
   │                        │      │   - Reports (PDF/CSV)  │
   └────────────────────────┘      └────────────────────────┘
```

- **Frontend Port:** `3000` (Vite development and preview server)
- **Backend Port:** `5050` (Standardized Python Flask API server)
- **Proxy Configuration:** Vite automatically proxies all `/api/*` requests to `http://127.0.0.1:5050` with automated header forwarding and error traps returning structured JSON.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18, Vite, JSX
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **Design System:** Custom CLINOVA Sage-Green & Warm-White palette
- **Icons:** Lucide React
- **Data Visualizations:** Dynamic SVG/Canvas charts (scatter plots, cluster distribution bars, empirical ROC-AUC curves)

### Backend
- **Core Engine:** Python 3.13, Flask modular REST architecture
- **Database:** Relational storage engine (SQLite with foreign keys and WAL mode; PostgreSQL-ready)
- **KDD Mining Engines:** Pure algorithmic implementations of:
  - **Apriori** & **FP-Growth** (Association Rule Mining)
  - **K-Means** with Lloyd's algorithm and Silhouette/Elbow scoring (Patient Clustering)
  - **CART Decision Tree** with grouped patient cross-validation (Readmission Classification)
  - **Data Profiler** with automated statistical distribution and Pearson correlation calculation
- **Authentication & Security:** Role-Based Access Control (`Administrator`, `Researcher`, `Viewer`) with PBKDF2-SHA256 password hashing and JWT token verification.

---

## 4. Design System Palette

| Token | Hex Value | Semantic Usage |
|---|---|---|
| Main Background | `#F7F9F6` | Platform backdrop |
| Sidebar Background | `#FFFFFF` | Clean navigation panel |
| Card Background | `#FFFFFF` | Analytical cards, data tables |
| Primary Accent | `#779985` | Primary buttons, active indicators |
| Dark Sage | `#456B56` | Primary headings, active text, icons |
| Light Sage | `#DFEAE0` | Active navigation pill, soft badges |
| Muted Teal | `#8BAFA3` | Secondary metrics, confidence accents |
| Teal Background | `#E7F1ED` | Metric card highlights, info wells |
| Warm Beige | `#F4EBDD` | Neutral cluster badge, patient cohorts |
| Soft Peach | `#F3E5DC` | Risk warning indicators, moderate alerts |
| Lavender | `#EEEAF5` | Comorbidity tags, clinical classifications |
| Primary Text | `#35463B` | High-contrast body text, table cells |
| Secondary Text | `#758278` | Subtitles, helper text, timestamps |
| Borders | `#E4EAE3` | Subtle container and card borders |

---

## 5. End-to-End KDD Modules & Capabilities

### 1. Dataset Management & Cohort Ingestion
- Drag-and-drop CSV and XLSX file ingestion supporting up to 100 MB.
- Automatic header profiling, data type detection, missing-value audits, and row count persistence.
- Complete isolation: deleting or switching datasets immediately updates all downstream analytical modules.

### 2. Exploratory Data Analysis (EDA)
- Computes mean, standard deviation, min, 25th percentile, median, 75th percentile, max, and IQR.
- Generates 10-bin distribution histograms for numeric attributes and frequency distributions for categorical variables.
- Dynamic sample size display matching the exact profiled encounter count.
- Excludes administrative identifiers (`encounter_id`, `patient_nbr`, `patient_id`) from clinical Pearson correlation matrices.

### 3. Data Preprocessing Pipeline
- Non-destructive preprocessing: original raw datasets are preserved; versioned cohorts are stored in `storage/processed/`.
- Configurable missing-value imputation (median, mode, complete-case drop).
- Deduplication by encounter ID to eliminate sample distortion.
- Numerical standardization (StandardScaler Z-Score or MinMaxScaler).
- Comprehensive before/after audit trail reporting initial rows, final rows, attributes, and strategy.

### 4. Association Rule Mining (Apriori & FP-Growth)
- Frequent itemset discovery with configurable Support, Confidence, and Lift thresholds.
- Computes mathematical metrics:
  $$\text{Support}(X \Rightarrow Y) = \frac{\text{count}(X \cup Y)}{N}$$
  $$\text{Confidence}(X \Rightarrow Y) = \frac{\text{Support}(X \cup Y)}{\text{Support}(X)}$$
  $$\text{Lift}(X \Rightarrow Y) = \frac{\text{Confidence}(X \Rightarrow Y)}{\text{Support}(Y)}$$
  $$\text{Leverage}(X \Rightarrow Y) = \text{Support}(X \Rightarrow Y) - (\text{Support}(X) \times \text{Support}(Y))$$
  $$\text{Conviction}(X \Rightarrow Y) = \frac{1 - \text{Support}(Y)}{1 - \text{Confidence}(X \Rightarrow Y)}$$
- Target-constrained mining ensures early readmission (`<30`) appears strictly in the rule consequent, eliminating target leakage.

### 5. Unsupervised Patient Clustering (K-Means)
- Partitions multi-dimensional clinical encounters into distinct phenotypic cohorts.
- Lloyd's algorithm with Euclidean distance and random-seed reproducibility.
- Automated cluster profiling: reports exact cluster size, cohort percentage, and intra-cluster readmission rate.
- Multi-run consistency: cluster sizes sum exactly to the cohort's record count.

### 6. Readmission Analysis & Decision Tree Classification
- CART decision tree classifier targeting 30-day early hospital readmission (`<30` vs `NO` / `>30`).
- Patient-grouped cross-validation (`patient_nbr`) ensures no individual patient's encounters appear in both training and test sets.
- Strict evaluation metric alignment:
  $$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$
  $$\text{Precision} = \frac{TP}{TP + FP}$$
  $$\text{Recall} = \frac{TP}{TP + FN}$$
  $$\text{F1-Score} = \frac{2 \times \text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
- Test-set confusion matrix and Gini feature importance ranking.

### 7. Knowledge Discovery & Pattern Evaluation
- Multi-criteria interestingness scoring separating highest-lift rules from most actionable rules:
  $$I = 0.40 \times \min\left(1.0, \frac{\text{Lift}}{3.0}\right) + 0.35 \times \text{Confidence} + 0.25 \times \min\left(1.0, \frac{\text{Support}}{0.10}\right)$$
- Clinical evidence cards synthesizing cross-module findings with explicit scientific disclaimers.

### 8. AI Knowledge Explanation Assistant
- Conversational research assistant grounded strictly in verified stored database outputs.
- Adheres to clinical safety: clearly distinguishes statistical association from clinical causation.
- Explains methodological limitations (observational EHR constraints, unmeasured confounders, lack of post-discharge adherence data).

### 9. Interactive Visual Analytics Cockpit
- Multi-view visual exploration with interactive cross-filtering.
- Support vs. Lift rule scatter plot with dynamic bubble sizes.
- Horizontal cluster distribution bars comparing cohort percentage vs. readmission rate.
- Empirical ROC curve rendered directly from test-set confusion matrix coordinates.

### 10. Reports & Analytical Artifact Exports
- Verifiable study reports generated in PDF/HTML, CSV, and JSON format.
- Strict data provenance: reports clearly identify the source dataset ID, name, row count, execution parameters, and specific analysis run IDs.
- Eliminates hardcoded metrics: all tables, KPIs, and confusion matrices reflect the selected active cohort.

---

## 6. Quickstart & Verification Commands

### Step 1: Run Backend Automated Tests
```bash
# Run the complete test suite (20 automated tests)
.venv/bin/python3 -m unittest discover -s backend/tests -v
```

### Step 2: Build the Frontend
```bash
# Build production frontend assets
npm run build
```

### Step 3: Run the Development Servers
In Terminal 1 (Backend on Port 5050):
```bash
.venv/bin/python3 backend/main.py
```

In Terminal 2 (Frontend on Port 3000):
```bash
npm run dev
```

Open your browser to `http://localhost:3000`.

---

## 7. Methodological Limitations & Clinical Disclaimers

1. **Observational Data:** Findings are derived from retrospective EHR encounters, which are subject to documentation variability, unmeasured clinical confounders, and hospital coding practices.
2. **Correlation vs. Causation:** High-lift association rules (e.g., prior inpatient visits or polypharmacy) identify vulnerable patient subgroups requiring closer transition monitoring, but do not prove direct biological causation.
3. **Unrecorded Post-Discharge Factors:** Out-of-hospital medication compliance, outpatient clinical notes, and post-discharge social support are not captured in hospital billing datasets.
4. **Generalizability:** Models trained on specific healthcare systems must undergo independent external validation prior to deployment in disparate clinical settings.
