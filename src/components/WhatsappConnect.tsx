import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import * as zapi from '../api/zapiApi';
const ZapiApi: any = (zapi as any).default ?? (zapi as any).ZapiApi;
import { io, Socket } from 'socket.io-client';
import { RefreshCw, RotateCcw, Unplug, Smartphone, QrCode, Wifi, WifiOff } from 'lucide-react';

type Props = { embed?: boolean };

type LiveMap = Record<'whatsapp1'|'whatsapp2', { connected: boolean; phoneNumber?: string | null }>;

export default function WhatsappConnect({ embed = false }: Props) {
	const [live, setLive] = useState<LiveMap>({ whatsapp1: { connected: false, phoneNumber: null }, whatsapp2: { connected: false, phoneNumber: null } });

	useEffect(() => {
		const base = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:4000';
		const socketPath = (import.meta as any).env.VITE_SOCKET_PATH || '/socket.io';
		const s: Socket = io(base + '/zapi', { path: socketPath, withCredentials: true });
		const onStatus = (p: any) => {
			setLive(prev => ({ ...prev, [p.instance]: { connected: !!p.connected, phoneNumber: p.phoneNumber ?? null } }));
		};
		s.on('zapi:status', onStatus);
		// REST fallback polling (normalized /status)
		let t: any;
		const fetchOnce = async () => {
			try {
				const [s1, s2] = await Promise.all([
					ZapiApi.getStatus('whatsapp1').catch(() => null),
					ZapiApi.getStatus('whatsapp2').catch(() => null),
				]);
				if (s1 && typeof s1.connected === 'boolean') setLive(prev => ({ ...prev, whatsapp1: { connected: !!s1.connected, phoneNumber: s1.phoneNumber ?? null } }));
				if (s2 && typeof s2.connected === 'boolean') setLive(prev => ({ ...prev, whatsapp2: { connected: !!s2.connected, phoneNumber: s2.phoneNumber ?? null } }));
			} catch {}
		};
		fetchOnce();
		t = setInterval(fetchOnce, 15000);
		return () => { s.off('zapi:status', onStatus); s.disconnect(); };
	}, []);

	return (
		<div>
			{!embed && <Navbar />}
			<div className={embed ? '' : 'container py-8'}>
				{!embed && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-8"
					>
						<h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
							Conectar WhatsApp
						</h2>
						<div className="w-24 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
					</motion.div>
				)}
				<div className="grid gap-8 lg:grid-cols-2">
					<ConnectCard instance="whatsapp1" live={live} />
					<ConnectCard instance="whatsapp2" live={live} />
				</div>
			</div>
		</div>
	);
}

