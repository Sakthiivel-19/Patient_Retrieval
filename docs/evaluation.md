# CareLens AI — Evaluation Framework

## Evaluation Criteria & Benchmarks

| Metric | Target | Verified Status |
|---|---|---|
| **Pre-Retrieval Authorization** | 100% block rate on missing patient grant | **PASSED (100%)** |
| **Cross-Patient Leakage** | 0% chunks retrieved from other patients | **PASSED (0% Leakage)** |
| **Citation Veracity** | 100% of answers cite valid document & page | **PASSED (100%)** |
| **Prompt Injection Defense** | Intercepts system prompt manipulation | **PASSED** |
| **Reconciliation Accuracy** | Categorizes Matched, Pending, Missing, Review | **PASSED** |
| **Human-in-the-Loop Audit** | All conflict resolutions recorded to audit log | **PASSED** |

## Test Execution Command
```bash
python -m pytest backend/tests/
python scripts/run_demo_checks.py
```
