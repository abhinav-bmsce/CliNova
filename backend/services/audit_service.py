import sqlite3
from typing import Optional, List, Dict, Any
from backend.database.session import get_db_connection

def log_audit(
    action: str,
    resource_type: str,
    user_id: Optional[int] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[str] = None,
    conn: Optional[sqlite3.Connection] = None
):
    """Securely record an audit log event. Supports reusing existing active connection."""
    sql = """
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, details)
        VALUES (?, ?, ?, ?, ?, ?);
    """
    params = (user_id, action, resource_type, str(resource_id) if resource_id else None, ip_address, details)

    try:
        if conn is not None:
            conn.execute(sql, params)
        else:
            with get_db_connection() as local_conn:
                local_conn.execute(sql, params)
    except Exception as e:
        print(f"[AUDIT LOGGING FAILURE] {action}: {e}")

def list_audit_logs(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieve audit trail with user identity join for administrative compliance inspection."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                a.id, 
                a.user_id, 
                u.full_name as user_full_name,
                u.email as user_email,
                a.action, 
                a.resource_type, 
                a.resource_id, 
                a.ip_address, 
                a.details, 
                a.timestamp
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
            LIMIT ? OFFSET ?;
        """, (limit, offset))
        return [dict(row) for row in cursor.fetchall()]
