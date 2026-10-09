# CareLens AI — System Architecture

CareLens AI is an evidence-backed clinical history intelligence platform designed around the **Compare → Verify → Update** clinical workflow and the **Authorize → Retrieve → Generate → Cite** security paradigm.

```
 USER (Clinician / Staff)
        │
        ▼
 FRONTEND (React + TypeScript + Vite)
        │
        ▼
 AUTHENTICATION & RBAC GATEWAY
        │
        ▼
 PATIENT-LEVEL PERMISSION CHECK (Pre-Retrieval Guard)
 ┌───────────────────────────────────────────────┐
 │                                               │
 ▼                                               ▼
STRUCTURED FACTS                      VECTOR SEARCH (Patient Isolated)
 │                                               │
 └───────────────────────┬───────────────────────┘
                         ▼
             SECURE CONTEXT BUILDER
                         ▼
                  LLM PROVIDER
                         ▼
             EVIDENCE & CITATION VALIDATOR
                         ▼
             GROUNDED ANSWER + EVIDENCE
                         ▼
               IMMUTABLE AUDIT LOG
```

## Ingestion Architecture
```
 PDF Upload ➔ File Validation ➔ SHA256 Deduplication ➔ Page-Aware Extraction ➔ Chunking ➔ Facts Extraction ➔ Vector Embeddings ➔ Reconciliation & Conflict Detection ➔ Versioning & Audit Log
```
