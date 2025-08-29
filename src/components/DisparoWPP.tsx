import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import apiClient from '../api/apiClient';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/UseAuth';
import { Play, Pause, Square, RotateCcw, Zap, Image, Video, Clock, Shield } from 'lucide-react';

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-8 lg:grid-cols-2"
    >
      <DisparoForm title="WhatsApp 1" defaultInstance="whatsapp1" socket={disparoSocketRef} connected={w1connected} phoneNumber={live.whatsapp1.phoneNumber || null} />
      <DisparoForm title="WhatsApp 2" defaultInstance="whatsapp2" socket={disparoSocketRef} connected={w2connected} phoneNumber={live.whatsapp2.phoneNumber || null} />
    </motion.div>
  );
}

function DisparoForm({ title, defaultInstance, socket, connected = false, phoneNumber }: { title: string; defaultInstance: 'whatsapp1' | 'whatsapp2'; socket: React.MutableRefObject<Socket | null>; connected?: boolean; phoneNumber?: string | null; }) {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  // Buscar coleções disponíveis ao montar
  useEffect(() => {
    axios.get('/api/collections', { validateStatus: () => true })
      .then(res => {
        let allowed = res.data.collections || [];
        setCollections(allowed);
        if (allowed.length > 0) setSelectedCollection(allowed[0]);
      });
  }, []);
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
      if (selectedCollection) payload.collection = selectedCollection;
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
    <motion.form 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-6 space-y-6" 
      onSubmit={handleSubmit}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-300">{title}</h3>
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              {instance}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className={`text-xs font-medium ${connected ? 'status-online' : 'status-offline'}`}>
            {connected ? 'CONECTADO' : 'DESCONECTADO'}
          </span>
          {connected && phoneNumber && (
            <span className="text-xs text-slate-400 ml-2 font-mono">
              {phoneNumber}
            </span>
          )}
        </div>
      </div>

      {!connected && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-300 text-sm font-medium">WhatsApp Desconectado</p>
            <p className="text-amber-400/80 text-xs">Conecte na aba "WhatsApp Connect" para liberar o disparo</p>
          </div>
        </motion.div>
      )}

      <fieldset disabled={disabledAll} className={`space-y-6 transition-all duration-300 ${disabledAll ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Seleção de coleção */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-blue-300">Coleção para disparo</label>
          <select className="input" value={selectedCollection} onChange={e => setSelectedCollection(e.target.value)}>
            {collections.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        
        {/* Mensagem */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-blue-300">Mensagem</label>
          <div className="flex items-center gap-2 mb-2">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" 
              className="w-8 h-8 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center" 
              onClick={() => insertAroundSelection('bold')}
            >
              <b className="text-blue-300">B</b>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" 
              className="w-8 h-8 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center" 
              onClick={() => insertAroundSelection('italic')}
            >
              <i className="text-blue-300">I</i>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" 
              className="w-8 h-8 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center line-through" 
              onClick={() => insertAroundSelection('strike')}
            >
              <span className="text-blue-300">S</span>
            </motion.button>
            <span className="ml-2 text-xs text-slate-400">
              Formatação: <b>*negrito*</b>, <i>_itálico_</i>, <s>~riscado~</s>
            </span>
          </div>
          <textarea 
            ref={textareaRef} 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            rows={5} 
            className="input resize-none" 
            placeholder="Digite sua mensagem aqui..." 
            required 
          />
        </div>
        
        {/* Tipo de mídia */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-blue-300">Anexar mídia</label>
          <div className="flex gap-4">
            <motion.label 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input 
                type="radio" 
                name={`media-${instance}`} 
                checked={mediaType === 'none'} 
                onChange={() => handleMediaTypeChange('none')}
                className="text-blue-500"
              />
              <span className="text-slate-300">Nenhum</span>
            </motion.label>
            <motion.label 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input 
                type="radio" 
                name={`media-${instance}`} 
                checked={mediaType === 'image'} 
                onChange={() => handleMediaTypeChange('image')}
                className="text-blue-500"
              />
              <Image className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300">Imagem</span>
            </motion.label>
            <motion.label 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input 
                type="radio" 
                name={`media-${instance}`} 
                checked={mediaType === 'video'} 
                onChange={() => handleMediaTypeChange('video')}
                className="text-blue-500"
              />
              <Video className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300">Vídeo</span>
            </motion.label>
          </div>
        </div>
        
        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Perfil de espera
            </label>
            <select className="input" value={waitProfile} onChange={(e) => setWaitProfile(e.target.value as any)}>
              <option value="20-30">Rápido (20–30s)</option>
              <option value="30-100">Moderado (30–100s)</option>
              <option value="60-200">Seguro (60–200s)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Proteção
            </label>
            <motion.label 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors"
            >
              <input 
                type="checkbox" 
                checked={skipAlreadySent} 
                onChange={(e) => setSkipAlreadySent(e.target.checked)}
                className="text-blue-500"
              />
              <span className="text-sm text-slate-300">Não enviar duplicatas</span>
        {/* Upload de mídia */}
        <AnimatePresence>
          {mediaType === 'image' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <input type="file" accept="image/*" onChange={handleImageChange} className="input" />
              {imagePreview && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full max-w-sm"
                >
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-blue-500/30" />
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button" 
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center" 
                    onClick={handleRemoveImage}
                  >
                    ×
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {mediaType === 'video' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <input type="file" accept="video/*" onChange={handleVideoChange} className="input" />
              {videoPreview && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full max-w-sm"
                >
                  <video src={videoPreview} className="w-full h-40 object-cover rounded-lg border border-blue-500/30" controls />
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button" 
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center" 
                    onClick={handleRemoveVideo}
                  >
                    ×
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </fieldset>

      {/* Controles */}
      <div className="flex flex-wrap gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit" 
          disabled={!connected || !!runId} 
          className="btn btn-primary flex-1 min-w-[140px]"
        >
          <Play className="w-4 h-4 mr-2" />
          Iniciar Disparo
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button" 
          onClick={pause} 
          disabled={!runId} 
          className="btn btn-ghost"
        >
          <Pause className="w-4 h-4 mr-2" />
          Pausar
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button" 
          onClick={resume} 
          disabled={!runId} 
          className="btn btn-ghost"
        >
          <Play className="w-4 h-4 mr-2" />
          Retomar
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button" 
          onClick={cancel} 
          disabled={!runId} 
          className="btn btn-outline"
        >
          <Square className="w-4 h-4 mr-2" />
          Cancelar
        </motion.button>
      </div>
      
      {/* Progress */}
      {progress && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="progress-bar h-3">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ 
                width: `${progress.total > 0 ? Math.min(100, Math.round((progress.processed / progress.total) * 100)) : 0}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-blue-300 font-medium">
              {progress.total > 0 ? Math.min(100, Math.round((progress.processed / progress.total) * 100)) : 0}%
            </span>
            <span className="text-slate-400">
              {progress.processed}/{progress.total}
            </span>
            <span className="text-green-400">
              ✓ {progress.sent}
            </span>
            <span className="text-red-400">
              ⚠ {progress.errors}
            </span>
            {waitInfo && (
              <span className="text-amber-400 text-xs ml-auto">
                Aguardando {Math.max(0, Math.ceil((waitInfo.until - Date.now()) / 1000))}s...
              </span>
            )}
          </div>
          
          {runId && (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Socket:</span>
              <span className={socketConnected ? 'status-online' : 'status-offline'}>
                {socketConnected ? 'conectado' : 'desconectado'}
              </span>
              <span>•</span>
              <span className="font-mono">{runId}</span>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Status */}
      {status && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-blue-300"
        >
          {statusKind !== 'idle' && getStatusIcon(statusKind) && (
            <i className={`fa-solid ${getStatusIcon(statusKind)} text-blue-400`}></i>
          )}
          {status}
        </motion.div>
      )}
    </motion.form>
  );
}
