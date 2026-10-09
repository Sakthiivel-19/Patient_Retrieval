from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    REVIEWER = "reviewer"
    AUDITOR = "auditor"

ROLE_PERMISSIONS = {
    Role.ADMIN: [
        "users:read", "users:write",
        "patients:read_all", "patients:grant",
        "audit:read", "system:manage"
    ],
    Role.DOCTOR: [
        "patients:read_authorized",
        "documents:upload", "documents:read",
        "questions:ask", "reconciliation:read",
        "conflicts:review", "comparison:read"
    ],
    Role.REVIEWER: [
        "patients:read_authorized",
        "documents:read", "audit:read",
        "conflicts:review", "comparison:read"
    ],
    Role.AUDITOR: [
        "patients:read_authorized",
        "audit:read", "audit:export",
        "documents:read", "comparison:read"
    ]
}
