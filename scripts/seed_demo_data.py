import os
import sys
import json
import uuid
from datetime import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import (
    init_db, SessionLocal, User, StaffProfile, Patient, PatientGrant,
    Document, Chunk, Event, TestRequest, TestResult, Conflict, AuditEvent
)
from backend.app.auth.authentication import hash_password
from backend.app.providers.embeddings import get_embeddings_service

def create_physical_doc(file_path: str, content: str):
    """Creates directory and writes text file so document viewing works."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

def seed_database():
    init_db()
    db = SessionLocal()
    
    # Clean existing data
    db.query(AuditEvent).delete()
    db.query(Conflict).delete()
    db.query(TestResult).delete()
    db.query(TestRequest).delete()
    db.query(Event).delete()
    db.query(Chunk).delete()
    db.query(Document).delete()
    db.query(PatientGrant).delete()
    db.query(Patient).delete()
    db.query(StaffProfile).delete()
    db.query(User).delete()
    db.commit()
    
    print("[*] Seeding Users and Staff Profiles...")
    
    # 1. Users
    u_sakthi = User(
        email="doctor.sakthi@carelens.ai",
        hashed_password=hash_password("password123"),
        full_name="Dr. Sakthi, MD",
        role="doctor",
        is_active=True
    )
    u_varun = User(
        email="doctor.varun@carelens.ai",
        hashed_password=hash_password("password123"),
        full_name="Dr. Varun, MD",
        role="doctor",
        is_active=True
    )
    u_rakshana = User(
        email="doctor.rakshana@carelens.ai",
        hashed_password=hash_password("password123"),
        full_name="Dr. Rakshana, MD",
        role="doctor",
        is_active=True
    )
    u_admin = User(
        email="admin@carelens.ai",
        hashed_password=hash_password("admin123"),
        full_name="System Administrator",
        role="admin",
        is_active=True
    )
    u_auditor = User(
        email="auditor@carelens.ai",
        hashed_password=hash_password("password123"),
        full_name="Compliance Auditor",
        role="auditor",
        is_active=True
    )
    db.add_all([u_sakthi, u_varun, u_rakshana, u_admin, u_auditor])
    db.commit()
    db.refresh(u_sakthi)
    db.refresh(u_varun)
    db.refresh(u_rakshana)
    db.refresh(u_admin)
    db.refresh(u_auditor)
    
    # Staff Profiles
    p1 = StaffProfile(user_id=u_sakthi.id, role="Attending Gastroenterologist", department="Gastroenterology", license_number="MD-SK-84920")
    p2 = StaffProfile(user_id=u_varun.id, role="Staff Physician", department="Internal Medicine", license_number="MD-VR-39011")
    p3 = StaffProfile(user_id=u_rakshana.id, role="Clinical Specialist", department="Gastroenterology & Surgery", license_number="MD-RK-55102")
    p4 = StaffProfile(user_id=u_admin.id, role="Security Administrator", department="IT Security", license_number="ADM-001")
    p5 = StaffProfile(user_id=u_auditor.id, role="Clinical Compliance Officer", department="Quality Assurance", license_number="AUD-204")
    db.add_all([p1, p2, p3, p4, p5])
    
    print("[*] Seeding Patients...")
    
    # 2. Patients
    pat1 = Patient(
        id="P001",
        name="Eleanor Vance",
        date_of_birth="1978-04-12",
        gender="Female",
        mrn="MRN-849201",
        metadata_json=json.dumps({
            "allergies": ["Penicillin", "Sulfa drugs"],
            "chronic_conditions": ["Gastroesophageal Reflux", "Mild Hypertension"],
            "blood_type": "A+",
            "emergency_contact": "David Vance (Spouse) - 555-0199"
        })
    )
    pat2 = Patient(
        id="P002",
        name="Marcus Aurelius Green",
        date_of_birth="1965-11-23",
        gender="Male",
        mrn="MRN-204912",
        metadata_json=json.dumps({
            "allergies": ["None known"],
            "chronic_conditions": ["Type 2 Diabetes", "Dyslipidemia"],
            "blood_type": "O+",
            "emergency_contact": "Sarah Green (Daughter) - 555-0248"
        })
    )
    pat3 = Patient(
        id="P999",
        name="Restricted Patient (VIP / Sealed)",
        date_of_birth="1990-01-01",
        gender="Female",
        mrn="MRN-999999",
        metadata_json=json.dumps({
            "allergies": ["Latex"],
            "chronic_conditions": ["VIP / Sealed Profile Guard Test", "Executive Health Surveillance"],
            "blood_type": "B-",
            "emergency_contact": "Confidential Security Dispatch - 555-0999"
        })
    )
    db.add_all([pat1, pat2, pat3])
    db.commit()
    
    print("[*] Setting up Patient Grants (RBAC)...")
    # Dr. Sakthi has active grant for P001 and P002
    g1 = PatientGrant(user_id=u_sakthi.id, patient_id="P001", permissions="read,write,query,reconcile", granted_by="admin@carelens.ai")
    g2 = PatientGrant(user_id=u_sakthi.id, patient_id="P002", permissions="read,write,query,reconcile", granted_by="admin@carelens.ai")
    
    # Dr. Varun has grant for P002 (P001 triggers 403)
    g3 = PatientGrant(user_id=u_varun.id, patient_id="P002", permissions="read,write,query,reconcile", granted_by="admin@carelens.ai")
    
    # Dr. Rakshana has grant for P001 and P999 (VIP)
    g4 = PatientGrant(user_id=u_rakshana.id, patient_id="P001", permissions="read,write,query,reconcile", granted_by="admin@carelens.ai")
    g5 = PatientGrant(user_id=u_rakshana.id, patient_id="P999", permissions="read,write,query,reconcile", granted_by="admin@carelens.ai")
    
    # Auditor has read grant for P001 and P002
    g6 = PatientGrant(user_id=u_auditor.id, patient_id="P001", permissions="read", granted_by="admin@carelens.ai")
    g7 = PatientGrant(user_id=u_auditor.id, patient_id="P002", permissions="read", granted_by="admin@carelens.ai")
    
    db.add_all([g1, g2, g3, g4, g5, g6, g7])
    db.commit()
    
    emb_service = get_embeddings_service()
    
    # =========================================================================
    # PATIENT P001: Eleanor Vance (Gastroenterology Demo)
    # =========================================================================
    print("[*] Seeding Documents, Chunks, Timeline & Tests for P001...")
    
    doc1_content = """CareLens Medical Center - Department of Gastroenterology
