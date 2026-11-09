import csv
import math
import random
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path

class TreeNode:
    """Node in a CART Decision Tree."""
    def __init__(
        self,
        feature_idx: Optional[int] = None,
        threshold: Optional[float] = None,
        left: Optional['TreeNode'] = None,
        right: Optional['TreeNode'] = None,
        value: Optional[float] = None, # Prob of class 1 (readmitted)
        samples: int = 0
    ):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value
        self.samples = samples

    @property
    def is_leaf(self) -> bool:
        return self.value is not None

def gini_impurity(y: List[int]) -> float:
    """Calculate Gini impurity for binary target."""
    n = len(y)
    if n == 0:
        return 0.0
    p1 = sum(y) / n
    p0 = 1.0 - p1
    return 1.0 - (p0 ** 2 + p1 ** 2)

def best_split(X: List[List[float]], y: List[int], min_samples_leaf: int) -> Tuple[Optional[int], Optional[float], float]:
    """Find the feature and threshold that maximizes Gini gain."""
    best_gain = -1.0
    best_feat = None
    best_thresh = None
    n = len(y)
    current_gini = gini_impurity(y)

    n_features = len(X[0])
    for j in range(n_features):
        col_vals = sorted(list(set(row[j] for row in X)))
        if len(col_vals) <= 1:
            continue

        # Evaluate candidate thresholds
        candidate_thresholds = [(col_vals[i] + col_vals[i + 1]) / 2 for i in range(min(len(col_vals) - 1, 15))]

        for thresh in candidate_thresholds:
            left_y = [y[i] for i, row in enumerate(X) if row[j] <= thresh]
            right_y = [y[i] for i, row in enumerate(X) if row[j] > thresh]

            if len(left_y) < min_samples_leaf or len(right_y) < min_samples_leaf:
                continue

            gain = current_gini - (
                (len(left_y) / n) * gini_impurity(left_y) +
                (len(right_y) / n) * gini_impurity(right_y)
            )

            if gain > best_gain:
                best_gain = gain
                best_feat = j
                best_thresh = thresh

    return best_feat, best_thresh, max(0.0, best_gain)

def build_tree(
    X: List[List[float]],
    y: List[int],
    feature_importances: List[float],
    depth: int = 0,
    max_depth: int = 5,
    min_samples_leaf: int = 20
) -> TreeNode:
    """Recursively build CART decision tree and accumulate feature importances."""
    n = len(y)
    if n == 0:
        return TreeNode(value=0.0, samples=0)

    prob_1 = sum(y) / n
    if depth >= max_depth or n < 2 * min_samples_leaf or prob_1 in (0.0, 1.0):
        return TreeNode(value=prob_1, samples=n)

    feat_idx, thresh, gain = best_split(X, y, min_samples_leaf)
    if feat_idx is None or gain <= 0:
        return TreeNode(value=prob_1, samples=n)

    feature_importances[feat_idx] += gain * (n / 1000.0)

    left_indices = [i for i, row in enumerate(X) if row[feat_idx] <= thresh]
    right_indices = [i for i, row in enumerate(X) if row[feat_idx] > thresh]

    left_child = build_tree(
        [X[i] for i in left_indices],
        [y[i] for i in left_indices],
        feature_importances,
        depth + 1,
        max_depth,
        min_samples_leaf
    )
    right_child = build_tree(
        [X[i] for i in right_indices],
        [y[i] for i in right_indices],
        feature_importances,
        depth + 1,
        max_depth,
        min_samples_leaf
    )

    return TreeNode(
        feature_idx=feat_idx,
        threshold=thresh,
        left=left_child,
        right=right_child,
        samples=n
    )

def predict_proba(node: TreeNode, x: List[float]) -> float:
    """Traverse tree to predict probability of class 1."""
    if node.is_leaf:
        return node.value or 0.0
    if x[node.feature_idx] <= node.threshold:
        return predict_proba(node.left, x)
    return predict_proba(node.right, x)

def extract_decision_paths(node: TreeNode, feature_names: List[str], current_path: List[str] = None) -> List[str]:
    """Extract human-readable decision rules from the trained tree."""
    if current_path is None:
        current_path = []

    if node.is_leaf:
        prob = round(node.value or 0.0, 2)
        rule_str = " AND ".join(current_path) if current_path else "All Patients"
        return [f"IF {rule_str} THEN Readmission Risk = {prob} (Samples: {node.samples})"]

    paths = []
    feat_name = feature_names[node.feature_idx]
    thresh_val = round(node.threshold, 2)

    if node.left:
        paths.extend(extract_decision_paths(node.left, feature_names, current_path + [f"{feat_name} <= {thresh_val}"]))
    if node.right:
        paths.extend(extract_decision_paths(node.right, feature_names, current_path + [f"{feat_name} > {thresh_val}"]))

    return paths

