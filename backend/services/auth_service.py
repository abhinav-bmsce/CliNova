from typing import Optional, Dict, Any, List
from backend.database.session import get_db_connection
from backend.core.security import hash_password, verify_password, create_access_token
from backend.services.audit_service import log_audit

def authenticate_user(
    username_or_email: str,
    password: str,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """Verify credentials, check active status, generate JWT access token, and log audit."""
    clean_identifier = username_or_email.strip().lower()

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.email, u.username, u.password_hash, u.full_name, 
                   u.department, u.role_id, u.is_active, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE LOWER(u.email) = ? OR LOWER(u.username) = ?;
        """, (clean_identifier, clean_identifier))
        user_row = cursor.fetchone()

        if not user_row:
            log_audit(
                action="AUTH_LOGIN_FAILED",
                resource_type="USER",
                ip_address=ip_address,
                details=f"Failed login attempt for nonexistent identifier: {clean_identifier}"
            )
            raise ValueError("Invalid username/email or password.")

        if not user_row["is_active"]:
            log_audit(
                action="AUTH_LOGIN_BLOCKED",
                resource_type="USER",
                user_id=user_row["id"],
                ip_address=ip_address,
                details="Login attempt on deactivated account."
            )
            raise ValueError("Account has been deactivated. Please contact an administrator.")

        if not verify_password(password, user_row["password_hash"]):
            log_audit(
                action="AUTH_LOGIN_FAILED",
                resource_type="USER",
                user_id=user_row["id"],
                ip_address=ip_address,
                details="Invalid password attempt."
            )
            raise ValueError("Invalid username/email or password.")

        # Successful authentication
        user_id = user_row["id"]
        role_name = user_row["role_name"]

        token_claims = {
            "sub": str(user_id),
            "email": user_row["email"],
            "username": user_row["username"],
            "role": role_name,
            "role_id": user_row["role_id"],
            "name": user_row["full_name"]
        }
        token = create_access_token(token_claims)

        log_audit(
            action="AUTH_LOGIN_SUCCESS",
            resource_type="USER",
            user_id=user_id,
            resource_id=str(user_id),
            ip_address=ip_address,
            details=f"User {user_row['username']} logged in successfully as {role_name}."
        )

        return {
            "token": token,
            "user": {
                "id": user_id,
                "email": user_row["email"],
                "username": user_row["username"],
                "full_name": user_row["full_name"],
                "department": user_row["department"],
                "role_id": user_row["role_id"],
                "role": role_name,
                "is_active": bool(user_row["is_active"])
            }
        }

def register_user(
    email: str,
    username: str,
    password: str,
    full_name: str,
    department: str = "",
    role_id: int = 2, # Defaults to Researcher
    operator_user_id: Optional[int] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """Register a new user account with unique email/username checks and password hashing."""
    email_clean = email.strip().lower()
    username_clean = username.strip().lower()

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check existing email
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?;", (email_clean,))
        if cursor.fetchone():
            raise ValueError("A user with this email address already exists.")

        # Check existing username
        cursor.execute("SELECT id FROM users WHERE LOWER(username) = ?;", (username_clean,))
        if cursor.fetchone():
            raise ValueError("This username is already taken.")

        # Validate role_id
        cursor.execute("SELECT id, name FROM roles WHERE id = ?;", (role_id,))
        role_row = cursor.fetchone()
        if not role_row:
            raise ValueError(f"Invalid role ID: {role_id}")
        role_name = role_row["name"]

        hashed = hash_password(password)
        cursor.execute("""
            INSERT INTO users (email, username, password_hash, full_name, department, role_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1);
        """, (email_clean, username_clean, hashed, full_name.strip(), department.strip(), role_id))
        new_user_id = cursor.lastrowid

        log_audit(
            action="USER_REGISTERED",
            resource_type="USER",
            user_id=operator_user_id or new_user_id,
            resource_id=str(new_user_id),
            ip_address=ip_address,
            details=f"New user registered: {username_clean} ({email_clean}) with role {role_name}.",
            conn=conn
        )

        return {
            "id": new_user_id,
            "email": email_clean,
            "username": username_clean,
            "full_name": full_name.strip(),
            "department": department.strip(),
            "role_id": role_id,
            "role": role_name,
            "is_active": True
        }

def get_user_profile(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve sanitized user details."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.email, u.username, u.full_name, u.department, 
                   u.role_id, u.is_active, u.created_at, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?;
        """, (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "email": row["email"],
            "username": row["username"],
            "full_name": row["full_name"],
            "department": row["department"],
            "role_id": row["role_id"],
            "role": row["role_name"],
            "is_active": bool(row["is_active"]),
            "created_at": str(row["created_at"])
        }

def update_password(
    user_id: int,
    current_password: str,
    new_password: str,
    ip_address: Optional[str] = None
) -> bool:
    """Safely update user password after validating current password."""
    if len(new_password) < 8:
        raise ValueError("New password must be at least 8 characters long.")

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE id = ?;", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError("User not found.")

        if not verify_password(current_password, row["password_hash"]):
            raise ValueError("Current password does not match.")

        new_hash = hash_password(new_password)
        cursor.execute("""
            UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;
        """, (new_hash, user_id))

        log_audit(
            action="PASSWORD_CHANGED",
            resource_type="USER",
            user_id=user_id,
            resource_id=str(user_id),
            ip_address=ip_address,
            details="User successfully changed their password.",
            conn=conn
        )
        return True

def list_users() -> List[Dict[str, Any]]:
    """Retrieve list of all users for Administrator role management."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.email, u.username, u.full_name, u.department,
                   u.role_id, u.is_active, u.created_at, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id ASC;
        """)
        return [
            {
                "id": r["id"],
                "email": r["email"],
                "username": r["username"],
                "full_name": r["full_name"],
                "department": r["department"],
                "role_id": r["role_id"],
                "role": r["role_name"],
                "is_active": bool(r["is_active"]),
                "created_at": str(r["created_at"])
            }
            for r in cursor.fetchall()
        ]

def toggle_user_active(
    target_user_id: int,
    is_active: bool,
    admin_user_id: int,
    ip_address: Optional[str] = None
) -> bool:
    """Activate or deactivate a user account (Admin only)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;
        """, (1 if is_active else 0, target_user_id))

        status_text = "activated" if is_active else "deactivated"
        log_audit(
            action=f"USER_{status_text.upper()}",
            resource_type="USER",
            user_id=admin_user_id,
            resource_id=str(target_user_id),
            ip_address=ip_address,
            details=f"Admin ID {admin_user_id} {status_text} user ID {target_user_id}.",
            conn=conn
        )
        return True

def change_user_role(
    target_user_id: int,
    new_role_id: int,
    admin_user_id: int,
    ip_address: Optional[str] = None
) -> bool:
    """Reassign user role (Admin only)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM roles WHERE id = ?;", (new_role_id,))
        role_row = cursor.fetchone()
        if not role_row:
            raise ValueError("Target role does not exist.")

        cursor.execute("""
            UPDATE users SET role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;
        """, (new_role_id, target_user_id))

        log_audit(
            action="USER_ROLE_CHANGED",
            resource_type="USER",
            user_id=admin_user_id,
            resource_id=str(target_user_id),
            ip_address=ip_address,
            details=f"Admin ID {admin_user_id} changed user ID {target_user_id} role to {role_row['name']}.",
            conn=conn
        )
        return True
