import os
import sys

# Script to create sample clinical demo documents
os.makedirs("demo-data/reports", exist_ok=True)
os.makedirs("demo-data/expected_answers", exist_ok=True)
os.makedirs("demo-data/scenarios", exist_ok=True)
os.makedirs("storage/documents/P001", exist_ok=True)

# 1. Update Report Document (Pathology Biopsy & Confirmatory Results)
update_report_text = """CareLens Pathology & Molecular Diagnostics
PATIENT: Eleanor Vance | MRN: MRN-849201 | DOB: 1978-04-12
Date of Specimen: 2026-02-18 | Accession #: PATH-2026-8841
Ordering Physician: Dr. Sarah Miller, MD

PATHOLOGY REPORT & NEW RECONCILIATION DATA:

1. Clinical Test Result: Helicobacter pylori Stool Antigen & Biopsy Urease
   - Result: Negative for H. pylori antigen.
   - Status: COMPLETED / RESOLVED
   - Finding: No Helicobacter-like organisms identified on Giemsa stain.

2. Clinical Test Result: Complete Blood Count (CBC) Repeat
   - Result: Hemoglobin 14.1 g/dL, Platelets 255,000 /mcL, WBC 7.1 x10^3/mcL
   - Status: COMPLETED [Normal Limits]

3. Procedure Verification Note:
   - Note: Verified endoscopy procedure log confirms procedure was conducted on 2026-01-15 after rescheduled prep from original 2026-01-10 booking.
"""

with open("demo-data/reports/pathology_biopsy_update_cycle2.txt", "w", encoding="utf-8") as f:
    f.write(update_report_text)

# Also create expected Q&A answers
expected_answers = {
    "P001": [
        {
            "question": "What tests were requested during the previous consultation?",
            "expected_answer": "A Complete Blood Count (CBC) and Abdominal Ultrasound were requested during the initial consultation.",
            "sources": ["consultation_note_cycle1.pdf"]
        },
        {
            "question": "What were the results of the abdominal ultrasound?",
            "expected_answer": "Mild diffuse hepatic steatosis with normal gallbladder and non-dilated biliary ducts.",
            "sources": ["lab_ultrasound_results_cycle1.pdf"]
        },
        {
            "question": "Are there any conflicting procedure dates in the record?",
            "expected_answer": "Yes, the consultation note lists the procedure for 2026-01-10 while the operative report records it on 2026-01-15.",
            "sources": ["consultation_note_cycle1.pdf", "operative_endoscopy_cycle2.pdf"]
        }
    ]
}

with open("demo-data/expected_answers/p001_expected.json", "w", encoding="utf-8") as f:
    import json
    json.dump(expected_answers, f, indent=2)

print("[OK] Demo reports and expected answers created.")
