# CareLens AI — API Specification

Base URL: `/api/v1`

## Authentication
- `POST /api/v1/auth/login`
  - Body: `{"email": "...", "password": "..."}`
  - Returns: JWT access token, user profile, role
- `GET /api/v1/auth/me`

## Patient Management
- `GET /api/v1/patients` (Patient directory with pre-retrieval grant indicators)
- `GET /api/v1/patients/{patient_id}` (Requires patient authorization)
- `GET /api/v1/patients/{patient_id}/brief` (Clinical summary, counts, active cycles)

## Documents & Ingestion
- `POST /api/v1/patients/{patient_id}/documents` (Upload PDF/report, extracts facts & returns change summary)
- `GET /api/v1/patients/{patient_id}/documents`
- `GET /api/v1/patients/{patient_id}/documents/{document_id}/status`
- `GET /api/v1/patients/{patient_id}/documents/{document_id}/view` (Chunks with page numbers)

## Clinical Intelligence & RAG
- `GET /api/v1/patients/{patient_id}/timeline` (Chronological clinical history)
- `POST /api/v1/patients/{patient_id}/questions` (Evidence-grounded RAG query)
  - Body: `{"question": "..."}`
  - Returns: `answer`, `sources: [{ document, page, excerpt }]`, `limitations`

## Reconciliation & Comparison
- `GET /api/v1/patients/{patient_id}/reconciliation` (Test request -> result matching matrix)
- `GET /api/v1/patients/{patient_id}/cycles/compare` (Cycle 1 vs Cycle 2 comparison)
- `GET /api/v1/patients/{patient_id}/conflicts`
- `POST /api/v1/patients/{patient_id}/conflicts/{conflict_id}/reviews` (Human-in-the-loop review)
- `GET /api/v1/patients/{patient_id}/changes` (Provenance & version log)

## Audit
- `GET /api/v1/audit` (Immutable audit trail)
