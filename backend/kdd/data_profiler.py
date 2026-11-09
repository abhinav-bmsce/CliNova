import csv
import math
from typing import Dict, Any, List, Optional
from pathlib import Path

def profile_csv_dataset(file_path: str, max_sample_rows: int = 10000) -> Dict[str, Any]:
    """
    Perform comprehensive Exploratory Data Analysis (EDA) on a CSV healthcare dataset.
    Calculates summary statistics, missing values, categorical distributions, and target distributions.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {file_path}")

    rows = []
    headers = []
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return {"total_rows": 0, "total_columns": 0, "columns": []}

        for i, row in enumerate(reader):
            if row and len(row) == len(headers):
                rows.append(row)
            if i >= max_sample_rows:
                break

    total_rows = len(rows)
    total_cols = len(headers)

    col_data: Dict[str, List[str]] = {h: [] for h in headers}
    for row in rows:
        for h, val in zip(headers, row):
            col_data[h].append(val.strip())

    columns_summary = []
    numeric_columns = []
    numeric_data: Dict[str, List[float]] = {}

    for h in headers:
        values = col_data[h]
        # Missing value identification ('?', '', 'null', 'nan', 'none')
        missing_count = sum(1 for v in values if v in ('?', '', 'null', 'NULL', 'None', 'NaN', 'nan'))
        missing_pct = round((missing_count / total_rows) * 100, 2) if total_rows > 0 else 0

        # Attempt numeric conversion
        valid_floats = []
        for v in values:
            if v not in ('?', '', 'null', 'NULL', 'None', 'NaN', 'nan'):
                try:
                    valid_floats.append(float(v))
                except ValueError:
                    pass

        is_numeric = len(valid_floats) > (len(values) - missing_count) * 0.90 and len(valid_floats) > 0

        if is_numeric:
            numeric_columns.append(h)
            numeric_data[h] = valid_floats

            valid_floats.sort()
            n = len(valid_floats)
            mean_val = sum(valid_floats) / n if n > 0 else 0
            variance = sum((x - mean_val) ** 2 for x in valid_floats) / (n - 1) if n > 1 else 0
            std_val = math.sqrt(variance)

            min_val = valid_floats[0] if n > 0 else 0
            max_val = valid_floats[-1] if n > 0 else 0
            median_val = valid_floats[n // 2] if n > 0 else 0
            q25_val = valid_floats[n // 4] if n > 0 else 0
            q75_val = valid_floats[(3 * n) // 4] if n > 0 else 0

            # Generate 10-bin histogram
            histogram = []
            if max_val > min_val:
                bin_width = (max_val - min_val) / 10
                bins = [0] * 10
                for v in valid_floats:
                    bin_idx = min(int((v - min_val) / bin_width), 9)
                    bins[bin_idx] += 1
                for b_i, b_count in enumerate(bins):
                    histogram.append({
                        "bin_start": round(min_val + b_i * bin_width, 1),
                        "bin_end": round(min_val + (b_i + 1) * bin_width, 1),
                        "count": b_count
                    })

            columns_summary.append({
                "name": h,
                "type": "numeric",
                "missing_count": missing_count,
                "missing_percentage": missing_pct,
                "stats": {
                    "mean": round(mean_val, 2),
                    "std": round(std_val, 2),
                    "min": round(min_val, 2),
                    "q25": round(q25_val, 2),
                    "median": round(median_val, 2),
                    "q75": round(q75_val, 2),
                    "max": round(max_val, 2),
                },
                "histogram": histogram
            })
        else:
            # Categorical frequency distribution
            freq_map: Dict[str, int] = {}
            for v in values:
                clean_v = v if v not in ('?', '') else 'Missing (?)'
                freq_map[clean_v] = freq_map.get(clean_v, 0) + 1

            sorted_freq = sorted(freq_map.items(), key=lambda x: x[1], reverse=True)[:10]
            categories = [{"category": k, "count": count, "percentage": round((count / total_rows) * 100, 1)} for k, count in sorted_freq]

            columns_summary.append({
                "name": h,
                "type": "categorical",
                "missing_count": missing_count,
                "missing_percentage": missing_pct,
                "unique_count": len(freq_map),
                "top_categories": categories
            })

    # Readmission Target Distribution if present
    target_distribution = {}
    target_col = None
    for cand in ["readmitted", "readmission", "Readmitted", "READMITTED", "target", "Target"]:
        if cand in col_data:
            target_col = cand
            break

    if target_col:
        readm_values = col_data[target_col]
        counts = {}
        for v in readm_values:
            clean_v = v.strip() if v else "Missing"
            counts[clean_v] = counts.get(clean_v, 0) + 1
        total_v = len(readm_values) if len(readm_values) > 0 else 1
        early_count = counts.get("<30", counts.get("1", counts.get("YES", counts.get("Yes", 0))))
        target_distribution = {
            "target_column": target_col,
            "counts": counts,
            "percentages": {k: round((c / total_v) * 100, 2) for k, c in counts.items()},
            "early_readmitted_count": early_count,
            "early_readmitted_pct": round((early_count / total_v) * 100, 2)
        }

    # Pearson Correlation Matrix for first 8 key numeric attributes, excluding administrative identifiers
    correlations = {}
    IDENTIFIER_NAMES = {"encounter_id", "patient_nbr", "patient_id", "id", "encounterid", "patientid", "row_id", "index"}
    clinical_numeric = [c for c in numeric_columns if c.lower() not in IDENTIFIER_NAMES]
    selected_numeric = clinical_numeric[:8] if len(clinical_numeric) >= 2 else numeric_columns[:8]
    for col1 in selected_numeric:
        correlations[col1] = {}
        v1 = col_data[col1]
        for col2 in selected_numeric:
            v2 = col_data[col2]
            pairs = []
            for a, b in zip(v1, v2):
                try:
                    pairs.append((float(a), float(b)))
                except ValueError:
                    pass
            if len(pairs) > 1:
                n = len(pairs)
                sum1 = sum(p[0] for p in pairs)
                sum2 = sum(p[1] for p in pairs)
                sum1_sq = sum(p[0] ** 2 for p in pairs)
                sum2_sq = sum(p[1] ** 2 for p in pairs)
                p_sum = sum(p[0] * p[1] for p in pairs)

                num = p_sum - (sum1 * sum2 / n)
                den = math.sqrt((sum1_sq - (sum1 ** 2 / n)) * (sum2_sq - (sum2 ** 2 / n)))
                r = round(num / den, 3) if den != 0 else 0.0
                correlations[col1][col2] = max(-1.0, min(1.0, r))
            else:
                correlations[col1][col2] = 1.0 if col1 == col2 else 0.0

    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "numeric_column_count": len(numeric_columns),
        "categorical_column_count": total_cols - len(numeric_columns),
        "columns": columns_summary,
        "target_distribution": target_distribution,
        "correlations": correlations
    }

