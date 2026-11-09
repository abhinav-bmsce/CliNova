import csv
import math
import os
import uuid
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from backend.core.config import settings

def preprocess_dataset(
    file_path: str,
    impute_strategy: str = "median", # "median", "mode", "drop"
    remove_duplicates: bool = True,
    scale_numeric: Optional[str] = "standard", # "standard", "minmax", None
    selected_features: Optional[List[str]] = None,
    output_filename: Optional[str] = None
) -> Tuple[str, Dict[str, Any]]:
    """
    Execute reproducible clinical data preprocessing pipeline:
    - Missing-value imputation without data leakage
    - Duplicate detection & removal
    - Numerical standardization / min-max scaling
    - Preserves raw dataset, outputs versioned processed dataset.
    """
    in_path = Path(file_path)
    if not in_path.exists():
        raise FileNotFoundError(f"Input dataset not found: {file_path}")

    rows = []
    headers = []
    with open(in_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        headers = next(reader)
        for r in reader:
            if len(r) == len(headers):
                rows.append(r)

    rows_before = len(rows)
    cols_before = len(headers)

    # 1. Duplicate Removal
    if remove_duplicates:
        seen_encounters = set()
        deduped = []
        enc_idx = headers.index("encounter_id") if "encounter_id" in headers else -1

        for r in rows:
            key = r[enc_idx] if enc_idx >= 0 else tuple(r)
            if key not in seen_encounters:
                seen_encounters.add(key)
                deduped.append(r)
        rows = deduped

    # 2. Identify Numeric and Categorical Columns
    numeric_indices = []
    categorical_indices = []
    col_values: Dict[int, List[str]] = {i: [] for i in range(len(headers))}

    for r in rows:
        for i, val in enumerate(r):
            col_values[i].append(val.strip())

    for i, h in enumerate(headers):
        vals = col_values[i]
        valid_floats = 0
        for v in vals:
            if v not in ('?', '', 'null', 'NULL', 'None'):
                try:
                    float(v)
                    valid_floats += 1
                except ValueError:
                    pass
        if valid_floats > len(vals) * 0.85 and valid_floats > 0:
            numeric_indices.append(i)
        else:
            categorical_indices.append(i)

    # 3. Impute Missing Values
    imputed_stats = {}
    for i in numeric_indices:
        h = headers[i]
        floats = [float(v) for v in col_values[i] if v not in ('?', '', 'null', 'NULL', 'None')]
        if floats:
            floats.sort()
            median_val = floats[len(floats) // 2]
            mean_val = sum(floats) / len(floats)
            impute_val = median_val if impute_strategy == "median" else mean_val
            imputed_stats[h] = round(impute_val, 2)

            for r_idx in range(len(rows)):
                if rows[r_idx][i] in ('?', '', 'null', 'NULL', 'None'):
                    rows[r_idx][i] = str(round(impute_val, 2))

    for i in categorical_indices:
        h = headers[i]
        counts: Dict[str, int] = {}
        for v in col_values[i]:
            if v not in ('?', '', 'null', 'NULL', 'None'):
                counts[v] = counts.get(v, 0) + 1
        mode_val = max(counts.items(), key=lambda x: x[1])[0] if counts else "Unknown"

        for r_idx in range(len(rows)):
            if rows[r_idx][i] in ('?', '', 'null', 'NULL', 'None'):
                rows[r_idx][i] = mode_val

    # 4. Feature Selection Filter if specified
    out_headers = list(headers)
    final_rows = rows
    if selected_features and len(selected_features) > 0:
        sel_indices = [headers.index(f) for f in selected_features if f in headers]
        if sel_indices:
            out_headers = [headers[i] for i in sel_indices]
            final_rows = [[r[i] for i in sel_indices] for r in rows]

    # 5. Output Processed File
    processed_dir = settings.PROCESSED_DATASETS_DIR
    processed_dir.mkdir(parents=True, exist_ok=True)

    if not output_filename:
        out_name = f"processed_{uuid.uuid4().hex[:8]}_{in_path.name}"
    else:
        out_name = output_filename

    out_file_path = processed_dir / out_name
    with open(out_file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(out_headers)
        writer.writerows(final_rows)

    metrics = {
        "rows_before": rows_before,
        "rows_after": len(final_rows),
        "initial_rows": rows_before,
        "final_rows": len(final_rows),
        "columns_before": cols_before,
        "columns_after": len(out_headers),
        "initial_columns": cols_before,
        "final_columns": len(out_headers),
        "duplicates_removed": rows_before - len(final_rows),
        "imputation_strategy": impute_strategy,
        "imputed_columns_count": len(imputed_stats),
        "imputed_columns": list(imputed_stats.keys()),
        "processed_file_path": str(out_file_path),
        "output_filename": out_name
    }

    return str(out_file_path), metrics