Patient: Eleanor Vance | DOB: 1978-04-12 | MRN: MRN-849201
Date of Consultation: 2026-01-10
Attending Physician: Dr. Sakthi, MD

Chief Complaint: Recurrent epigastric burning pain and postprandial nausea over 6 weeks.
Clinical Assessment: Suspected severe reflux esophagitis vs peptic ulcer disease.

Orders and Investigations Requested:
1. Complete Blood Count (CBC) with differential.
2. Abdominal Ultrasound to evaluate biliary tree and liver parenchyma.
3. Upper Gastrointestinal Endoscopy (EGD) procedure scheduled for 2026-01-10.

Medications Prescribed:
- Omeprazole 40mg PO daily before breakfast.
- Antacid suspension PRN for breakthrough symptoms."""

    p1_f1 = "./storage/documents/P001/DOC-P001-01_consultation_note_cycle1.pdf"
    create_physical_doc(p1_f1, doc1_content)
    doc1 = Document(
        id="DOC-P001-01",
        patient_id="P001",
        filename="consultation_note_cycle1.pdf",
        file_path=p1_f1,
        hash="hash_c1_consultation_01",
        version=1,
        status="processed",
        uploaded_by="Dr. Sakthi, MD",
        cycle_label="Cycle 1",
        document_type="Consultation Note",
        created_at=datetime(2026, 1, 10, 10, 30)
    )
    db.add(doc1)
    ch1 = Chunk(
        id="chk_P001_01_p1_0",
        document_id="DOC-P001-01",
        patient_id="P001",
        page_number=1,
        chunk_index=0,
        content=doc1_content,
        embedding_json=json.dumps(emb_service.embed_text(doc1_content)),
        metadata_json=json.dumps({"document_name": "consultation_note_cycle1.pdf", "cycle": "Cycle 1"})
    )
    db.add(ch1)
    
    doc2_content = """CareLens Diagnostic Laboratories & Imaging
Patient: Eleanor Vance | MRN: MRN-849201
Date of Specimen / Study: 2026-01-12
Ordering Provider: Dr. Sakthi, MD

DIAGNOSTIC TEST RESULTS:
1. Complete Blood Count (CBC):
   - Hemoglobin: 13.8 g/dL (Reference: 12.0 - 15.5 g/dL) [Normal]
   - Hematocrit: 41.2% (Reference: 37.0 - 48.0%) [Normal]
   - White Blood Cell (WBC): 6.8 x10^3/mcL (Reference: 4.5 - 11.0) [Normal]
   - Platelet Count: 240,000 /mcL (Reference: 150,000 - 450,000) [Normal]

