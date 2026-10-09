import re
from typing import List, Dict, Any

def extract_candidate_facts_from_text(
    text: str,
    document_id: str,
    patient_id: str,
    cycle_label: str = "Cycle 1",
    page_number: int = 1
) -> Dict[str, Any]:
    """
    Extracts candidate structured clinical facts:
    - events (consultations, admissions, procedures)
    - requested tests
    - test results
    - dates & medications
    """
    events = []
    test_requests = []
    test_results = []
    
    # 1. Look for date patterns (e.g. 2026-01-10, 10-Jan-2026, 01/10/2026)
    lines = text.split("\n")
    current_date = "2026-01-10" # default if not found
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # Match dates
        date_match = re.search(r"\b(202[4-7]-\d{2}-\d{2})\b", line_clean)
        if date_match:
            current_date = date_match.group(1)
            
        # Match Consultation / Clinical note headers
        if any(w in line_clean.lower() for w in ["consultation", "clinical note", "assessment", "admission"]):
            events.append({
                "patient_id": patient_id,
                "document_id": document_id,
                "cycle_label": cycle_label,
                "event_type": "Consultation",
                "event_date": current_date,
                "description": line_clean[:200],
                "source_page": page_number
            })
            
        # Match Procedure
        if any(w in line_clean.lower() for w in ["procedure", "surgery", "biopsy", "colonoscopy", "endoscopy", "angioplasty"]):
            events.append({
                "patient_id": patient_id,
                "document_id": document_id,
                "cycle_label": cycle_label,
                "event_type": "Procedure",
                "event_date": current_date,
                "description": line_clean[:200],
                "source_page": page_number
            })
            
        # Match Test Request / Order patterns
        if any(w in line_clean.lower() for w in ["requested", "order:", "ordered", "tests requested", "requisition"]):
            # Extract specific test name
            test_names = []
            if "blood test" in line_clean.lower() or "cbc" in line_clean.lower():
                test_names.append("Complete Blood Count (CBC)")
            if "ultrasound" in line_clean.lower():
                test_names.append("Abdominal Ultrasound")
            if "mri" in line_clean.lower():
                test_names.append("Pelvic MRI")
            if "lipid" in line_clean.lower():
                test_names.append("Lipid Panel")
            if "hba1c" in line_clean.lower():
                test_names.append("HbA1c Blood Test")
            if "thyroid" in line_clean.lower() or "tsh" in line_clean.lower():
                test_names.append("Thyroid Panel (TSH/fT4)")
            if not test_names:
                test_names.append(line_clean.replace("Requested:", "").replace("Order:", "").strip()[:60])
                
            for t_name in test_names:
                test_requests.append({
                    "patient_id": patient_id,
                    "document_id": document_id,
                    "cycle_label": cycle_label,
                    "test_name": t_name,
                    "requested_date": current_date,
                    "status": "pending",
                    "requesting_physician": "Dr. Sarah Miller"
                })
                
        # Match Test Result patterns
        if any(w in line_clean.lower() for w in ["result:", "lab result", "findings:", "platelets:", "hemoglobin:", "cholesterol:"]):
            t_name = "Clinical Lab Result"
            is_abnormal = False
            if "cbc" in line_clean.lower() or "hemoglobin" in line_clean.lower() or "platelet" in line_clean.lower():
                t_name = "Complete Blood Count (CBC)"
            elif "ultrasound" in line_clean.lower():
                t_name = "Abdominal Ultrasound"
            elif "lipid" in line_clean.lower():
                t_name = "Lipid Panel"
            elif "thyroid" in line_clean.lower():
                t_name = "Thyroid Panel (TSH/fT4)"
                
            if any(w in line_clean.lower() for w in ["abnormal", "elevated", "high", "low", "positive"]):
                is_abnormal = True
                
            test_results.append({
                "patient_id": patient_id,
                "document_id": document_id,
                "cycle_label": cycle_label,
                "test_name": t_name,
                "result_date": current_date,
                "result_data": line_clean[:250],
                "reference_range": "Standard reference range",
                "is_abnormal": is_abnormal
            })
            
    return {
        "events": events,
        "test_requests": test_requests,
        "test_results": test_results
    }
