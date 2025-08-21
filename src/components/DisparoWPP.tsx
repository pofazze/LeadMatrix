import { useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../api/apiClient';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/UseAuth';

type MediaKind = 'none' | 'image' | 'video';

export default function DisparoWPP() {
  const disparoSocketRef = useRef<Socket | null>(null);
  const [live, setLive] = useState<Record<'whatsapp1' | 'whatsapp2', { connected: boolean; phoneNumber?: string | null }>>({ whatsapp1: { connected: false, phoneNumber: null }, whatsapp2: { connected: false, phoneNumber: null } });

  useEffect(() => {
  const base = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:4000';
  const socketPath = (import.meta as any).env.VITE_SOCKET_PATH || '/socket.io';
  const ds = io(base + '/disparo', { path: socketPath, withCredentials: true });
    disparoSocketRef.current = ds;
  const zs = io(base + '/zapi', { path: socketPath, withCredentials: true });
    const onStatus = (p: any) => { setLive(prev => ({ ...prev, [p.instance]: { connected: !!p.connected, phoneNumber: p.phoneNumber ?? null } })); };
    zs.on('zapi:status', onStatus);
    // REST fallback: poll status periodically to unlock UI even if socket snapshots are delayed
    let t: any;
    const fetchOnce = async () => {
      try {
        const [s1, s2] = await Promise.all([
          apiClient.get('/api/zapi/whatsapp1/status').then(r => r.data).catch(() => null),
          apiClient.get('/api/zapi/whatsapp2/status').then(r => r.data).catch(() => null),
        ]);
        if (s1 && typeof s1.connected === 'boolean') setLive(prev => ({ ...prev, whatsapp1: { connected: !!s1.connected, phoneNumber: s1.phoneNumber ?? null } }));
        if (s2 && typeof s2.connected === 'boolean') setLive(prev => ({ ...prev, whatsapp2: { connected: !!s2.connected, phoneNumber: s2.phoneNumber ?? null } }));
      } catch {}
    };
    fetchOnce();
    t = setInterval(fetchOnce, 15000);
  return () => { if (t) clearInterval(t); ds.disconnect(); zs.off('zapi:status', onStatus); zs.disconnect(); };
  }, []);

  const w1connected = useMemo(() => live.whatsapp1.connected, [live]);
  const w2connected = useMemo(() => live.whatsapp2.connected, [live]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DisparoForm title="Whatsapp 1" defaultInstance="whatsapp1" socket={disparoSocketRef} connected={w1connected} phoneNumber={live.whatsapp1.phoneNumber || null} />
      <DisparoForm title="Whatsapp 2" defaultInstance="whatsapp2" socket={disparoSocketRef} connected={w2connected} phoneNumber={live.whatsapp2.phoneNumber || null} />
    </div>
  );
}

function DisparoForm({ title, defaultInstance, socket, connected = false, phoneNumber }: { title: string; defaultInstance: 'whatsapp1' | 'whatsapp2'; socket: React.MutableRefObject<Socket | null>; connected?: boolean; phoneNumber?: string | null; }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  type StatusKind = 'idle' | 'started' | 'running' | 'paused' | 'completed' | 'canceled' | 'error';
  const [statusKind, setStatusKind] = useState<StatusKind>('idle');
  const [mediaType, setMediaType] = useState<MediaKind>('none');
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [instance] = useState<'whatsapp1' | 'whatsapp2'>(defaultInstance);
  const [runId, setRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ processed: number; sent: number; errors: number; total: number } | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [waitInfo, setWaitInfo] = useState<{ seconds: number; until: number } | null>(null);
  const [waitTick, setWaitTick] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [waitProfile, setWaitProfile] = useState<'20-30' | '30-100' | '60-200'>('30-100');
  const [skipAlreadySent, setSkipAlreadySent] = useState<boolean>(true);
  const disabledAll = !connected || !!runId;

  const { user } = useAuth();
  useEffect(() => {
    let active = true;
    let s: Socket | null = socket.current;
    const attach = (sock: Socket) => {
      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);
      const onProgress = (p: any) => {
        if (!runId || p.runId !== runId) return;
        setProgress({ processed: p.processed, sent: p.sent, errors: p.errors, total: p.total });
        // clear wait countdown on next progress update
        setWaitInfo(w => (w ? { ...w } : w));
      };
      const onDone = (d: any) => {
        if (!runId || d.runId !== runId) return;
        setStatus(d.status === 'completed' ? 'Finalizado' : 'Cancelado');
        setStatusKind(d.status === 'completed' ? 'completed' : 'canceled');
        setRunId(null);
        setProgress(null);
        setWaitInfo(null);
      };
      const onWait = (w: any) => {
        if (!runId || w.runId !== runId) return;
        setWaitInfo({ seconds: Number(w.seconds) || 0, until: Number(w.until) || Date.now() });
      };
      sock.on('connect', onConnect);
      sock.on('disconnect', onDisconnect);
      sock.on('disparo:progress', onProgress);
      sock.on('disparo:done', onDone);
      sock.on('disparo:wait', onWait);
      return () => {
        sock.off('connect', onConnect);
        sock.off('disconnect', onDisconnect);
        sock.off('disparo:progress', onProgress);
        sock.off('disparo:done', onDone);
        sock.off('disparo:wait', onWait);
      };
    };
    let detach: (() => void) | null = null;
    if (s) {
      detach = attach(s);
    } else {
      // Wait for socket to be set on the ref, then attach handlers
      const id = setInterval(() => {
        if (!active) { clearInterval(id); return; }
        if (socket.current) {
          s = socket.current;
          if (s) {
            detach = attach(s);
            clearInterval(id);
          }
        }
      }, 100);
      return () => { active = false; clearInterval(id); if (detach) detach(); };
    }
    return () => { if (detach) detach(); };
  }, [runId, socket]);

  // Tick while waiting to update the countdown UI
  useEffect(() => {
    if (!waitInfo) return;
    const id = setInterval(() => setWaitTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [waitInfo]);

  // Rehydrate persistent run status on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await apiClient.get('/api/disparo/status', { params: { instance } });
        if (!mounted) return;
        const st = r.data;
        if (st && (st.status === 'running' || st.status === 'paused') && st.runId && st.instance === instance) {
          setRunId(st.runId);
          const t = st.totals || {};
          setProgress({ processed: t.processed || 0, sent: t.sent || 0, errors: t.errors || 0, total: t.queued || 0 });
          setStatus(st.status === 'paused' ? 'Pausado' : 'Em andamento');
          setStatusKind(st.status === 'paused' ? 'paused' : 'running');
        } else {
          setRunId(null);
          setProgress(null);
          setStatus('');
          setStatusKind('idle');
        }
      } catch { }
    })();
    return () => { mounted = false; };
  }, [instance]);

  // Polling fallback to keep progress updated if socket events lag
  useEffect(() => {
    if (!runId) return;
    let active = true;
    const id = setInterval(async () => {
      if (!active) return;
      try {
        const st = await apiClient.get('/api/disparo/status', { params: { instance } }).then(r => r.data);
        if (!st || st.instance !== instance) return;
        const t = st.totals || {};
        setProgress({ processed: t.processed || 0, sent: t.sent || 0, errors: t.errors || 0, total: t.queued || 0 });
        if (st.status === 'paused') {
          setStatus('Pausado'); setStatusKind('paused');
        } else if (st.status === 'running') {
          setStatus('Em andamento'); setStatusKind('running');
        } else if (st.status === 'completed' || st.status === 'canceled') {
          setStatus(st.status === 'completed' ? 'Finalizado' : 'Cancelado');
          setStatusKind(st.status);
          setRunId(null);
          clearInterval(id);
        }
      } catch {}
    }, 2000);
    return () => { active = false; clearInterval(id); };
  }, [runId, instance]);

  function insertAroundSelection(tag: 'bold' | 'italic' | 'strike') {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = message.substring(start, end);
    let tagOpen = '', tagClose = '';
    if (tag === 'bold') tagOpen = tagClose = '*';
    else if (tag === 'italic') tagOpen = tagClose = '_';
    else if (tag === 'strike') tagOpen = tagClose = '~';

    const before = message.substring(0, start);
    const after = message.substring(end);
    const newText = before + tagOpen + selected + tagClose + after;
    setMessage(newText);

    setTimeout(() => {
      textarea.setSelectionRange(start + tagOpen.length, end + tagOpen.length);
      textarea.focus();
    }, 0);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => { setImage(null); setImagePreview(null); };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(reader.result as string);
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveVideo = () => { setVideo(null); setVideoPreview(null); };

  const handleMediaTypeChange = (type: 'none' | 'image' | 'video') => {
    setMediaType(type);
    if (type !== 'image') { setImage(null); setImagePreview(null); }
    if (type !== 'video') { setVideo(null); setVideoPreview(null); }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('Iniciando disparo...');
    setStatusKind('started');
    try {
      const userName = user?.usuario || localStorage.getItem('lm_user') || undefined;
      const payload: any = { instance, type: mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : 'text', message, waitProfile, skipAlreadySent };
      if (userName) payload.userName = userName;
      if (mediaType === 'image' && image) payload.mediaBase64 = image;
      if (mediaType === 'video' && video) payload.mediaBase64 = video;
      const r = await apiClient.post('/api/disparo/start', payload);
      setRunId(r.data.runId);
      setStatus('Disparo iniciado');
      setStatusKind('running');
      // Prime progress totals early via status endpoint so UI shows 0/total immediately
      try {
        const st = await apiClient.get('/api/disparo/status', { params: { instance } }).then(rr => rr.data);
        const t = st?.totals || {};
        setProgress({ processed: t.processed || 0, sent: t.sent || 0, errors: t.errors || 0, total: t.queued || 0 });
      } catch {}
    } catch (err: any) {
      setStatus(err?.response ? 'Erro ao enviar.' : 'Erro de conexão.');
      setStatusKind('error');
      console.error(err);
    }
  };

  const pause = async () => { await apiClient.post('/api/disparo/pause', { instance }); setStatus('Pausado'); setStatusKind('paused'); };
  const resume = async () => { await apiClient.post('/api/disparo/resume', { instance }); setStatus('Retomado'); setStatusKind('running'); };
  const cancel = async () => { await apiClient.post('/api/disparo/cancel', { instance }); setStatus('Cancelando...'); setStatusKind('running'); };

  const getStatusIcon = (kind: StatusKind) => {
    switch (kind) {
      case 'started':
        return 'fa-rocket';
      case 'running':
        return 'fa-play';
      case 'paused':
        return 'fa-pause';
      case 'completed':
        return 'fa-circle-check';
      case 'canceled':
        return 'fa-stop';
      case 'error':
        return 'fa-triangle-exclamation';
      default:
        return '';
    }
  };

  return (
    <form className="w-full flex flex-col gap-4 rounded-xl text-red-100 border border-red-800 bg-[#140507] p-4 shadow-lg shadow-red-950/30" onSubmit={handleSubmit}>
      <div className="mb-1 text-sm font-semibold text-slate-300">{title}</div>
      <div className="text-[.7rem] text-red-300/90">INSTÂNCIA: <span className="font-mono text-red-200 uppercase">{instance}</span> • STATUS: {connected ? <span className="text-emerald-400">CONECTADO</span> : <span className="text-red-400">DESCONECTADO</span>} {connected && phoneNumber && <span className="ml-2">• NÚMERO: <span className="font-mono text-red-200">{phoneNumber}</span></span>}</div>

      {!connected && (
        <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-900 rounded p-2">
          Conecte o WhatsApp na aba "WhatsApp Connect" para liberar o disparo.
        </div>
      )}

      <fieldset disabled={disabledAll} style={{display: 'flex', flexFlow: 'column nowrap', gap: '1rem'}} className={disabledAll ? 'opacity-60 pointer-events-none select-none' : ''}>
        <div style={{display: 'flex', flexFlow: 'row wrap', gap: '.5rem'}}>
          <label className="font-semibold text-red-200">Mensagem:</label>
          <div className="mb-2 flex items-center gap-2 text-sm text-red-200">
            <button type="button" className="h-8 w-8 rounded-md border border-red-800 bg-red-900/40" onClick={() => insertAroundSelection('bold')}><b>B</b></button>
            <button type="button" className="h-8 w-8 rounded-md border border-red-800 bg-red-900/40" onClick={() => insertAroundSelection('italic')}><i>I</i></button>
            <button type="button" className="h-8 w-8 rounded-md border border-red-800 bg-red-900/40 line-through" onClick={() => insertAroundSelection('strike')}>S</button>
            <span className="ml-2 text-xs text-red-300/80">Use os botões para <b>*negrito*</b>, <i>_itálico_</i> ou <s>~riscado~</s></span>
          </div>
          <textarea style={{ width: '100%' }} ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="rounded-md border border-red-900 bg-[#1d0a0d] px-3 py-2 text-sm placeholder-red-300/50 focus:outline-none focus:ring-1 focus:ring-red-600" placeholder="Digite e use os botões acima para formatar seu texto..." required />
        </div>
        <div className="mb-3">
          <span className="font-semibold text-red-200">Anexar mídia:</span>
          <div className="mt-1.5 flex gap-4 text-red-200">
            <label className="flex items-center gap-1.5"><input type="radio" name={`media-${instance}`} checked={mediaType === 'none'} onChange={() => handleMediaTypeChange('none')} />Nenhum</label>
            <label className="flex items-center gap-1.5"><input type="radio" name={`media-${instance}`} checked={mediaType === 'image'} onChange={() => handleMediaTypeChange('image')} />Imagem</label>
            <label className="flex items-center gap-1.5"><input type="radio" name={`media-${instance}`} checked={mediaType === 'video'} onChange={() => handleMediaTypeChange('video')} />Vídeo</label>
          </div>
        </div>
        <div className="mb-1 gap-2 flex flex-row align-center">
          <label className="font-semibold text-red-200">Perfil de espera:</label>
          <select className="ml-2 rounded-md border border-red-900 bg-[#1d0a0d] px-2 py-1 text-sm text-red-100" value={waitProfile} onChange={(e) => setWaitProfile(e.target.value as any)}>
            <option value="20-30">20–30s</option>
            <option value="30-100">30–100s</option>
            <option value="60-200">60–200s</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-red-200">
          <input type="checkbox" checked={skipAlreadySent} onChange={(e) => setSkipAlreadySent(e.target.checked)} />
          Não enviar para quem já recebeu
        </label>

        {mediaType === 'image' && (
          <div className="flex flex-col gap-2">
            <input type="file" accept="image/*" onChange={handleImageChange} className="rounded-md border border-red-900 bg-[#1d0a0d] px-3 py-2 text-sm" />
            {imagePreview && (
              <div className="relative mt-2 w-full max-w-sm">
                <img src={imagePreview} alt="Miniatura da imagem" className="h-auto max-h-40 w-full rounded-lg object-contain bg-[#220b0f] border border-red-900" />
                <button type="button" className="absolute right-2 top-2 h-8 w-8 rounded-md border border-red-900 bg-red-900/40 text-lg font-bold" onClick={handleRemoveImage} title="Remover imagem">×</button>
              </div>
            )}
          </div>
        )}

        {mediaType === 'video' && (
          <div className="flex flex-col gap-2">
            <input type="file" accept="video/*" onChange={handleVideoChange} className="rounded-md border border-red-900 bg-[#1d0a0d] px-3 py-2 text-sm" />
            {videoPreview && (
              <div className="relative mt-2 w-full max-w-sm">
                <video src={videoPreview} className="h-auto max-h-40 w-full rounded-lg object-contain bg-[#220b0f] border border-red-900" controls />
                <button type="button" className="absolute right-2 top-2 h-8 w-8 rounded-md border border-red-900 bg-red-900/40 text-lg font-bold" onClick={handleRemoveVideo} title="Remover vídeo">×</button>
              </div>
            )}
          </div>
        )}
      </fieldset>

      <div className="w-full flex items-center gap-2">
        <button type="submit" disabled={!connected || !!runId} className="rounded-md bg-red-600 hover:bg-red-500 px-3 py-2 font-semibold text-white disabled:opacity-50">Iniciar disparo</button>
        <button type="button" onClick={pause} disabled={!runId} className="rounded-md bg-[#2a0e12] border border-red-900 px-3 py-2 text-sm disabled:opacity-50 hover:bg-[#351016]">Pausar</button>
        <button type="button" onClick={resume} disabled={!runId} className="rounded-md bg-[#2a0e12] border border-red-900 px-3 py-2 text-sm disabled:opacity-50 hover:bg-[#351016]">Retomar</button>
        <button type="button" onClick={cancel} disabled={!runId} className="rounded-md bg-[#2a0e12] border border-red-900 px-3 py-2 text-sm disabled:opacity-50 hover:bg-[#351016]">Cancelar</button>
      </div>
      {progress && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded bg-[#2b0f14] border border-red-900">
            {(() => {
              const pct = progress.total > 0 ? Math.min(100, Math.round((progress.processed / progress.total) * 100)) : 0;
              return <div className="h-full bg-red-600 transition-[width] duration-300" style={{ width: pct + '%' }} />;
            })()}
          </div>
          <div className="mt-1 text-xs text-red-200 flex items-center gap-3">
            {(() => {
              const pct = progress.total > 0 ? Math.min(100, Math.round((progress.processed / progress.total) * 100)) : 0;
              return <span className="inline-block min-w-[3ch] text-right">{pct}%</span>;
            })()}
            <span>{progress.processed}/{progress.total}</span>
    <span className="flex items-center gap-1">• <i className="fa-solid fa-check text-red-500"></i> {progress.sent}</span>
    <span className="flex items-center gap-1">• <i className="fa-solid fa-triangle-exclamation text-red-500"></i> {progress.errors}</span>
            {waitInfo && (
              <span className="ml-auto text-[11px] text-red-300">Aguardando {Math.max(0, Math.ceil((waitInfo.until - Date.now()) / 1000))}s para próximo envio...</span>
            )}
          </div>
          {runId && (
            <div className="mt-1 text-[10px] text-red-300/80">Socket: {socketConnected ? <span className="text-emerald-400">conectado</span> : <span className="text-red-400">desconectado</span>} • Run: {runId}</div>
          )}
        </div>
      )}
  <p className="text-sm text-red-200 flex items-center gap-2">{statusKind !== 'idle' && getStatusIcon(statusKind) && (<i className={`fa-solid ${getStatusIcon(statusKind)} text-red-500`}></i>)}{status}</p>
    </form>
  );
}