2. Abdominal Ultrasound:
   - Liver: Mild diffuse echogenicity consistent with mild hepatic steatosis. No focal hepatic lesions or mass.
   - Gallbladder: Normal wall thickness, no gallstones or sludge. Biliary ducts non-dilated."""

    p1_f2 = "./storage/documents/P001/DOC-P001-02_lab_ultrasound_results_cycle1.pdf"
    create_physical_doc(p1_f2, doc2_content)
    doc2 = Document(
        id="DOC-P001-02",
        patient_id="P001",
        filename="lab_ultrasound_results_cycle1.pdf",
        file_path=p1_f2,
        hash="hash_c1_lab_02",
        version=1,
        status="processed",
        uploaded_by="Dr. Sakthi, MD",
        cycle_label="Cycle 1",
        document_type="Lab & Diagnostic Report",
        created_at=datetime(2026, 1, 12, 14, 15)
    )
    db.add(doc2)
    ch2 = Chunk(
        id="chk_P001_02_p1_0",
        document_id="DOC-P001-02",
        patient_id="P001",
        page_number=1,
        chunk_index=0,
        content=doc2_content,
        embedding_json=json.dumps(emb_service.embed_text(doc2_content)),
        metadata_json=json.dumps({"document_name": "lab_ultrasound_results_cycle1.pdf", "cycle": "Cycle 1"})
    )
    db.add(ch2)

    doc3_content = """CareLens Surgical Pavilion - Endoscopy Suite & Follow-up Note
Patient: Eleanor Vance | DOB: 1978-04-12 | MRN: MRN-849201
Date of Document: 2026-02-15
Attending Gastroenterologist: Dr. Sakthi, MD

PROCEDURE REPORT & TIMELINE NOTE:
- Procedure: Upper Gastrointestinal Endoscopy (EGD) with Antral Mucosal Biopsy.
- Documented Procedure Date: 2026-01-15 (Note: Prior intake form recorded 2026-01-10).
- Findings: Grade A reflux esophagitis at distal esophagus. Mild non-erosive antral gastritis. Biopsies taken for H. pylori urease testing.

CYCLE 2 FOLLOW-UP ORDERS:
1. Repeat Complete Blood Count (CBC) with Serum Ferritin to monitor iron stores.
2. Helicobacter pylori Stool Antigen Test ordered (Unmatched / Lab Pending).
3. Continue Omeprazole 40mg daily for 8 weeks."""

    p1_f3 = "./storage/documents/P001/DOC-P001-03_operative_endoscopy_cycle2.pdf"
    create_physical_doc(p1_f3, doc3_content)
    doc3 = Document(
        id="DOC-P001-03",
        patient_id="P001",
        filename="operative_endoscopy_cycle2.pdf",
        file_path=p1_f3,
        hash="hash_c2_op_03",
        version=1,
        status="processed",
        uploaded_by="Dr. Sakthi, MD",
        cycle_label="Cycle 2",
        document_type="Procedure & Follow-up Note",
        created_at=datetime(2026, 2, 15, 11, 0)
    )
    db.add(doc3)
    ch3 = Chunk(
        id="chk_P001_03_p1_0",
        document_id="DOC-P001-03",
        patient_id="P001",
        page_number=1,
        chunk_index=0,
        content=doc3_content,
        embedding_json=json.dumps(emb_service.embed_text(doc3_content)),
        metadata_json=json.dumps({"document_name": "operative_endoscopy_cycle2.pdf", "cycle": "Cycle 2"})
    )
    db.add(ch3)
    
    # Events P001
    ev1 = Event(patient_id="P001", document_id="DOC-P001-01", cycle_label="Cycle 1", event_type="Consultation", event_date="2026-01-10", description="Initial gastroenterology consultation for recurrent epigastric pain.", source_page=1)
    ev2 = Event(patient_id="P001", document_id="DOC-P001-01", cycle_label="Cycle 1", event_type="Test Requested", event_date="2026-01-10", description="Complete Blood Count (CBC) and Abdominal Ultrasound requested.", source_page=1)
    ev3 = Event(patient_id="P001", document_id="DOC-P001-02", cycle_label="Cycle 1", event_type="Lab Result", event_date="2026-01-12", description="CBC (Hb 13.8, Plt 240k) & Ultrasound (mild steatosis, no gallstones).", source_page=1)
    ev4 = Event(patient_id="P001", document_id="DOC-P001-03", cycle_label="Cycle 2", event_type="Procedure", event_date="2026-01-15", description="Upper Gastrointestinal Endoscopy performed with antral biopsies.", source_page=1)
    ev5 = Event(patient_id="P001", document_id="DOC-P001-03", cycle_label="Cycle 2", event_type="Follow-up", event_date="2026-02-15", description="Cycle 2 follow-up consultation; symptom improvement noted with Omeprazole.", source_page=1)
    db.add_all([ev1, ev2, ev3, ev4, ev5])
    
    # Tests P001
    tr1 = TestRequest(id="REQ-P001-01", patient_id="P001", document_id="DOC-P001-01", cycle_label="Cycle 1", test_name="Complete Blood Count (CBC)", requested_date="2026-01-10", status="matched", requesting_physician="Dr. Sakthi, MD")
    tr2 = TestRequest(id="REQ-P001-02", patient_id="P001", document_id="DOC-P001-01", cycle_label="Cycle 1", test_name="Abdominal Ultrasound", requested_date="2026-01-10", status="matched", requesting_physician="Dr. Sakthi, MD")
    tr3 = TestRequest(id="REQ-P001-03", patient_id="P001", document_id="DOC-P001-03", cycle_label="Cycle 2", test_name="Helicobacter pylori Stool Antigen Test", requested_date="2026-02-15", status="result_not_found", requesting_physician="Dr. Sakthi, MD")
    tr4 = TestRequest(id="REQ-P001-04", patient_id="P001", document_id="DOC-P001-03", cycle_label="Cycle 2", test_name="Serum Ferritin", requested_date="2026-02-15", status="recorded_pending", requesting_physician="Dr. Sakthi, MD")
    db.add_all([tr1, tr2, tr3, tr4])
    
    res1 = TestResult(id="RES-P001-01", patient_id="P001", document_id="DOC-P001-02", cycle_label="Cycle 1", test_name="Complete Blood Count (CBC)", result_date="2026-01-12", result_data="Hemoglobin: 13.8 g/dL, Platelets: 240,000/mcL, WBC: 6.8 x10^3/mcL", reference_range="Normal limits", is_abnormal=False)
    res2 = TestResult(id="RES-P001-02", patient_id="P001", document_id="DOC-P001-02", cycle_label="Cycle 1", test_name="Abdominal Ultrasound", result_date="2026-01-12", result_data="Mild diffuse hepatic steatosis, normal gallbladder wall, non-dilated ducts", reference_range="N/A", is_abnormal=False)
    db.add_all([res1, res2])
    
    conf1 = Conflict(
        id="CONF-P001-01",
        patient_id="P001",
        cycle_label="Cycle 2",
        conflict_type="Procedure Date Discrepancy",
        fact_a="Procedure scheduled/recorded as 2026-01-10 in intake consultation note",
        fact_b="Procedure documented as performed on 2026-01-15 in operative endoscopy suite record",
        source_a_doc="consultation_note_cycle1.pdf",
        source_a_page=1,
        source_b_doc="operative_endoscopy_cycle2.pdf",
        source_b_page=1,
        status="Needs Review",
        reviewed_by=None,
        resolution_note=None,
        created_at=datetime(2026, 2, 15, 11, 30)
    )
    db.add(conf1)
    
    # =========================================================================
    # PATIENT P002: Marcus Aurelius Green (Internal Medicine & Diabetes Demo)
    # =========================================================================
    print("[*] Seeding Documents, Chunks, Timeline & Tests for P002...")
    
    doc_p2_1_content = """CareLens Medical Center - Department of Internal Medicine
