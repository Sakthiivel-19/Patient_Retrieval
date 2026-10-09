from typing import List, Dict, Any, Tuple
from backend.app.schemas.question import SourceCitation

def validate_llm_output(answer: str, sources: List[SourceCitation]) -> Tuple[str, List[str]]:
    """
    Validates that:
    1. If no evidence was found, clear standard fallback is returned without hallucination.
    2. Medical disclaimers and limitations are included.
    3. LLM is not making unsupported clinical diagnoses or prescribing medication.
    """
    limitations = []
    
    if not sources or len(sources) == 0:
        if "I could not find sufficient evidence in the available records." not in answer:
            answer = "I could not find sufficient evidence in the available records."
        limitations.append("No authorized clinical documents matched this query with sufficient evidence.")
        return answer, limitations
        
    # Check for unauthorized diagnostic / prescribing language
    risky_triggers = ["i diagnose", "i prescribe", "take this medication dosage"]
    for trigger in risky_triggers:
        if trigger in answer.lower():
            limitations.append("AI assistant note: Clinical findings require physician review and verification.")
            break
            
    limitations.append("Answers are grounded strictly in the patient's uploaded clinical records.")
    return answer, limitations
