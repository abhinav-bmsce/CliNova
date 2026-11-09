from typing import List, Dict, Any, Optional
from backend.database.session import get_db_connection
from backend.services.audit_service import log_audit

def list_projects_for_user(user_id: int, user_role: str) -> List[Dict[str, Any]]:
    """
    List projects accessible to the user:
    - Administrators can view all projects.
    - Researchers and Viewers view projects they own or are members of.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user_role == "Administrator":
            query = """
                SELECT p.id, p.name, p.description, p.target_objective, p.owner_id, 
                       u.full_name as owner_name, u.email as owner_email,
                       p.created_at, p.updated_at,
                       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
                       (SELECT COUNT(*) FROM datasets d WHERE d.project_id = p.id) as dataset_count,
                       (SELECT COUNT(*) FROM analysis_jobs aj WHERE aj.project_id = p.id) as analysis_count
                FROM projects p
                JOIN users u ON p.owner_id = u.id
                WHERE p.is_archived = 0
                ORDER BY p.updated_at DESC;
            """
            cursor.execute(query)
        else:
            query = """
                SELECT DISTINCT p.id, p.name, p.description, p.target_objective, p.owner_id,
                       u.full_name as owner_name, u.email as owner_email,
                       p.created_at, p.updated_at,
                       (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
                       (SELECT COUNT(*) FROM datasets d WHERE d.project_id = p.id) as dataset_count,
                       (SELECT COUNT(*) FROM analysis_jobs aj WHERE aj.project_id = p.id) as analysis_count
                FROM projects p
                JOIN users u ON p.owner_id = u.id
                LEFT JOIN project_members pm ON p.id = pm.project_id
                WHERE p.is_archived = 0 AND (p.owner_id = ? OR pm.user_id = ?)
                ORDER BY p.updated_at DESC;
            """
            cursor.execute(query, (user_id, user_id))

        return [dict(r) for r in cursor.fetchall()]

def create_project(
    name: str,
    description: str,
    target_objective: str,
    owner_id: int,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new clinical KDD project and set the creator as owner."""
    if not name.strip():
        raise ValueError("Project name is required.")

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO projects (name, description, target_objective, owner_id)
            VALUES (?, ?, ?, ?);
        """, (name.strip(), description.strip(), target_objective.strip(), owner_id))
        project_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO project_members (project_id, user_id, member_role)
            VALUES (?, ?, 'owner');
        """, (project_id, owner_id))

        log_audit(
            action="PROJECT_CREATED",
            resource_type="PROJECT",
            user_id=owner_id,
            resource_id=str(project_id),
            ip_address=ip_address,
            details=f"Created clinical project: '{name.strip()}'.",
            conn=conn
        )

        return {
            "id": project_id,
            "name": name.strip(),
            "description": description.strip(),
            "target_objective": target_objective.strip(),
            "owner_id": owner_id
        }

def get_project_by_id(project_id: int, user_id: int, user_role: str) -> Optional[Dict[str, Any]]:
    """Retrieve project metadata and verify access rights."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.name, p.description, p.target_objective, p.owner_id,
                   u.full_name as owner_name, u.email as owner_email,
                   p.created_at, p.updated_at
            FROM projects p
            JOIN users u ON p.owner_id = u.id
            WHERE p.id = ? AND p.is_archived = 0;
        """, (project_id,))
        row = cursor.fetchone()
        if not row:
            return None

        project = dict(row)

        # Enforce access permissions
        if user_role != "Administrator" and project["owner_id"] != user_id:
            cursor.execute("SELECT id FROM project_members WHERE project_id = ? AND user_id = ?;", (project_id, user_id))
            if not cursor.fetchone():
                raise PermissionError("You do not have permission to access this project.")

        # Fetch members
        cursor.execute("""
            SELECT pm.id, pm.user_id, u.full_name, u.email, pm.member_role, pm.added_at
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?;
        """, (project_id,))
        project["members"] = [dict(m) for m in cursor.fetchall()]

        # Fetch associated datasets
        cursor.execute("""
            SELECT id, name, filename, row_count, column_count, created_at
            FROM datasets
            WHERE project_id = ?;
        """, (project_id,))
        project["datasets"] = [dict(d) for d in cursor.fetchall()]

        return project

def delete_project(project_id: int, user_id: int, user_role: str, ip_address: Optional[str] = None) -> bool:
    """Soft delete or archive a project (Owner or Administrator only)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT owner_id, name FROM projects WHERE id = ?;", (project_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError("Project not found.")

        if user_role != "Administrator" and row["owner_id"] != user_id:
            raise PermissionError("Only the project owner or an administrator can delete this project.")

        cursor.execute("UPDATE projects SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?;", (project_id,))

        log_audit(
            action="PROJECT_DELETED",
            resource_type="PROJECT",
            user_id=user_id,
            resource_id=str(project_id),
            ip_address=ip_address,
            details=f"Project '{row['name']}' (ID: {project_id}) archived/deleted.",
            conn=conn
        )
        return True