Patient: Marcus Aurelius Green | DOB: 1965-11-23 | MRN: MRN-204912
Date of Consultation: 2026-01-14
Attending Physician: Dr. Varun, MD

Chief Complaint: Quarterly Type 2 Diabetes checkup and diabetic nephropathy risk evaluation.
History of Present Illness: Patient reports mild bilateral lower extremity paresthesia (pins-and-needles sensation in toes) over the past 2 months. Denies chest pain or shortness of breath.

Current Medications:
- Metformin 1000mg PO BID with meals.
- Atorvastatin 20mg PO QHS.
- Lisinopril 10mg PO daily for renal microvascular protection.

Orders & Diagnostic Requests (Cycle 1):
1. Glycated Hemoglobin (HbA1c) to evaluate 90-day glycemic control.
2. Urine Albumin-to-Creatinine Ratio (uACR) to screen for diabetic kidney disease.
3. Fasting Comprehensive Metabolic Panel (CMP) & Lipid Profile."""

    p2_f1 = "./storage/documents/P002/DOC-P002-01_diabetes_consultation_cycle1.pdf"
    create_physical_doc(p2_f1, doc_p2_1_content)
    doc_p2_1 = Document(
        id="DOC-P002-01",
        patient_id="P002",
        filename="diabetes_consultation_cycle1.pdf",
        file_path=p2_f1,
        hash="hash_p2_c1_consult_01",
        version=1,
        status="processed",
        uploaded_by="Dr. Varun, MD",
        cycle_label="Cycle 1",
        document_type="Consultation Note",
        created_at=datetime(2026, 1, 14, 9, 15)
    )
    db.add(doc_p2_1)
    ch_p2_1 = Chunk(
        id="chk_P002_01_p1_0",
        document_id="DOC-P002-01",
        patient_id="P002",
        page_number=1,
        chunk_index=0,
        content=doc_p2_1_content,
        embedding_json=json.dumps(emb_service.embed_text(doc_p2_1_content)),
        metadata_json=json.dumps({"document_name": "diabetes_consultation_cycle1.pdf", "cycle": "Cycle 1"})
    )
    db.add(ch_p2_1)

    doc_p2_2_content = """CareLens Diagnostic Laboratories - Clinical Chemistry & Urinalysis
Patient: Marcus Aurelius Green | MRN: MRN-204912
Date of Specimen: 2026-01-16
Ordering Physician: Dr. Varun, MD

DIAGNOSTIC TEST RESULTS:
1. Glycated Hemoglobin (HbA1c):
   - Result: 7.8% (Target < 7.0%) [Elevated - Suboptimal Glycemic Control]

