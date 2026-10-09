import re
from typing import Tuple

SUSPICIOUS_INJECTION_PATTERNS = [
    r"(ignore|disregard|forget)\s+(all\s+)?(previous|above)\s+instructions",
    r"you\s+are\s+now\s+a",
    r"system\s+prompt",
    r"reveal\s+(the\s+)?(secret|password|key|other\s+patients|system\s+keys)",
    r"act\s+as\s+(dan|an\s+unfiltered|an\s+admin)",
    r"bypass\s+security",
    r"disregard\s+patient\s+boundaries",
    r"access\s+other\s+patient",
]

def scan_for_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Scans questions and document chunks for prompt injection attempts.
    Returns (is_malicious, detected_pattern_or_reason)
    """
    for pattern in SUSPICIOUS_INJECTION_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return True, f"Suspicious prompt pattern detected: '{match.group(0)}'"
    return False, ""

def wrap_untrusted_context(doc_text: str, doc_name: str, page: int) -> str:
    """
    Strict boundary demarcation for RAG context so LLM treats document content as pure data,
    never as instruction directives.
    """
    # Sanitize delimiters
    clean_text = doc_text.replace("```", "'''")
    return f"""<CLINICAL_DOCUMENT name="{doc_name}" page="{page}">
{clean_text}
</CLINICAL_DOCUMENT>"""
