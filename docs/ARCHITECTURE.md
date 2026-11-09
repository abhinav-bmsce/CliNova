# CLINOVA System Architecture

## 1. High-Level Architectural Overview

CLINOVA is a multi-tier clinical intelligence platform architected to process electronic health record (EHR) encounter datasets, perform rigorous Knowledge Discovery in Databases (KDD), and present verified clinical patterns to healthcare researchers and quality analysts.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLINOVA Web Client                       │
│      React 18 + Vite + Tailwind CSS (Sage & Warm White)     │
│   ├── Responsive Shell (Sidebar, Header, Breadcrumbs)       │
│   ├── Dashboard & KPI Performance Monitoring                │
│   ├── Dataset Ingestion & Profiling Interface               │
│   ├── KDD Mining Control Panels (Apriori, K-Means, Trees)   │
│   └── Visual Analytics & AI Grounded Assistant              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST
┌──────────────────────────────▼──────────────────────────────┐
│                    CLINOVA Backend Core                     │
│                Python Modular Service Engine                │
│   ├── API Gateway & Route Orchestration                     │
│   ├── Authentication & RBAC Policy Engine                   │
│   ├── Dataset Ingestion & Validation Pipeline               │
│   ├── KDD Algorithm Engine (Apriori, FP-Growth, K-Means)    │
│   ├── Readmission Decision Tree Classifier                  │
│   ├── Interesting Pattern Discovery Ranker                  │
│   └── Grounded AI Knowledge Explanation Engine              │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────┐
│ Relational Database Storage  │    │ Secure File Storage      │
│ (Users, Roles, Projects,     │    │ /storage/raw/            │
│  Job Audit, Rules, Clusters) │    │ /storage/processed/      │
└──────────────────────────────┘    └──────────────────────────┘
```

## 2. Core Architectural Principles

1. **Analytical Correctness Over Visual Fluff**: Analytical outputs must reflect actual mathematical computations on real clinical encounter datasets. No fabricated statistics or static placeholders.
2. **De-Identification & Privacy**: File contents are validated and stored outside public web roots. Application logs are scrubbed of Protected Health Information (PHI).
3. **Data Immutability & Traceability**: Raw dataset uploads are treated as immutable. Preprocessing generates new versioned datasets linked by parent IDs.
4. **Leakage Prevention**: Classification models strictly separate pre-outcome features from post-outcome artifacts, utilizing patient-level grouped cross-validation.
5. **Grounded AI Explanations**: External LLM or rule-based assistants are strictly constrained to analytical evidence tables produced by the KDD algorithms.