2. Urine Albumin-to-Creatinine Ratio (uACR):
   - Result: 42.0 mg/g (Reference < 30.0 mg/g) [Elevated - Microalbuminuria Detected]

3. Fasting Lipid Profile:
   - Total Cholesterol: 210 mg/dL (Reference < 200 mg/dL) [Borderline High]
   - LDL Cholesterol: 128 mg/dL (Target < 100 mg/dL for diabetic patients) [Elevated]
   - HDL Cholesterol: 42 mg/dL (Reference > 40 mg/dL) [Normal]
   - Triglycerides: 185 mg/dL (Reference < 150 mg/dL) [Elevated]

4. Comprehensive Metabolic Panel (CMP):
   - Fasting Glucose: 154 mg/dL [Elevated]
   - Serum Creatinine: 1.1 mg/dL (Reference: 0.7 - 1.3 mg/dL) [Normal]
   - eGFR: 78 mL/min/1.73m2 (Consistent with mild renal impairment / early diabetic nephropathy)"""

    p2_f2 = "./storage/documents/P002/DOC-P002-02_comprehensive_lab_panel_cycle1.pdf"
    create_physical_doc(p2_f2, doc_p2_2_content)
    doc_p2_2 = Document(
        id="DOC-P002-02",
        patient_id="P002",
        filename="comprehensive_lab_panel_cycle1.pdf",
        file_path=p2_f2,
        hash="hash_p2_c1_lab_02",
        version=1,
        status="processed",
        uploaded_by="Dr. Varun, MD",
        cycle_label="Cycle 1",
        document_type="Lab & Diagnostic Report",
        created_at=datetime(2026, 1, 16, 15, 45)
    )
    db.add(doc_p2_2)
    ch_p2_2 = Chunk(
        id="chk_P002_02_p1_0",
        document_id="DOC-P002-02",
        patient_id="P002",
        page_number=1,
        chunk_index=0,
        content=doc_p2_2_content,
        embedding_json=json.dumps(emb_service.embed_text(doc_p2_2_content)),
        metadata_json=json.dumps({"document_name": "comprehensive_lab_panel_cycle1.pdf", "cycle": "Cycle 1"})
    )
    db.add(ch_p2_2)

    doc_p2_3_content = """CareLens Medical Center - Endocrinology & Renal Management Follow-up
Patient: Marcus Aurelius Green | DOB: 1965-11-23 | MRN: MRN-204912
Date of Document: 2026-02-18
Attending Physician: Dr. Varun, MD

CYCLE 2 CLINICAL REASSESSMENT:
- Glycemic Assessment: HbA1c remains elevated at 7.8% despite Metformin adherence.
- Renal Microvascular Status: Microalbuminuria confirmed with uACR of 42 mg/g.
- Medication Optimization:
  1. Add Empagliflozin (Jardiance) 10mg PO daily for proven cardiorenal risk reduction.
  2. Increase Atorvastatin from 20mg to 40mg PO QHS to target LDL < 70 mg/dL.
  3. Continue Lisinopril 10mg PO daily.
- Note on Intake Form: Early clinic intake note incorrectly listed Metformin 500mg daily instead of the active 1000mg BID regimen.

