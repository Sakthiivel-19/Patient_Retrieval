# CareLens AI — Security Architecture

## Core Security Mandates

### 1. Pre-Retrieval Authorization (Never Rely on LLM for Access Control)
```
[User Request] ➔ [JWT Token] ➔ [Identify Role] ➔ [Check Patient Grant Table] ➔ [SQL Authorized Scope Filter] ➔ [Vector Retrieval] ➔ [LLM Context]
```
- **Rule:** Unauthorized records must NEVER enter the retrieval pipeline or LLM context.

### 2. Cross-Patient Isolation
- All chunks and facts are strictly bound to `patient_id`.
- Retrieval queries are filtered at the database level (`patient_id == target_patient_id`).

### 3. Prompt Injection Protection
- All user and document texts are treated as untrusted data.
- Boundary demarcation wrappers `<CLINICAL_DOCUMENT>` isolate document contents from prompt instructions.
- Injection scanner intercepts override patterns (`ignore previous instructions`, `reveal system keys`, etc.).

### 4. Immutable Audit Trail
- Every login, record query, RAG question, document upload, and conflict resolution is logged with timestamp, user ID, and IP address.
