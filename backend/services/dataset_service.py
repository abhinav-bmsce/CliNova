import os
import io
import csv
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
from werkzeug.utils import secure_filename
from backend.core.config import settings
from backend.database.session import get_db_connection
from backend.services.audit_service import log_audit

ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.txt'}

def list_datasets_for_user(user_id: int, user_role: str = "Researcher") -> List[Dict[str, Any]]:
    """List datasets accessible to the specified user based on role and project membership."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user_role == "Administrator":
            query = """
                SELECT d.id, d.name, d.description, d.source, d.filename, d.file_path, 
                       d.file_size_bytes, d.row_count, d.column_count, d.owner_id, 
                       u.full_name as owner_name, d.project_id, p.name as project_name, 
                       d.created_at
                FROM datasets d
                JOIN users u ON d.owner_id = u.id
                LEFT JOIN projects p ON d.project_id = p.id
                ORDER BY d.created_at DESC;
            """
            cursor.execute(query)
        else:
            query = """
                SELECT d.id, d.name, d.description, d.source, d.filename, d.file_path, 
                       d.file_size_bytes, d.row_count, d.column_count, d.owner_id, 
                       u.full_name as owner_name, d.project_id, p.name as project_name, 
                       d.created_at
                FROM datasets d
                JOIN users u ON d.owner_id = u.id
                LEFT JOIN projects p ON d.project_id = p.id
                WHERE d.owner_id = ? 
                   OR d.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
                ORDER BY d.created_at DESC;
            """
            cursor.execute(query, (user_id, user_id))
        
        return [dict(r) for r in cursor.fetchall()]

def save_uploaded_dataset(
    file_bytes: bytes,
    original_filename: str,
    name: str,
    description: str,
    owner_id: int,
    project_id: Optional[int] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate, parse (CSV or XLSX), profile, securely store, and register an uploaded clinical dataset.
    Populates schema and column profiles into dataset_columns table.
    """
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file format '{ext}'. CLINOVA accepts .csv, .xlsx, and .xls files.")

    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded file is empty (0 bytes). Please upload a valid clinical dataset.")

    # 1. Parse into Pandas DataFrame
    try:
        if ext in {'.xlsx', '.xls'}:
            df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
        else:
            # Try UTF-8 first, fallback to latin1/ISO-8859-1
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin1")
    except Exception as e:
        raise ValueError(f"Failed to parse clinical dataset: {str(e)}")

    if df.empty:
        raise ValueError("The uploaded dataset contains no records or rows.")

    row_count = int(len(df))
    col_count = int(len(df.columns))

    # Standardize column headers (clean whitespace)
    df.columns = [str(c).strip() for c in df.columns]

    # 2. Persist Standardized CSV File in raw datasets directory
    safe_base = secure_filename(Path(original_filename).stem)
    unique_filename = f"{uuid.uuid4().hex[:10]}_{safe_base}.csv"
    raw_dir = settings.RAW_DATASETS_DIR
    raw_dir.mkdir(parents=True, exist_ok=True)
    target_csv_path = raw_dir / unique_filename

    df.to_csv(target_csv_path, index=False, encoding="utf-8")
    file_size = target_csv_path.stat().st_size

    # 3. Database Registration & Column Profiling
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO datasets (name, description, source, filename, file_path, file_size_bytes, row_count, column_count, owner_id, project_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            name.strip() if name else safe_base,
            description.strip() if description else "User-uploaded clinical encounter cohort.",
            f"Upload ({original_filename})",
            original_filename,
            str(target_csv_path),
            file_size,
            row_count,
            col_count,
            owner_id,
            project_id
        ))
        dataset_id = cursor.lastrowid

        # Insert detailed column profiling
        for col_name in df.columns:
            s = df[col_name]
            is_num = pd.api.types.is_numeric_dtype(s)
            data_type = "numeric" if is_num else "categorical"
            null_count = int(s.isna().sum())
            distinct_count = int(s.nunique(dropna=True))
            sample_vals = [str(v) for v in s.dropna().unique()[:5].tolist()]

            cursor.execute("""
                INSERT INTO dataset_columns (dataset_id, column_name, data_type, null_count, distinct_count, sample_values_json)
                VALUES (?, ?, ?, ?, ?, ?);
            """, (dataset_id, col_name, data_type, null_count, distinct_count, json.dumps(sample_vals)))

        log_audit(
            action="DATASET_UPLOADED",
            resource_type="DATASET",
            user_id=owner_id,
            resource_id=str(dataset_id),
            ip_address=ip_address,
            details=f"Uploaded '{original_filename}' ({row_count} encounters, {col_count} clinical attributes).",
            conn=conn
        )

        return {
            "id": dataset_id,
            "name": name.strip() if name else safe_base,
            "filename": original_filename,
            "file_size_bytes": file_size,
            "row_count": row_count,
            "column_count": col_count,
            "project_id": project_id
        }

