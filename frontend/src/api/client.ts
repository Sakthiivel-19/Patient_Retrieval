const isRenderHost = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
const defaultBackend = isRenderHost ? 'https://carelens-backend-t9ig.onrender.com' : '';
const apiBaseEnv = (import.meta as any)?.env?.VITE_API_BASE_URL || defaultBackend;
const API_BASE = (apiBaseEnv ? apiBaseEnv.replace(/\/$/, '') : '') + '/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('carelens_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, set Content-Type
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (fetchErr: any) {
    throw new Error(`Unable to reach backend server. Please check your internet connection or backend status. (${fetchErr.message})`);
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const errorDetail =
      data && typeof data === 'object' && data.detail
        ? data.detail
        : (typeof data === 'string' && data ? data : `HTTP ${response.status}: ${response.statusText}`);
    const error: any = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  return data as T;
}
