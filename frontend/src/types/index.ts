export type Role = 'admin' | 'doctor' | 'reviewer' | 'auditor';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

export interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  gender: string;
  mrn: string;
  metadata_json?: string;
  created_at?: string;
  has_grant?: boolean;
  permissions?: string[];
}

export interface PatientBrief {
  patient: Patient;
  total_documents: number;
  total_events: number;
  pending_tests_count: number;
  unresolved_conflicts_count: number;
  active_cycles: string[];
  recent_events: ClinicalEvent[];
}

export interface ClinicalEvent {
  id: number;
  patient_id?: string;
  document_id?: string;
  cycle_label: string;
  event_type: string;
  event_date: string;
  description: string;
  source_page: number;
}

export interface ClinicalDocument {
  id: string;
  patient_id: string;
  filename: string;
  cycle_label: string;
  document_type: string;
  version: number;
  status: string;
  hash: string;
  uploaded_by: string;
  created_at: string;
  page_count: number;
  chunk_count: number;
}

export interface DocumentChunk {
  id: string;
  page_number: number;
  chunk_index: number;
  content: string;
}

export interface DocumentViewData {
  document_id: string;
  filename: string;
  document_type: string;
  cycle_label: string;
  version: number;
  created_at: string;
  chunks: DocumentChunk[];
}

export interface SourceCitation {
  document: string;
  page: number;
  excerpt: string;
  chunk_id?: string;
  relevance_score?: number;
}

export interface QuestionResponse {
  answer: string;
  sources: SourceCitation[];
  limitations: string[];
  patient_id: string;
  retrieval_mode: string;
  security_verified: boolean;
}

export interface ReconciliationItem {
  request_id: string;
  test_name: string;
  requested_date: string;
  status: 'Matched' | 'Recorded Pending' | 'Result not found' | 'Needs review';
  request_document?: string;
  request_doc_id?: string;
  result_id?: string;
  result_date?: string;
  result_data?: string;
  result_document?: string;
  result_doc_id?: string;
  reference_range?: string;
  is_abnormal?: boolean;
  evidence?: string;
  cycle_label: string;
}

export interface ReconciliationSummary {
  patient_id: string;
  total_requested: number;
  matched_count: number;
  pending_count: number;
  missing_count: number;
  needs_review_count: number;
  items: ReconciliationItem[];
}

export interface CycleComparisonRow {
  category: string;
  document_id?: string;
  cycle_1: {
    date: string;
    finding: string;
    status: string;
    document_id?: string;
  };
  cycle_2: {
    date: string;
    finding: string;
    status: string;
    document_id?: string;
  };
  change_state: string;
  clinical_significance: string;
}

export interface CycleComparisonData {
  patient_id: string;
  cycles_analyzed: string[];
  summary: {
    total_comparisons: number;
    changed_count: number;
    same_count: number;
    contradictions_count: number;
  };
  comparison_matrix: CycleComparisonRow[];
}

export interface ConflictItem {
  id: string;
  patient_id: string;
  cycle_label: string;
  conflict_type: string;
  fact_a: string;
  fact_b: string;
  source_a_doc: string;
  source_a_page: number;
  source_b_doc: string;
  source_b_page: number;
  status: 'Needs Review' | 'Resolved_A' | 'Resolved_B' | 'Dismissed';
  reviewed_by?: string;
  resolution_note?: string;
  created_at: string;
}

export interface AuditEventItem {
  id: number;
  user_id?: number;
  patient_id?: string;
  action: string;
  resource: string;
  timestamp: string;
  ip_address: string;
  metadata_json?: string;
  user_name?: string;
}

export interface ChangeTimelineItem {
  date: string;
  document_id: string;
  filename: string;
  version: number;
  cycle_label: string;
  type: string;
  summary: string;
}

export interface PatientChangesData {
  patient_id: string;
  total_documents_versioned: number;
  total_conflicts_tracked: number;
  recent_changes: ChangeTimelineItem[];
}
