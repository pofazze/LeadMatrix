import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/UseAuth';
import { useNavigate } from 'react-router-dom';
import WhatsappConnect from '../components/WhatsappConnect';
import DisparoWPP from '../components/DisparoWPP';
import ViewLeads from '../components/viewleads';
import PaginaDeDetalhes from '../components/PaginadeDetalhes';
import apiClient from '../api/apiClient';
import { io, Socket } from 'socket.io-client';
import WhatsappChat from '../components/WhatsappChat';

// Painel inline: busca leads e exibe ViewLeads + detalhes
function TabPainel() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadParaVisualizar, setLeadParaVisualizar] = useState<any | null>(null);

  useEffect(() => {
    let socket: Socket | null = null;
    setLoading(true);
    apiClient.get('/api/leads')
      .then(res => {
        const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
        setLeads(items);
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));

    try {
  const base = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:4000';
  const socketPath = (import.meta as any).env.VITE_SOCKET_PATH || '/socket.io';
  socket = io(base, { path: socketPath, transports: ['websocket'], withCredentials: true });
      socket.on('connect', () => { socket?.emit('join', { room: 'leads' }); });
      socket.on('leads:update', (payload: any) => {
        if (Array.isArray(payload?.items)) {
          setLeads(payload.items);
        } else if (payload?.op && payload?.doc) {
          setLeads(prev => {
            const id = (payload.doc._id?.$oid || payload.doc._id);
            const idx = prev.findIndex((x: any) => (x._id?.$oid || x._id) === id);
            if (payload.op === 'insert') return [payload.doc, ...prev];
            if (payload.op === 'update' && idx >= 0) {
              const copy = prev.slice();
              copy[idx] = { ...prev[idx], ...payload.doc };
              return copy;
            }
            if (payload.op === 'delete' && idx >= 0) return prev.filter((_, i) => i !== idx);
            return prev;
          });
        }
      });
    } catch {}

    return () => { socket?.disconnect(); };
  }, []);

  const handleEdit = (lead: any) => { console.log('editar', lead); };

  if (leadParaVisualizar) {
    return (
      <PaginaDeDetalhes
        lead={leadParaVisualizar}
        onBack={() => setLeadParaVisualizar(null)}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <div>
      {loading ? (
        <div className="px-5 py-4">Carregando leads...</div>
      ) : (
        <ViewLeads
          leads={leads as any[]}
          onView={(lead: any) => setLeadParaVisualizar(lead)}
          onEdit={handleEdit}
          onSendMessage={(lead: any) => { /* envio de mensagem */ }}
        />
      )}
    </div>
  );
}

function TabDisparo() {
  const [subtab, setSubtab] = useState<'disparo'|'whatsapp'>('disparo');
  return (
    <div style={{display: 'flex', flexFlow: 'column nowrap', gap: '1rem'}}>
      <div className="mb-3 flex gap-2">
        <button onClick={() => setSubtab('disparo')} className={subtab==='disparo' ? 'btn btn-primary' : 'btn btn-ghost'}>Disparo</button>
        <button onClick={() => setSubtab('whatsapp')} className={subtab==='whatsapp' ? 'btn btn-primary' : 'btn btn-ghost'}>WhatsApp Connect</button>
      </div>
      {subtab === 'disparo' ? (
        <div className="max-w-3xl w-full" style={{minWidth:'100%'}}>
          <DisparoWPP />
        </div>
      ) : (
        <WhatsappConnect embed />
      )}
    </div>
  );
}

function TabChat() { return <div className="card p-3"><WhatsappChat /></div>; }

export default function Home() {
  const [tab, setTab] = useState<'painel'|'disparo'|'chat'>('painel');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen grid grid-cols-[180px_1fr] bg-neutral-950 text-slate-100">
      <aside className="sticky top-0 h-screen border-r border-zinc-800 px-3 py-4 bg-black/60 backdrop-blur flex flex-col justify-between">
        <div>
          <div className="mb-4 text-lg font-bold tracking-wide content-center text-slate-50">
            <h1 style={{ textAlign: 'center' }}>LeadMatrix</h1>
          </div>
          <nav className="flex flex-col gap-2">
            <button className={`btn w-full justify-start ${tab==='painel' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('painel')}>Painel</button>
            <button className={`btn w-full justify-start ${tab==='disparo' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('disparo')}>Disparo</button>
            <button className={`btn w-full justify-start ${tab==='chat' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('chat')}>Chat</button>
          </nav>
        </div>
        <div className="relative mt-8">
          <button className="btn w-full justify-start btn-ghost flex items-center gap-2" onClick={() => setUserMenuOpen(v => !v)}>
            <i className="fa-solid fa-user-circle text-xl"></i>
            <span>{user?.usuario || 'Usuário'}</span>
            <i className={`fa-solid fa-chevron-${userMenuOpen ? 'up' : 'down'} ml-auto`}></i>
          </button>
          {userMenuOpen && (
            <div className="absolute left-0 bottom-12 w-full bg-zinc-900 border border-zinc-800 rounded shadow-lg z-50 flex flex-col">
              <button className="btn btn-ghost justify-start" onClick={() => { setUserMenuOpen(false); navigate('/perfil'); }}>
                <i className="fa-solid fa-id-badge mr-2"></i> Meu Perfil
              </button>
              <button className="btn btn-ghost justify-start" onClick={() => { setUserMenuOpen(false); navigate('/perfil?edit=1'); }}>
                <i className="fa-solid fa-user-pen mr-2"></i> Editar Perfil
              </button>
              {user?.role === 'admin' && (
                <button className="btn btn-ghost justify-start" onClick={() => { setUserMenuOpen(false); navigate('/registro'); }}>
                  <i className="fa-solid fa-user-plus mr-2"></i> Registrar Usuários
                </button>
              )}
              <button className="btn btn-ghost justify-start text-red-400" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket mr-2"></i> Sair
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="p-5">
        {tab === 'painel' && <TabPainel />}
        {tab === 'disparo' && <TabDisparo />}
        {tab === 'chat' && <TabChat />}
      </main>
    </div>
  );
}
