import apiClient from './apiClient';

const api = {
  getQR: (instance: string) => apiClient.get(`/api/zapi/${instance}/qr`, { params: { t: Date.now() } }).then(r => r.data as any),
  getSession: (instance: string) => apiClient.get(`/api/zapi/${instance}/session`).then(r => r.data as any),
  getDevice: (instance: string) => apiClient.get(`/api/zapi/${instance}/device`).then(r => r.data as any),
  getStatus: (instance: string) => apiClient.get(`/api/zapi/${instance}/status`).then(r => r.data as any),
  restart: (instance: string) => apiClient.post(`/api/zapi/${instance}/restart`).then(r => r.data as any),
  disconnect: (instance: string) => apiClient.post(`/api/zapi/${instance}/disconnect`).then(r => r.data as any),
  getPhoneCode: (instance: string, phone: string) => apiClient.get(`/api/zapi/${instance}/phone-code/${encodeURIComponent(phone)}`).then(r => r.data as any),
};

export const ZapiApi = api;
export default api;
