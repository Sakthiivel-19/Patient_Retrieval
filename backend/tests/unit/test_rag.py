import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.providers.embeddings import LocalClinicalEmbeddings
from backend.app.ingestion.chunking import create_page_aware_chunks
from backend.app.ingestion.facts import extract_candidate_facts_from_text

def test_embeddings_cosine_similarity():
    emb = LocalClinicalEmbeddings()
    v1 = emb.embed_text("Complete Blood Count (CBC) with platelets")
    v2 = emb.embed_text("Blood test CBC results normal")
    v3 = emb.embed_text("Orthopedic fracture of the femur")
    
    sim_related = emb.cosine_similarity(v1, v2)
    sim_unrelated = emb.cosine_similarity(v1, v3)
    
    assert sim_related > sim_unrelated
    assert sim_related > 0.3

def test_page_aware_chunking_provenance():
    pages = [
        {"page_number": 1, "text": "Consultation note paragraph 1\n\nConsultation note paragraph 2"},
        {"page_number": 2, "text": "Operative report details"}
    ]
    chunks = create_page_aware_chunks(pages, "P001", "DOC-01", "report.pdf", chunk_size=100)
    
    assert len(chunks) >= 2
    assert chunks[0]["patient_id"] == "P001"
    assert chunks[0]["page_number"] == 1
    assert "page_number" in chunks[-1]

def test_candidate_fact_extraction():
    sample_text = """Assessment date: 2026-01-10
Consultation for gastric discomfort.
Orders: Complete Blood Count (CBC) and Abdominal Ultrasound requested.
Procedure performed on 2026-01-10: Endoscopy."""
    
    facts = extract_candidate_facts_from_text(sample_text, "DOC-01", "P001")
    assert len(facts["events"]) >= 1
    assert len(facts["test_requests"]) >= 2