CYCLE 2 INVESTIGATION ORDERS:
1. Dilated Diabetic Retinopathy Ophthalmologic Screening.
2. Repeat Glycated Hemoglobin (HbA1c) in 12 weeks.
3. 24-Hour Ambulatory Blood Pressure Monitoring (ABPM)."""

    p2_f3 = "./storage/documents/P002/DOC-P002-03_nephrology_endocrine_followup_cycle2.pdf"
    create_physical_doc(p2_f3, doc_p2_3_content)
    doc_p2_3 = Document(
        id="DOC-P002-03",
        patient_id="P002",
        filename="nephrology_endocrine_followup_cycle2.pdf",
        file_path=p2_f3,
        hash="hash_p2_c2_followup_03",
        version=1,
        status="processed",
        uploaded_by="Dr. Varun, MD",
        cycle_label="Cycle 2",
        document_type="Follow-up Clinical Note",
        created_at=datetime(2026, 2, 18, 11, 30)
    )
    db.add(doc_p2_3)
    ch_p2_3 = Chunk(
        id="chk_P002_03_p1_0",
        document_id="DOC-P002-03",
        patient_id="P002",
        page_number=1,
        chunk_index=0,
        content=doc_p2_3_content,
        embedding_json=json.dumps(emb_service.embed_text(doc_p2_3_content)),
        metadata_json=json.dumps({"document_name": "nephrology_endocrine_followup_cycle2.pdf", "cycle": "Cycle 2"})
    )
    db.add(ch_p2_3)

    # Events P002
    p2_ev1 = Event(patient_id="P002", document_id="DOC-P002-01", cycle_label="Cycle 1", event_type="Consultation", event_date="2026-01-14", description="Comprehensive diabetes quarterly evaluation and neuropathy risk review by Dr. Varun.", source_page=1)
    p2_ev2 = Event(patient_id="P002", document_id="DOC-P002-01", cycle_label="Cycle 1", event_type="Test Requested", event_date="2026-01-14", description="HbA1c, Urine Albumin-to-Creatinine Ratio (uACR), and Fasting Lipid Profile requested.", source_page=1)
    p2_ev3 = Event(patient_id="P002", document_id="DOC-P002-02", cycle_label="Cycle 1", event_type="Lab Result", event_date="2026-01-16", description="HbA1c 7.8% (elevated), uACR 42 mg/g (microalbuminuria), LDL 128 mg/dL.", source_page=1)
    p2_ev4 = Event(patient_id="P002", document_id="DOC-P002-03", cycle_label="Cycle 2", event_type="Follow-up", event_date="2026-02-18", description="Endocrine follow-up; Empagliflozin 10mg initiated for cardiorenal protection; Atorvastatin titrated to 40mg.", source_page=1)
    p2_ev5 = Event(patient_id="P002", document_id="DOC-P002-03", cycle_label="Cycle 2", event_type="Test Requested", event_date="2026-02-18", description="Diabetic Retinopathy Eye Exam & 24-Hour Ambulatory Blood Pressure Monitoring requested.", source_page=1)
    db.add_all([p2_ev1, p2_ev2, p2_ev3, p2_ev4, p2_ev5])

    # Test Requests P002
    p2_tr1 = TestRequest(id="REQ-P002-01", patient_id="P002", document_id="DOC-P002-01", cycle_label="Cycle 1", test_name="Glycated Hemoglobin (HbA1c)", requested_date="2026-01-14", status="matched", requesting_physician="Dr. Varun, MD")
    p2_tr2 = TestRequest(id="REQ-P002-02", patient_id="P002", document_id="DOC-P002-01", cycle_label="Cycle 1", test_name="Urine Albumin-to-Creatinine Ratio (uACR)", requested_date="2026-01-14", status="matched", requesting_physician="Dr. Varun, MD")
    p2_tr3 = TestRequest(id="REQ-P002-03", patient_id="P002", document_id="DOC-P002-01", cycle_label="Cycle 1", test_name="Fasting Lipid Profile", requested_date="2026-01-14", status="matched", requesting_physician="Dr. Varun, MD")
    p2_tr4 = TestRequest(id="REQ-P002-04", patient_id="P002", document_id="DOC-P002-03", cycle_label="Cycle 2", test_name="Diabetic Retinopathy Eye Exam", requested_date="2026-02-18", status="recorded_pending", requesting_physician="Dr. Varun, MD")
    db.add_all([p2_tr1, p2_tr2, p2_tr3, p2_tr4])

    # Test Results P002
    p2_res1 = TestResult(id="RES-P002-01", patient_id="P002", document_id="DOC-P002-02", cycle_label="Cycle 1", test_name="Glycated Hemoglobin (HbA1c)", result_date="2026-01-16", result_data="HbA1c: 7.8% (Target < 7.0%), Fasting Glucose: 154 mg/dL", reference_range="4.0 - 5.6% (Non-diabetic)", is_abnormal=True)
    p2_res2 = TestResult(id="RES-P002-02", patient_id="P002", document_id="DOC-P002-02", cycle_label="Cycle 1", test_name="Urine Albumin-to-Creatinine Ratio (uACR)", result_date="2026-01-16", result_data="uACR: 42.0 mg/g (Microalbuminuria range 30-300 mg/g)", reference_range="< 30.0 mg/g", is_abnormal=True)
    p2_res3 = TestResult(id="RES-P002-03", patient_id="P002", document_id="DOC-P002-02", cycle_label="Cycle 1", test_name="Fasting Lipid Profile", result_date="2026-01-16", result_data="Total: 210 mg/dL, LDL: 128 mg/dL, HDL: 42 mg/dL, Triglycerides: 185 mg/dL", reference_range="LDL < 100 mg/dL", is_abnormal=True)
    db.add_all([p2_res1, p2_res2, p2_res3])

    # Conflict P002
    p2_conf1 = Conflict(
        id="CONF-P002-01",
        patient_id="P002",
        cycle_label="Cycle 2",
        conflict_type="Medication Dosage Discrepancy",
        fact_a="Metformin prescribed as 500mg daily in clinic intake record",
        fact_b="Metformin confirmed as 1000mg BID in clinical chemistry consultation & pharmacy dispensing log",
        source_a_doc="diabetes_consultation_cycle1.pdf",
        source_a_page=1,
        source_b_doc="nephrology_endocrine_followup_cycle2.pdf",
        source_b_page=1,
        status="Needs Review",
        reviewed_by=None,
        resolution_note=None,
        created_at=datetime(2026, 2, 18, 12, 0)
    )
    db.add(p2_conf1)

    # =========================================================================
    # PATIENT P999: Restricted Patient (VIP / Security Demo)
    # =========================================================================
    print("[*] Seeding Documents, Chunks, Timeline & Tests for P999...")
    
    doc_p9_1_content = """CareLens Executive Medical Pavilion - Confidential VIP Suite
