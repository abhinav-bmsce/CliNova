# CLINOVA KDD (Knowledge Discovery in Databases) Pipeline

## 1. The 6-Stage Healthcare KDD Process

```
[Raw Clinical Encounters (CSV/XLSX)]
                │
                ▼
1. Data Selection & Ingestion
   - Schema validation, type identification, missingness assessment
                │
                ▼
2. Preprocessing & Cleaning
   - Missing-value imputation, deduplication, clinical encoding, outlier treatment
                │
                ▼
3. Transformation & Feature Selection
   - Discretization of vitals, transaction binarization for ARM, scaling for clustering
                │
                ▼
4. Data Mining Engines
   ├── Association Rule Mining (Apriori & FP-Growth)
   ├── Patient Phenotyping (K-Means with Silhouette Optimization)
   └── Readmission Risk Classification (Decision Tree & Feature Importance)
                │
                ▼
5. Pattern Evaluation & Interestingness
   - Support, Confidence, Lift, Leverage, Conviction, Clinical relevance filter
                │
                ▼
6. Knowledge Consolidation & Grounded AI Interpretation
   - Evidence-linked insights, regulatory reporting, clinical decision support
```

## 2. Mining Algorithm Specifications

### 2.1 Association Rule Mining
- **Engines**: Apriori and FP-Growth.
- **Metrics**:
  - Support: \(P(A \cup B)\)
  - Confidence: \(P(B \mid A) = \frac{\text{Support}(A \cup B)}{\text{Support}(A)}\)
  - Lift: \(\frac{\text{Confidence}(A \to B)}{\text{Support}(B)}\)
  - Leverage: \(\text{Support}(A \to B) - \text{Support}(A) \times \text{Support}(B)\)
  - Conviction: \(\frac{1 - \text{Support}(B)}{1 - \text{Confidence}(A \to B)}\)
- **Safety Rule**: Exclude rules with outcome labels present simultaneously in both antecedent and consequent.

### 2.2 Patient Clustering
- **Algorithm**: K-Means clustering with feature standardization.
- **Evaluation**: Elbow Method (Inertia curve) and Silhouette Coefficient.
- **Clinical Utility**: Unsupervised subphenotyping of patient cohorts to isolate high-utilization trajectories.

### 2.3 Readmission Classification
- **Algorithm**: Decision Tree Classifier.
- **Target**: 30-Day Hospital Readmission (`<30`, `>30`, `NO`).
- **Leakage Prevention**: Grouped patient ID splitting; exclusion of post-discharge clinical notes or post-outcome treatment markers.

