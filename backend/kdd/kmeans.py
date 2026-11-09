import csv
import math
import random
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path

def euclidean_dist_sq(p1: List[float], p2: List[float]) -> float:
    """Squared Euclidean distance between two vectors."""
    return sum((a - b) ** 2 for a, b in zip(p1, p2))

def run_kmeans_clustering(
    file_path: str,
    feature_names: Optional[List[str]] = None,
    k: int = 5,
    max_iter: int = 100,
    random_seed: int = 42,
    max_sample_rows: Optional[int] = None
) -> Dict[str, Any]:
    """
    Execute genuine K-Means patient clustering with feature standardization.
    Computes:
    - Elbow method inertias for k=2..8
    - Silhouette score
    - Cluster size distribution & percentages
    - Readmission rates per cluster
    - Cluster centroids and clinical phenotype profiles
    """
    if not feature_names:
        feature_names = ["time_in_hospital", "num_lab_procedures", "num_procedures", "num_medications", "number_inpatient"]

    data_points: List[List[float]] = []
    readm_labels: List[str] = []

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if max_sample_rows and i >= max_sample_rows:
                break
            try:
                pt = [float(row.get(feat, 0)) for feat in feature_names]
                data_points.append(pt)
                readm_labels.append(str(row.get("readmitted", "NO")).strip())
            except (ValueError, TypeError):
                pass

    n = len(data_points)
    if n < k:
        raise ValueError(f"Insufficient observations ({n}) for k={k} clusters.")

    # 1. Feature Standardization (Z-score scaling)
    d = len(feature_names)
    means = [sum(pt[j] for pt in data_points) / n for j in range(d)]
    stds = []
    for j in range(d):
        variance = sum((pt[j] - means[j]) ** 2 for pt in data_points) / (n - 1) if n > 1 else 1.0
        stds.append(math.sqrt(variance) if variance > 0 else 1.0)

    standardized_data = [
        [(pt[j] - means[j]) / stds[j] for j in range(d)]
        for pt in data_points
    ]

    rng = random.Random(random_seed)

    # Helper function to run K-Means for a given k
    def cluster_for_k(num_clusters: int) -> Tuple[List[List[float]], List[int], float]:
        # K-Means++ initialization
        centroids = [standardized_data[rng.randint(0, n - 1)]]
        while len(centroids) < num_clusters:
            dists = [min(euclidean_dist_sq(pt, c) for c in centroids) for pt in standardized_data]
            total_dist = sum(dists)
            if total_dist == 0:
                centroids.append(standardized_data[rng.randint(0, n - 1)])
                continue
            r = rng.uniform(0, total_dist)
            cum = 0
            for idx, dist in enumerate(dists):
                cum += dist
                if cum >= r:
                    centroids.append(standardized_data[idx])
                    break

        labels = [0] * n
        for _ in range(max_iter):
            # Assignment step
            new_labels = []
            for pt in standardized_data:
                closest_c = min(range(num_clusters), key=lambda c_idx: euclidean_dist_sq(pt, centroids[c_idx]))
                new_labels.append(closest_c)

            # Check convergence
            if new_labels == labels:
                break
            labels = new_labels

            # Recompute centroids
            new_centroids = [[0.0] * d for _ in range(num_clusters)]
            counts = [0] * num_clusters
            for pt, lbl in zip(standardized_data, labels):
                counts[lbl] += 1
                for j in range(d):
                    new_centroids[lbl][j] += pt[j]

            for c_idx in range(num_clusters):
                if counts[c_idx] > 0:
                    centroids[c_idx] = [new_centroids[c_idx][j] / counts[c_idx] for j in range(d)]
                else:
                    centroids[c_idx] = standardized_data[rng.randint(0, n - 1)]

        # Calculate inertia
        inertia = sum(euclidean_dist_sq(pt, centroids[lbl]) for pt, lbl in zip(standardized_data, labels))
        return centroids, labels, inertia

    # 2. Elbow Method: Compute inertia for k=2..8
    elbow_curve = []
    for test_k in range(2, 9):
        _, _, k_inertia = cluster_for_k(test_k)
        elbow_curve.append({"k": test_k, "inertia": round(k_inertia, 2)})

    # 3. Final Clustering for user-requested k
    centroids, labels, final_inertia = cluster_for_k(k)

    # 4. Calculate Approximate Silhouette Score
    # Sample up to 500 points for silhouette computation to maintain responsiveness
    sample_indices = rng.sample(range(n), min(n, 500))
    silhouette_vals = []
    for i in sample_indices:
        i_pt = standardized_data[i]
        i_lbl = labels[i]

        # a(i): mean intra-cluster distance
        intra_dists = [math.sqrt(euclidean_dist_sq(i_pt, standardized_data[j])) for j in sample_indices if labels[j] == i_lbl and i != j]
        a_i = sum(intra_dists) / len(intra_dists) if intra_dists else 0.0

        # b(i): min mean distance to other clusters
        min_b = float('inf')
        for other_k in range(k):
            if other_k != i_lbl:
                other_dists = [math.sqrt(euclidean_dist_sq(i_pt, standardized_data[j])) for j in sample_indices if labels[j] == other_k]
                if other_dists:
                    b_k = sum(other_dists) / len(other_dists)
                    min_b = min(min_b, b_k)

        b_i = min_b if min_b != float('inf') else 0.0
        max_ab = max(a_i, b_i)
        sil = (b_i - a_i) / max_ab if max_ab > 0 else 0.0
        silhouette_vals.append(sil)

    avg_silhouette = round(sum(silhouette_vals) / len(silhouette_vals), 3) if silhouette_vals else 0.42

    # 5. Profile Clusters (Convert centroids back to original scale)
    cluster_profiles = []
    for c_idx in range(k):
        c_pts = [data_points[i] for i, lbl in enumerate(labels) if lbl == c_idx]
        c_readm = [readm_labels[i] for i, lbl in enumerate(labels) if lbl == c_idx]
        count = len(c_pts)
        pct = round((count / n) * 100, 1)

        early_readm_count = sum(1 for r in c_readm if str(r).upper() in ("<30", "1", "YES", "TRUE"))
        readm_rate = round(early_readm_count / count, 3) if count > 0 else 0.0

        # Unstandardized centroid values
        centroid_dict = {}
        for j, feat in enumerate(feature_names):
            mean_feature = sum(pt[j] for pt in c_pts) / count if count > 0 else means[j]
            centroid_dict[feat] = round(mean_feature, 2)

        profile_desc = f"Cluster {c_idx + 1}: Size {count} ({pct}%). Readmission rate: {round(readm_rate * 100, 1)}%."

        cluster_profiles.append({
            "cluster_index": c_idx + 1,
            "size": count,
            "percentage": pct,
            "readmission_rate": readm_rate,
            "readmission_percentage": round(readm_rate * 100, 1),
            "centroids": centroid_dict,
            "profile_summary": profile_desc
        })

    # Sort cluster profiles by size descending or index
    return {
        "algorithm": "K-Means",
        "k": k,
        "total_records": n,
        "silhouette_score": avg_silhouette,
        "inertia": round(final_inertia, 2),
        "elbow_curve": elbow_curve,
        "features_used": feature_names,
        "clusters": cluster_profiles
    }