Patient: Restricted Patient (VIP) | DOB: 1990-01-01 | MRN: MRN-999999
Date of Consultation: 2026-01-20
Attending Specialist: Dr. Rakshana, MD

Chief Complaint: Annual Executive VIP Health Assessment & Comprehensive Biomarker Screening.
Clinical Assessment: Healthy 36-year-old executive undergoing proactive preventive health evaluation.
Orders Requested:
1. High-Sensitivity Cardiac Troponin I & hs-CRP.
2. Full Body Diagnostic MRI Scan.
3. Whole Exome Preventative Genomic Health Panel."""

    p9_f1 = "./storage/documents/P999/DOC-P999-01_executive_vip_intake_cycle1.pdf"
    create_physical_doc(p9_f1, doc_p9_1_content)
    doc_p9_1 = Document(
        id="DOC-P999-01",
        patient_id="P999",
        filename="executive_vip_intake_cycle1.pdf",
        file_path=p9_f1,
        hash="hash_p9_c1_intake_01",
        version=1,
        status="processed",
        uploaded_by="Dr. Rakshana, MD",
        cycle_label="Cycle 1",
        document_type="VIP Consultation Note",
        created_at=datetime(2026, 1, 20, 10, 0)
    )
    db.add(doc_p9_1)
    ch_p9_1 = Chunk(
        id="chk_P999_01_p1_0",
        document_id="DOC-P999-01",
        patient_id="P999",
        page_number=1,
        chunk_index=0,
        content=doc_p9_1_content,
        embedding_json=json.dumps(emb_service.embed_text(doc_p9_1_content)),
        metadata_json=json.dumps({"document_name": "executive_vip_intake_cycle1.pdf", "cycle": "Cycle 1"})
    )
    db.add(ch_p9_1)

    doc_p9_2_content = """CareLens Advanced Molecular & Biomarker Diagnostics
Patient: Restricted Patient (VIP) | MRN: MRN-999999
Date of Report: 2026-01-22
Ordering Specialist: Dr. Rakshana, MD

DIAGNOSTIC TEST RESULTS:
1. High-Sensitivity C-Reactive Protein (hs-CRP):
   - Result: 0.6 mg/L (Reference < 1.0 mg/L) [Optimal / Low Cardiovascular Risk]

2. High-Sensitivity Cardiac Troponin I:
   - Result: < 1.5 ng/L (Reference < 14 ng/L) [Normal]

