import apiClient from './apiClient';

export interface Summary {
  status?: string;
  percent?: number;
  throughput?: number;
  avgThroughput?: number;
  etaSeconds?: number;
  totals?: Record<string, number>;
}

export const CampaignApi = {
  create: (data: any) => apiClient.post('/api/campaigns', data).then(r => r.data),
  enqueue: (id: string, sends: any[]) => apiClient.post(`/api/campaigns/${id}/enqueue`, { sends }).then(r => r.data),
  start: (id: string) => apiClient.post(`/api/campaigns/${id}/start`, null, { headers: { 'x-no-token': '1' } }).then(r => r.data),
  pause: (id: string) => apiClient.post(`/api/campaigns/${id}/pause`).then(r => r.data),
  resume: (id: string) => apiClient.post(`/api/campaigns/${id}/resume`, null, { headers: { 'x-no-token': '1' } }).then(r => r.data),
  cancel: (id: string) => apiClient.post(`/api/campaigns/${id}/cancel`).then(r => r.data),
  summary: (id: string) => apiClient.get(`/api/campaigns/${id}/summary`).then(r => r.data as Summary),
  sends: (id: string, params: any) => apiClient.get(`/api/campaigns/${id}/sends`, { params }).then(r => r.data as { items: any[] }),
  claim: (id: string, limit=20) => apiClient.post(`/api/campaigns/${id}/claim`, null, { params: { limit } }).then(r => r.data),
};

export function connectSSE(campaignId: string, onEvent: (type: string, payload: any) => void) {
  const url = `${apiClient.defaults.baseURL || ''}/api/campaigns/${campaignId}/stream`;
  const es = new EventSource(url);
  es.addEventListener('summary', (e: MessageEvent) => onEvent('summary', JSON.parse(e.data)));
  es.addEventListener('send_update', (e: MessageEvent) => onEvent('send_update', JSON.parse(e.data)));
  es.onerror = () => {};
  return () => es.close();
}
