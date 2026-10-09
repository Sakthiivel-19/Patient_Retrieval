import { apiRequest } from '../../api/client';
import { Patient, PatientBrief } from '../../types';

export const patientService = {
  listPatients: async (): Promise<Patient[]> => {
    return apiRequest<Patient[]>('/patients');
  },

  getPatientBrief: async (patientId: string): Promise<PatientBrief> => {
    return apiRequest<PatientBrief>(`/patients/${patientId}/brief`);
  },
};