3. Preventative Genomic Health Panel:
   - Result: Negative for pathogenic variants in 147 cardiovascular and oncology risk genes."""

    p9_f2 = "./storage/documents/P999/DOC-P999-02_genomic_cardiac_biomarkers_cycle1.pdf"
    create_physical_doc(p9_f2, doc_p9_2_content)
    doc_p9_2 = Document(
        id="DOC-P999-02",
        patient_id="P999",
        filename="genomic_cardiac_biomarkers_cycle1.pdf",
        file_path=p9_f2,
        hash="hash_p9_c1_lab_02",
        version=1,
        status="processed",
        uploaded_by="Dr. Rakshana, MD",
        cycle_label="Cycle 1",
        document_type="VIP Diagnostic Report",
        created_at=datetime(2026, 1, 22, 16, 0)
    )
    db.add(doc_p9_2)
    ch_p9_2 = Chunk(
        id="chk_P999_02_p1_0",
        document_id="DOC-P999-02",
        patient_id="P999",
        page_number=1,
        chunk_index=0,
        content=doc_p9_2_content,
        embedding_json=json.dumps(emb_service.embed_text(doc_p9_2_content)),
        metadata_json=json.dumps({"document_name": "genomic_cardiac_biomarkers_cycle1.pdf", "cycle": "Cycle 1"})
    )
    db.add(ch_p9_2)

    # Events P999
    p9_ev1 = Event(patient_id="P999", document_id="DOC-P999-01", cycle_label="Cycle 1", event_type="VIP Consultation", event_date="2026-01-20", description="Annual executive health VIP consultation with comprehensive health screening conducted by Dr. Rakshana.", source_page=1)
    p9_ev2 = Event(patient_id="P999", document_id="DOC-P999-01", cycle_label="Cycle 1", event_type="Test Requested", event_date="2026-01-20", description="Cardiac Biomarkers (hs-CRP, Troponin I) and Preventive Genomic Health Panel requested.", source_page=1)
    p9_ev3 = Event(patient_id="P999", document_id="DOC-P999-02", cycle_label="Cycle 1", event_type="Lab Result", event_date="2026-01-22", description="hs-CRP: 0.6 mg/L (optimal), Troponin <1.5 ng/L, Genomic Panel: Negative for pathogenic variants.", source_page=1)
    db.add_all([p9_ev1, p9_ev2, p9_ev3])

    # Test Requests & Results P999
    p9_tr1 = TestRequest(id="REQ-P999-01", patient_id="P999", document_id="DOC-P999-01", cycle_label="Cycle 1", test_name="High-Sensitivity Cardiac Biomarkers (hs-CRP)", requested_date="2026-01-20", status="matched", requesting_physician="Dr. Rakshana, MD")
    p9_tr2 = TestRequest(id="REQ-P999-02", patient_id="P999", document_id="DOC-P999-01", cycle_label="Cycle 1", test_name="Preventative Genomic Health Panel", requested_date="2026-01-20", status="matched", requesting_physician="Dr. Rakshana, MD")
    db.add_all([p9_tr1, p9_tr2])

    p9_res1 = TestResult(id="RES-P999-01", patient_id="P999", document_id="DOC-P999-02", cycle_label="Cycle 1", test_name="High-Sensitivity Cardiac Biomarkers (hs-CRP)", result_date="2026-01-22", result_data="hs-CRP: 0.6 mg/L (Low cardiovascular risk)", reference_range="< 1.0 mg/L", is_abnormal=False)
    p9_res2 = TestResult(id="RES-P999-02", patient_id="P999", document_id="DOC-P999-02", cycle_label="Cycle 1", test_name="Preventative Genomic Health Panel", result_date="2026-01-22", result_data="Negative for actionable pathogenic mutations across 147 genes", reference_range="Negative", is_abnormal=False)
    db.add_all([p9_res1, p9_res2])

    # =========================================================================
    # AUDIT TRAIL / CLINICAL ACTIVITY FEED
    # =========================================================================
    print("[*] Seeding Clinical Activity Audit Logs...")
    
    aud1 = AuditEvent(
        user_id=u_sakthi.id,
        patient_id="P001",
        action="AUTH_LOGIN",
        resource="/auth/login",
        timestamp=datetime(2026, 2, 15, 8, 30),
        metadata_json=json.dumps({"ip": "192.168.1.10", "doctor": "Dr. Sakthi", "role": "doctor"})
    )
    aud2 = AuditEvent(
        user_id=u_sakthi.id,
        patient_id="P001",
        action="PATIENT_RECORD_VIEW",
        resource="/patients/P001",
        timestamp=datetime(2026, 2, 15, 8, 35),
        metadata_json=json.dumps({"patient_name": "Eleanor Vance", "scope": "Longitudinal Timeline"})
    )
    aud3 = AuditEvent(
        user_id=u_sakthi.id,
        patient_id="P001",
        action="RAG_QUESTION",
        resource="/patients/P001/questions",
        timestamp=datetime(2026, 2, 15, 8, 42),
        metadata_json=json.dumps({"query": "What were the diagnostic results of the abdominal ultrasound?", "citations_count": 1})
    )
    aud4 = AuditEvent(
        user_id=u_varun.id,
        patient_id="P001",
        action="ACCESS_DENIED_403",
        resource="/patients/P001",
        timestamp=datetime(2026, 2, 15, 9, 15),
        metadata_json=json.dumps({"reason": "No active patient grant for P001", "doctor": "Dr. Varun", "attempted_action": "workspace_load"})
    )
    aud5 = AuditEvent(
        user_id=u_varun.id,
        patient_id="P002",
        action="PATIENT_RECORD_VIEW",
        resource="/patients/P002",
        timestamp=datetime(2026, 2, 15, 9, 20),
        metadata_json=json.dumps({"patient_name": "Marcus Aurelius Green", "scope": "Authorized Patient Chart"})
    )
    aud6 = AuditEvent(
        user_id=u_varun.id,
        patient_id="P002",
        action="RAG_QUESTION",
        resource="/patients/P002/questions",
        timestamp=datetime(2026, 2, 15, 9, 25),
        metadata_json=json.dumps({"query": "What is the latest HbA1c and uACR result for Marcus Aurelius Green?", "citations_count": 2})
    )
    aud7 = AuditEvent(
        user_id=u_rakshana.id,
        patient_id="P001",
        action="CONFLICT_RESOLVED",
        resource="/patients/P001/conflicts/CONF-P001-01",
        timestamp=datetime(2026, 2, 15, 10, 5),
        metadata_json=json.dumps({"conflict_type": "Procedure Date Discrepancy", "chosen_resolution": "2026-01-15 (Operative Record)"})
    )
    aud8 = AuditEvent(
        user_id=u_rakshana.id,
        patient_id="P999",
        action="VIP_ACCESS_GRANTED",
        resource="/patients/P999",
        timestamp=datetime(2026, 2, 15, 10, 30),
        metadata_json=json.dumps({"patient_name": "Restricted Patient (VIP)", "specialist": "Dr. Rakshana"})
    )
    
    db.add_all([aud1, aud2, aud3, aud4, aud5, aud6, aud7, aud8])
    
    db.commit()
    db.close()
    print("[OK] CareLens AI Demo Database Successfully Seeded for P001, P002, and P999!")

if __name__ == "__main__":
    seed_database()
