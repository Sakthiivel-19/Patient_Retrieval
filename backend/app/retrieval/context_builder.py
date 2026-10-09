from typing import List, Dict, Any
from backend.app.security.prompt_guard import wrap_untrusted_context

class ContextBuilder:
    @staticmethod
    def build_authorized_rag_context(
        chunks: List[Dict[str, Any]],
        structured_facts: Dict[str, Any]
    ) -> str:
        """
        Builds minimal, bounded, authorized context for LLM execution.
        Wraps untrusted document snippets in security tags to prevent prompt injection.
        """
        sections = []
        
        # 1. Structured facts summary
        if structured_facts.get("test_requests"):
            req_list = "; ".join([f"{r['test_name']} on {r['requested_date']} (Status: {r['status']})" for r in structured_facts["test_requests"]])
            sections.append(f"[STRUCTURED_TEST_REQUESTS]: {req_list}")
            
        if structured_facts.get("test_results"):
            res_list = "; ".join([f"{r['test_name']} ({r['result_date']}): {r['result_data']}" for r in structured_facts["test_results"]])
            sections.append(f"[STRUCTURED_TEST_RESULTS]: {res_list}")
            
        if structured_facts.get("conflicts"):
            conf_list = "; ".join([f"{c['conflict_type']} -> Fact A: {c['fact_a']} vs Fact B: {c['fact_b']}" for c in structured_facts["conflicts"]])
            sections.append(f"[STRUCTURED_CONFLICTS]: {conf_list}")

        # 2. Bounded document chunks
        chunk_sections = []
        for ch in chunks:
            wrapped = wrap_untrusted_context(
                doc_text=ch["content"],
                doc_name=ch.get("document_name", "document.pdf"),
                page=ch.get("page_number", 1)
            )
            chunk_sections.append(wrapped)
            
        if chunk_sections:
            sections.append("\n".join(chunk_sections))
            
        return "\n\n".join(sections)
