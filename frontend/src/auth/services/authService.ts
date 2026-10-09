import { apiRequest } from '../../api/client';
import { User } from '../../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  full_name: string;
  role: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('carelens_token', res.access_token);
    localStorage.setItem('carelens_user', JSON.stringify({
      id: res.user_id,
      email: res.email,
      full_name: res.full_name,
      role: res.role,
    }));
    return res;
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('carelens_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('carelens_token');
    localStorage.removeItem('carelens_user');
  },
};
