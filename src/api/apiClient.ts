import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000';

const apiClient: AxiosInstance = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

// Mirror CSRF cookie into header
apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const csrf = getCookie('csrf_token');
  if (csrf) (config.headers as any)['X-CSRF-Token'] = csrf;
  return config;
});

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift()!;
  return '';
}

// Ensure CSRF cookie exists on boot
apiClient.get('/api/auth/csrf').catch(() => {});

export default apiClient;
