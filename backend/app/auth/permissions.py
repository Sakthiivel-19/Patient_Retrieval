from typing import List
from backend.app.auth.roles import Role, ROLE_PERMISSIONS

def has_role_permission(role: str, required_permission: str) -> bool:
    try:
        r = Role(role)
        permissions = ROLE_PERMISSIONS.get(r, [])
        return required_permission in permissions
    except ValueError:
        return False

def get_role_permissions(role: str) -> List[str]:
    try:
        r = Role(role)
        return ROLE_PERMISSIONS.get(r, [])
    except ValueError:
        return []
