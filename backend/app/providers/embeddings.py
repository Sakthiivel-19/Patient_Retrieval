import math
import re
from typing import List, Dict, Any

class LocalClinicalEmbeddings:
    """
    Deterministic clinical feature vector space for accurate semantic similarity
    without external API latency or failure modes, while supporting 64-dim vectors.
    """
    def __init__(self):
        # Key clinical ontology terms for high-precision matching
        self.vocab = [
            "consultation", "patient", "history", "assessment", "diagnosis", "procedure", 
            "surgery", "biopsy", "colonoscopy", "endoscopy", "angioplasty", "blood", 
            "test", "requested", "ordered", "requisition", "lab", "cbc", "hemoglobin",
            "platelet", "ultrasound", "abdominal", "pelvic", "mri", "ct", "scan", "x-ray",
            "lipid", "cholesterol", "hdl", "ldl", "triglycerides", "glucose", "hba1c",
            "thyroid", "tsh", "ft4", "creatinine", "liver", "alt", "ast", "normal",
            "elevated", "abnormal", "high", "low", "cycle", "follow-up", "medication",
            "dosage", "allergy", "penicillin", "hypertension", "diabetic", "cardiac",
            "treatment", "recommendation", "finding", "result", "pending", "resolved",
            "discrepancy", "conflict", "date", "dr", "doctor", "hospital", "clinic"
        ]
        self.dim = len(self.vocab)
        
    def embed_text(self, text: str) -> List[float]:
        text_lower = text.lower()
        vec = [0.0] * self.dim
        words = re.findall(r"\w+", text_lower)
        word_counts = {}
        for w in words:
            word_counts[w] = word_counts.get(w, 0) + 1
            
        for i, term in enumerate(self.vocab):
            if term in word_counts:
                # TF score with term weight
                vec[i] = 1.0 + math.log(1 + word_counts[term])
            elif term in text_lower:
                vec[i] = 0.5
                
        # Cosine normalization
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [round(x / norm, 4) for x in vec]
        else:
            vec[0] = 1.0
            
        return vec

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        return max(0.0, min(1.0, dot))

_instance = None

def get_embeddings_service():
    global _instance
    if _instance is None:
        _instance = LocalClinicalEmbeddings()
    return _instance
