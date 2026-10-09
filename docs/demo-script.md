# CareLens AI — Hackathon Live Demo Script

## Step-by-Step Presentation Script

1. **Login & Persona Switcher (0:00 - 0:30)**
   - Open app at `http://localhost:5173`.
   - Log in as **Dr. Sarah Miller** (`doctor.sarah@carelens.ai`).
   - Highlight: Pre-retrieval RBAC is active.

2. **Patient Directory & Authorized Access (0:30 - 1:00)**
   - Notice patient **Eleanor Vance (P001)** has an active grant badge.
   - Click on Eleanor Vance to enter the workspace.

3. **Clinical Timeline & Source Verification (1:00 - 1:45)**
   - Show the chronological longitudinal history (Consultations, Orders, Procedures).
   - Click **"View Source Evidence"** on an event to open the Evidence Viewer with verified document page and chunk provenance.

4. **Evidence-Backed AI Assistant (1:45 - 2:30)**
   - Click on the **AI Assistant** tab.
   - Click prompt: *"What tests were requested during the initial consultation?"*
   - Show the grounded answer with exact document and page citations (`consultation_note_cycle1.pdf`, Page 1).
   - Click the citation badge to inspect the exact highlighted excerpt.

5. **Test Matching & Reconciliation Matrix (2:30 - 3:15)**
   - Open **Test Matching Matrix** tab.
   - Explain the 4 states: `Matched`, `Recorded Pending`, `Result Not Found`, `Needs Review`.
   - Show that Complete Blood Count is `Matched`, while H. Pylori is `Result Not Found` (Cycle 2 order missing result).

6. **Longitudinal Cycle Comparison (3:15 - 3:45)**
   - Open **Cycle Comparison** tab.
   - Review Cycle 1 vs Cycle 2: What changed, what stayed the same, and what is contradictory.

7. **Conflict Detection & Human-in-the-Loop Review (3:45 - 4:30)**
   - Open **Clinical Conflicts** tab.
   - Point out the procedure date conflict: `2026-01-10` in intake note vs `2026-01-15` in operative note.
   - Demonstrate Human-in-the-Loop resolution by selecting `Resolved_B (2026-01-15)` and submitting clinical rationale.
   - Verify conflict state changes to resolved and writes to audit log.

8. **New Report Upload & Change Detection (4:30 - 5:15)**
   - Click **"Upload New Report"**.
   - Click **"Load Sample Report"** (Cycle 2 Pathology & Biopsy Report).
   - Click **"Process & Reconcile History"**.
   - Show live change diff:
     - `+ New test result detected`
     - `✓ Previous blood-test request matched`
     - `✓ H. Pylori test resolved`

9. **Security Enforcement & Access Denied Demo (5:15 - 5:45)**
   - Switch user in top bar to **Dr. Bob Chen** (who has NO grant for P001).
   - Attempt to open Eleanor Vance (P001) or navigate to `/patients/P999`.
   - Show **403 Access Denied** screen: Security guard blocks retrieval before LLM context is ever created.
   - Click **"Run Security Verification Suite"** in top header to execute all 4 automated tests live for the judges!