function ConnectCard({ instance, live }: { instance: 'whatsapp1'|'whatsapp2'; live: LiveMap }) {
	const [qr, setQr] = useState<any>(null);
	const [device, setDevice] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<any>(null);
	const isConnected = live[instance]?.connected === true;

	async function refresh() {
		setLoading(true);
		try {
			const q = await ZapiApi.getQR(instance).catch((e: any) => { throw { who:'qr', e }; });
			setQr(q);
			if (q?.connected === true) {
				const d = await ZapiApi.getDevice(instance).catch((e: any) => { throw { who:'device', e }; });
				setDevice(d);
			} else {
				setDevice(null);
			}
			setError(null);
		} catch (err: any) {
			const resp = err?.e?.response;
			setError({ who: err?.who || 'unknown', status: resp?.status, data: resp?.data, message: err?.e?.message || 'request_failed' });
			setQr(null);
			setDevice(null);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		let t: any;
		(async () => { await refresh(); })();
		if (!isConnected) t = setInterval(refresh, 15000);
		return () => { if (t) clearInterval(t); };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [instance, isConnected]);

	return (
		<motion.div 
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className="card p-6"
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
						<Smartphone className="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-blue-300">
							{instance === 'whatsapp1' ? 'WhatsApp 1' : 'WhatsApp 2'}
						</h3>
						<div className="flex items-center gap-2 text-xs">
							<div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
							<span className={isConnected ? 'status-online' : 'status-offline'}>
								{isConnected ? 'CONECTADO' : 'DESCONECTADO'}
							</span>
							{isConnected && (live[instance]?.phoneNumber || device?.phoneNumber) && (
								<span className="text-slate-400 ml-2 font-mono">
									{live[instance]?.phoneNumber || device?.phoneNumber}
								</span>
							)}
						</div>
					</div>
				</div>
				
				<div className="flex items-center gap-2">
					<motion.button 
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="btn btn-ghost text-xs" 
						onClick={refresh} 
						disabled={loading}
					>
						<RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
						{loading ? 'Carregando...' : 'Atualizar'}
					</motion.button>
					<motion.button 
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="btn btn-ghost text-xs" 
						onClick={() => ZapiApi.restart(instance)}
					>
						<RotateCcw className="w-4 h-4 mr-1" />
						Reiniciar
					</motion.button>
					<motion.button 
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="btn btn-outline text-xs" 
						onClick={() => ZapiApi.disconnect(instance)}
					>
						<Unplug className="w-4 h-4 mr-1" />
						Desconectar
					</motion.button>
				</div>
			</div>
			
			{/* Error display */}
			{error && (
				<motion.div 
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6"
				>
					<div className="font-semibold text-red-300 mb-2">
						Erro ao carregar {error.who === 'qr' ? 'QR Code' : 'status'}
					</div>
					{error.status && <div className="text-red-400 text-sm">Código: {error.status}</div>}
					{error.data?.error && <div className="text-red-400 text-sm">Erro: {String(error.data.error)}</div>}
					{error.data?.details && (
						<pre className="text-red-400 text-xs mt-2 whitespace-pre-wrap bg-red-900/20 p-2 rounded">
							{JSON.stringify(error.data.details, null, 2)}
						</pre>
					)}
				</motion.div>
			)}
			
			{/* QR Code section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<QrCode className="w-5 h-5 text-blue-400" />
					<h4 className="text-sm font-medium text-blue-300 uppercase tracking-wider">QR Code</h4>
				</div>
				
				<div className="flex justify-center">
					<AnimatePresence mode="wait">
						{isConnected || qr?.connected === true ? (
							<motion.div 
								key="connected"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 flex items-center gap-4 min-w-[300px]"
							>
								<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
									<Wifi className="w-6 h-6 text-green-400" />
								</div>
								<div>
									<div className="font-bold text-green-300 mb-1">Conectado</div>
									<div className="text-green-400 text-sm font-mono">
										{live[instance]?.phoneNumber || device?.phoneNumber || '—'}
									</div>
								</div>
							</motion.div>
						) : qr?.imageBase64 ? (
							<motion.div
								key="qr"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								className="relative"
							>
								<img 
									src={qr.imageBase64} 
									alt="QR Code" 
									className="w-[280px] h-[280px] rounded-lg border border-blue-500/30 neon-border" 
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
							</motion.div>
						) : (
							<motion.div 
								key="loading"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								className="w-[280px] h-[280px] border-2 border-dashed border-blue-500/30 rounded-lg flex items-center justify-center"
							>
								<div className="text-center">
									<WifiOff className="w-12 h-12 text-slate-400 mx-auto mb-2" />
									<p className="text-slate-400">
										{qr ? 'Sem imagem, tente novamente' : 'Carregando...'}
									</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
				
				<div className="text-center">
					<p className="text-xs text-slate-400">
						{isConnected 
							? 'Dispositivo conectado e pronto para uso.' 
							: 'O QR expira em ~20s, atualizamos automaticamente a cada 15s.'
						}
					</p>
				</div>
				
				<div className="flex justify-center">
					<motion.button 
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="btn btn-ghost text-sm" 
						onClick={async () => {
							const phone = window.prompt('Digite o número (com DDI/DDD)');
							if (!phone) return;
							const data = await ZapiApi.getPhoneCode(instance, phone);
							window.alert(`Código: ${data?.code ?? JSON.stringify(data)}`);
						}}
					>
						<Smartphone className="w-4 h-4 mr-2" />
						Código por telefone
					</motion.button>
				</div>
			</div>
		</motion.div>
	);
}

						</div>
					</div>
				) : qr?.imageBase64 ? (
					<img src={qr.imageBase64} alt="QR" className="w-[280px] h-[280px] border border-gray-800" />
				) : (
					<div className="w-[280px] h-[280px] border border-dashed border-gray-700 flex items-center justify-center text-gray-400">
						{qr ? 'Sem imagem, tente novamente' : 'Carregando...'}
					</div>
				)}
				<div className="text-xs text-gray-400 mt-2">
					{isConnected ? 'Dispositivo conectado.' : 'O QR expira em ~20s, atualizamos a cada 15s automaticamente.'}
				</div>
				<div className="mt-3">
					<button className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700" onClick={async () => {
						const phone = window.prompt('Digite o número (com DDI/DDD)');
						if (!phone) return;
						const data = await ZapiApi.getPhoneCode(instance, phone);
						window.alert(`Código: ${data?.code ?? JSON.stringify(data)}`);
					}}>Código por telefone</button>
				</div>
			</div>
		</div>
	);
}
