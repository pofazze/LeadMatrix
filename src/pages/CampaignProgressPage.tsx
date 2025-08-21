import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { CampaignApi, connectSSE } from '../api/campaignApi';

export default function CampaignProgressPage({ campaignId }: { campaignId: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [pageSize] = useState(20);

  useEffect(() => {
    let stop: any;
    (async () => {
      const s = await CampaignApi.summary(campaignId);
      setSummary(s);
      stop = connectSSE(campaignId, async (type) => {
        if (type === 'summary') {
          const ns = await CampaignApi.summary(campaignId);
          setSummary(ns);
        }
      });
    })();
    return () => stop && stop();
  }, [campaignId]);

  useEffect(() => {
    (async () => {
      const r = await CampaignApi.sends(campaignId, { page, pageSize });
      setItems(r.items || []);
    })();
  }, [campaignId, page, pageSize, (summary as any)?.throughput]);

  const percent = (summary as any)?.percent || 0;

  function fmtEta(sec?: number) {
    if (sec === undefined || sec === null) return '-';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: 20 }}>
        <h2>Campanha #{campaignId}</h2>
        <div style={{ margin: '12px 0' }}>
          <div style={{ height: 12, background: '#eee', borderRadius: 8 }}>
            <div style={{ width: `${percent}%`, height: '100%', background: '#22c55e', borderRadius: 8 }} />
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <b>Status:</b> {(summary as any)?.status} | <b>{percent}%</b> | <b>TPS:</b> {(summary as any)?.throughput || 0} | <b>Avg TPS:</b> {(summary as any)?.avgThroughput?.toFixed?.(2) || 0} | <b>ETA:</b> {fmtEta((summary as any)?.etaSeconds)}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={() => CampaignApi.start(campaignId)}>Iniciar</button>
            <button onClick={() => CampaignApi.pause(campaignId)}>Pausar</button>
            <button onClick={() => CampaignApi.resume(campaignId)}>Retomar</button>
            <button onClick={() => CampaignApi.cancel(campaignId)}>Cancelar</button>
          </div>
        </div>
        <h3>Métricas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 10 }}>
          {['total','queued','sending','sent','delivered','read','failed','canceled'].map(k => (
            <div key={k} style={{ background: '#f9fafb', border: '1px solid #eee', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#666' }}>{k}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{(summary as any)?.totals?.[k] ?? '-'}</div>
            </div>
          ))}
        </div>
        <h3 style={{ marginTop: 20 }}>Últimos envios</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>Telefone</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>Status</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>Atualizado</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>Erro</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => (
              <tr key={it._id}>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 6 }}>{it.phone}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 6 }}>{it.status}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 6 }}>{new Date(it.updatedAt).toLocaleString()}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0', padding: 6 }}>{it.lastError || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</button>
          <span>Página {page}</span>
          <button onClick={() => setPage(p => p + 1)}>Próxima</button>
        </div>
      </div>
    </div>
  );
}