def get_dataset_preview(dataset_id: int, limit: int = 50) -> Dict[str, Any]:
    """Retrieve row preview, column metadata, and completeness metrics for data inspection."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, filename, file_path, row_count, column_count, created_at 
            FROM datasets 
            WHERE id = ?;
        """, (dataset_id,))
        row = cursor.fetchone()
        if not row:
            raise FileNotFoundError(f"Dataset ID {dataset_id} not found.")

        path = Path(row["file_path"])
        if not path.exists():
            raise FileNotFoundError(f"Underlying data file does not exist at {path}.")

        # Retrieve column schema metadata
        cursor.execute("""
            SELECT column_name, data_type, null_count, distinct_count, sample_values_json
            FROM dataset_columns
            WHERE dataset_id = ?
            ORDER BY id ASC;
        """, (dataset_id,))
        columns_meta = [
            {
                "name": c["column_name"],
                "type": c["data_type"],
                "null_count": c["null_count"],
                "distinct_count": c["distinct_count"],
                "sample_values": json.loads(c["sample_values_json"]) if c["sample_values_json"] else []
            }
            for c in cursor.fetchall()
        ]

        # Read preview rows
        headers = []
        preview_rows = []
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)
            try:
                headers = next(reader)
                for i, r in enumerate(reader):
                    if i >= limit:
                        break
                    preview_rows.append(r)
            except StopIteration:
                pass

        return {
            "dataset_id": dataset_id,
            "name": row["name"],
            "filename": row["filename"],
            "total_rows": row["row_count"],
            "total_columns": row["column_count"],
            "created_at": row["created_at"],
            "headers": headers,
            "rows": preview_rows,
            "columns": columns_meta
        }

def delete_dataset(dataset_id: int, user_id: int, user_role: str = "Researcher", ip_address: Optional[str] = None):
    """Delete a dataset and its physical file with strict permission verification."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, file_path, owner_id FROM datasets WHERE id = ?;", (dataset_id,))
        row = cursor.fetchone()
        if not row:
            raise FileNotFoundError(f"Dataset ID {dataset_id} does not exist.")

        if user_role != "Administrator" and row["owner_id"] != user_id:
            raise PermissionError("Access denied: You do not possess permission to delete this dataset.")

        # Remove physical file if present
        try:
            p = Path(row["file_path"])
            if p.exists():
                p.unlink()
        except Exception as e:
            print(f"Warning: could not delete file {row['file_path']}: {e}")

        # Cascade delete child analysis jobs and associated artifacts
        cursor.execute("SELECT id FROM analysis_jobs WHERE dataset_id = ?;", (dataset_id,))
        aj_rows = cursor.fetchall()
        aj_ids = [r["id"] for r in aj_rows]
        if aj_ids:
            placeholders = ",".join("?" for _ in aj_ids)
            cursor.execute(f"DELETE FROM association_rules WHERE analysis_id IN ({placeholders});", aj_ids)
            cursor.execute(f"DELETE FROM cluster_results WHERE analysis_id IN ({placeholders});", aj_ids)
            cursor.execute(f"DELETE FROM model_results WHERE analysis_id IN ({placeholders});", aj_ids)
            cursor.execute(f"DELETE FROM frequent_itemsets WHERE analysis_id IN ({placeholders});", aj_ids)
            cursor.execute(f"DELETE FROM analysis_jobs WHERE id IN ({placeholders});", aj_ids)

        cursor.execute("DELETE FROM preprocessing_jobs WHERE dataset_id = ? OR resulting_dataset_id = ?;", (dataset_id, dataset_id))
        cursor.execute("DELETE FROM dataset_columns WHERE dataset_id = ?;", (dataset_id,))

        # Cascade delete dataset record
        cursor.execute("DELETE FROM datasets WHERE id = ?;", (dataset_id,))

        log_audit(
            action="DATASET_DELETED",
            resource_type="DATASET",
            user_id=user_id,
            resource_id=str(dataset_id),
            ip_address=ip_address,
            details=f"Deleted dataset '{row['name']}' (ID: {dataset_id}).",
            conn=conn
        )
