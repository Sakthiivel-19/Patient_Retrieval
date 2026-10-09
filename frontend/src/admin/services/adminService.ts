import { apiRequest } from '../../api/client';

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  department: string;
  license_number: string;
  created_at: string;
  grants: Array<{
    grant_id: number;
    patient_id: string;
    patient_name: string;
    permissions: string;
    created_at: string;
  }>;
}

export interface AdminGrant {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  permissions: string;
  granted_by: string;
  created_at: string;
}

export interface DoctorActivity {
  id: number;
  timestamp: string;
  user_id?: number;
  doctor_name: string;
  doctor_role: string;
  doctor_email: string;
  action: string;
  resource: string;
  status: string;
  patient_id?: string;
  patient_name?: string;
  details: Record<string, any>;
}

export interface CreateDoctorPayload {
  full_name: string;
  email: string;
  password: string;
  department: string;
  license_number: string;
  role: string;
}

export interface CreateGrantPayload {
  user_id: number;
  patient_id: string;
  permissions: string;
}

export interface CreatePatientPayload {
  id?: string;
  name: string;
  mrn: string;
  date_of_birth: string;
  gender: string;
  conditions?: string;
  allergies?: string;
  assigned_doctor_ids: number[];
  permissions?: string;
}

export const adminService = {
  async getUsers(): Promise<AdminUser[]> {
    return apiRequest<AdminUser[]>('/admin/users');
  },

  async createDoctor(payload: CreateDoctorPayload): Promise<AdminUser> {
    return apiRequest<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createPatient(payload: CreatePatientPayload): Promise<any> {
    return apiRequest<any>('/admin/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deletePatient(patientId: string): Promise<any> {
    return apiRequest<any>(`/admin/patients/${patientId}`, {
      method: 'DELETE',
    });
  },

  async getGrants(): Promise<AdminGrant[]> {
    return apiRequest<AdminGrant[]>('/admin/grants');
  },

  async createGrant(payload: CreateGrantPayload): Promise<AdminGrant> {
    return apiRequest<AdminGrant>('/admin/grants', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async revokeGrant(grantId: number): Promise<{ status: string; message: string }> {
    return apiRequest<{ status: string; message: string }>(`/admin/grants/${grantId}`, {
      method: 'DELETE',
    });
  },

  async getDoctorActivities(userId?: number, patientId?: string): Promise<DoctorActivity[]> {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', String(userId));
    if (patientId) params.append('patient_id', patientId);
    return apiRequest<DoctorActivity[]>(`/admin/activity?${params.toString()}`);
  },
};