def train_readmission_tree(
    file_path: str,
    feature_names: Optional[List[str]] = None,
    max_depth: int = 5,
    min_samples_leaf: int = 20,
    test_ratio: float = 0.25,
    random_seed: int = 42,
    max_rows: int = 5000
) -> Dict[str, Any]:
    """
    Train decision tree classifier with patient-level grouped train/test split.
    Prevents patient data leakage by partitioning unique patient_nbr values.
    """
    if not feature_names:
        feature_names = [
            "number_inpatient",
            "time_in_hospital",
            "num_medications",
            "number_diagnoses",
            "num_lab_procedures",
            "num_procedures"
        ]

    encounters = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= max_rows:
                break
            try:
                features = [float(row.get(feat, 0)) for feat in feature_names]
                readm_label = 1 if row.get("readmitted") == "<30" else 0
                patient_id = row.get("patient_nbr", str(i))
                encounters.append({
                    "patient_id": patient_id,
                    "features": features,
                    "target": readm_label
                })
            except ValueError:
                pass

    if len(encounters) < 20:
        raise ValueError("Insufficient encounters for training decision tree (minimum 20 required).")

    # 1. GROUPED PATIENT SPLIT to strictly prevent patient-level leakage
    unique_patients = list(set(e["patient_id"] for e in encounters))
    rng = random.Random(random_seed)
    rng.shuffle(unique_patients)

    split_idx = int(len(unique_patients) * (1.0 - test_ratio))
    train_patients = set(unique_patients[:split_idx])
    test_patients = set(unique_patients[split_idx:])

    train_data = [e for e in encounters if e["patient_id"] in train_patients]
    test_data = [e for e in encounters if e["patient_id"] in test_patients]

    X_train = [e["features"] for e in train_data]
    y_train = [e["target"] for e in train_data]
    X_test = [e["features"] for e in test_data]
    y_test = [e["target"] for e in test_data]

    # 2. Build Decision Tree
    feature_importances = [0.0] * len(feature_names)
    root = build_tree(X_train, y_train, feature_importances, depth=0, max_depth=max_depth, min_samples_leaf=min_samples_leaf)

    # Normalize feature importances
    total_imp = sum(feature_importances)
    if total_imp > 0:
        normalized_imp = [round(imp / total_imp, 3) for imp in feature_importances]
    else:
        normalized_imp = [round(1.0 / len(feature_names), 3)] * len(feature_names)

    feat_importance_list = [
        {"feature": name, "importance": imp}
        for name, imp in sorted(zip(feature_names, normalized_imp), key=lambda x: x[1], reverse=True)
    ]

    # 3. Evaluate on Unseen Grouped Test Set
    y_pred_proba = [predict_proba(root, x) for x in X_test]
    threshold = 0.35 # Adjusted for ~11.4% base rate class imbalance
    y_pred = [1 if p >= threshold else 0 for p in y_pred_proba]

    tp = sum(1 for yt, yp in zip(y_test, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(y_test, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(y_test, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_test, y_pred) if yt == 1 and yp == 0)

    accuracy = round((tp + tn) / len(y_test), 3) if len(y_test) > 0 else 0
    precision = round(tp / (tp + fp), 3) if (tp + fp) > 0 else 0
    recall = round(tp / (tp + fn), 3) if (tp + fn) > 0 else 0
    f1 = round(2 * (precision * recall) / (precision + recall), 3) if (precision + recall) > 0 else 0

    # Calculate ROC-AUC using trapezoidal integration
    paired = sorted(zip(y_pred_proba, y_test), key=lambda x: x[0], reverse=True)
    pos_count = sum(y_test)
    neg_count = len(y_test) - pos_count

    auc = 0.5
    if pos_count > 0 and neg_count > 0:
        tp_cum = 0
        fp_cum = 0
        auc_sum = 0.0
        prev_fp = 0
        for prob, label in paired:
            if label == 1:
                tp_cum += 1
            else:
                fp_cum += 1
                auc_sum += tp_cum
        auc = round(auc_sum / (pos_count * neg_count), 3)

    rules = extract_decision_paths(root, feature_names)[:8]

    return {
        "algorithm": "Decision Tree",
        "target": "readmitted = <30",
        "leakage_prevention": "patient_nbr grouped splitting",
        "train_samples": len(train_data),
        "test_samples": len(test_data),
        "roc_auc": round(auc, 3),
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "confusion_matrix": [
            [tn, fp],
            [fn, tp]
        ],
        "feature_importances": feat_importance_list,
        "decision_rules": rules
    }

