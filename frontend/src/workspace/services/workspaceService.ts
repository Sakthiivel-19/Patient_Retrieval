import { apiRequest } from '../../api/client';
import {
  ClinicalEvent,
  ClinicalDocument,
  DocumentViewData,
  QuestionResponse,
  ReconciliationSummary,
  CycleComparisonData,
  ConflictItem,
  AuditEventItem,
  PatientChangesData
} from '../../types';

export const workspaceService = {
  getTimeline: async (patientId: string): Promise<ClinicalEvent[]> => {
    return apiRequest<ClinicalEvent[]>(`/patients/${patientId}/timeline`);
  },

  getDocuments: async (patientId: string): Promise<ClinicalDocument[]> => {
    return apiRequest<ClinicalDocument[]>(`/patients/${patientId}/documents`);
  },

  getDocumentView: async (patientId: string, docId: string): Promise<DocumentViewData> => {
    return apiRequest<DocumentViewData>(`/patients/${patientId}/documents/${docId}/view`);
  },

  askQuestion: async (patientId: string, question: string): Promise<QuestionResponse> => {
    return apiRequest<QuestionResponse>(`/patients/${patientId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },

  getReconciliation: async (patientId: string): Promise<ReconciliationSummary> => {
    return apiRequest<ReconciliationSummary>(`/patients/${patientId}/reconciliation`);
  },

  getCycleComparison: async (patientId: string): Promise<CycleComparisonData> => {
    return apiRequest<CycleComparisonData>(`/patients/${patientId}/cycles/compare`);
  },

  getConflicts: async (patientId: string): Promise<ConflictItem[]> => {
    return apiRequest<ConflictItem[]>(`/patients/${patientId}/conflicts`);
  },

  reviewConflict: async (
    patientId: string,
    conflictId: string,
    status: string,
    resolutionNote: string
  ): Promise<ConflictItem> => {
    return apiRequest<ConflictItem>(`/patients/${patientId}/conflicts/${conflictId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ status, resolution_note: resolutionNote }),
    });
  },

  getChanges: async (patientId: string): Promise<PatientChangesData> => {
    return apiRequest<PatientChangesData>(`/patients/${patientId}/changes`);
  },

  uploadDocument: async (
    patientId: string,
    formData: FormData
  ): Promise<any> => {
    return apiRequest<any>(`/patients/${patientId}/documents`, {
      method: 'POST',
      body: formData,
    });
  },

  getAuditLogs: async (patientId?: string): Promise<AuditEventItem[]> => {
    const q = patientId ? `?patient_id=${patientId}` : '';
    return apiRequest<AuditEventItem[]>(`/audit${q}`);
  },
};
