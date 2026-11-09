import sqlite3
import os
from contextlib import contextmanager
from backend.core.config import settings
from backend.database.schema import apply_schema
from backend.database.seed import seed_database

def get_db_path() -> str:
    """Extract SQLite database file path from DATABASE_URL."""
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite:///"):
        return db_url.replace("sqlite:///", "")
    return str(settings.STORAGE_DIR / "clinova.db")

def init_db():
    """Initialize relational database, apply table schemas, and seed initial clinical roles & users."""
    db_path = get_db_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with sqlite3.connect(db_path, timeout=30.0) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        conn.execute("PRAGMA busy_timeout=30000;")
        apply_schema(conn)
        seed_database(conn)

@contextmanager
def get_db_connection():
    """Yield a managed SQLite database connection with row factory and WAL mode."""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA busy_timeout=30000;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def check_db_health() -> bool:
    """Verify that the database engine responds to queries and schema tables exist."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM roles;")
            count = cursor.fetchone()[0]
            return count >= 3
    except Exception:
        return False
