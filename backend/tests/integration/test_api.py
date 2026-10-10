import pytest
import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_login_and_patient_flow():
    # 1. Login as Doctor A
    login_res = client.post("/api/v1/auth/login", json={
        "email": "doctor.sakthi@carelens.ai",
        "password": "password123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Authorized Patient P001 Brief
    brief_res = client.get("/api/v1/patients/P001/brief", headers=headers)
    assert brief_res.status_code == 200
    assert brief_res.json()["patient"]["id"] == "P001"
    
    # 3. Ask RAG Question
    q_res = client.post("/api/v1/patients/P001/questions", headers=headers, json={
        "question": "What tests were requested?"
    })
    assert q_res.status_code == 200
    assert "sources" in q_res.json()
    assert len(q_res.json()["sources"]) > 0
    
    # 4. Attempt Access to Unauthorized Patient P999 -> Expect 403 Forbidden
    deny_res = client.get("/api/v1/patients/P999/brief", headers=headers)
    assert deny_res.status_code == 403
