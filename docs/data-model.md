# CareLens AI — Data Model Specification

## Entity Relational Hierarchy

```
User (Staff)
 ├── StaffProfile (1:1)
 └── PatientGrant (1:N)
      └── Patient (Target Patient Scope)
           ├── Documents (1:N)
           │    └── Chunks (1:N, with embeddings and page_number)
           ├── Events (Timeline Items)
           ├── TestRequests
           ├── TestResults
           ├── Conflicts (Discrepancies flagged for human review)
           └── AuditEvents (Immutable security and query log)
```

## Data Types & Tables
- `users`: `id`, `email`, `hashed_password`, `full_name`, `role`, `is_active`, `created_at`
- `staff_profiles`: `id`, `user_id`, `role`, `department`, `license_number`
- `patients`: `id`, `name`, `date_of_birth`, `gender`, `mrn`, `metadata_json`, `created_at`
- `patient_grants`: `id`, `user_id`, `patient_id`, `permissions`, `granted_by`, `created_at`
- `documents`: `id`, `patient_id`, `filename`, `file_path`, `hash`, `version`, `status`, `uploaded_by`, `cycle_label`, `document_type`, `created_at`
- `chunks`: `id`, `document_id`, `patient_id`, `page_number`, `chunk_index`, `content`, `embedding_json`, `metadata_json`
- `events`: `id`, `patient_id`, `document_id`, `cycle_label`, `event_type`, `event_date`, `description`, `source_page`
- `test_requests`: `id`, `patient_id`, `document_id`, `cycle_label`, `test_name`, `requested_date`, `status`, `requesting_physician`
- `test_results`: `id`, `patient_id`, `document_id`, `cycle_label`, `test_name`, `result_date`, `result_data`, `reference_range`, `is_abnormal`
- `conflicts`: `id`, `patient_id`, `cycle_label`, `conflict_type`, `fact_a`, `fact_b`, `source_a_doc`, `source_a_page`, `source_b_doc`, `source_b_page`, `status`, `reviewed_by`, `resolution_note`, `created_at`
- `audit_events`: `id`, `user_id`, `patient_id`, `action`, `resource`, `timestamp`, `ip_address`, `metadata_json`
