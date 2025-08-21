import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import * as zapi from '../api/zapiApi';
const ZapiApi: any = (zapi as any).default ?? (zapi as any).ZapiApi;
import { io, Socket } from 'socket.io-client';

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
			<div className={embed ? '' : 'container py-4'}>
				{!embed && <h2 className="text-base uppercase tracking-wide text-gray-400 mb-3">Conectar WhatsApp</h2>}
				<div className="grid gap-6 md:grid-cols-2">
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
		<div className="rounded-xl border border-zinc-800 p-4 bg-zinc-950/50">
			<div className="mb-2 flex items-center justify-between">
				<div className="text-sm font-semibold">{instance === 'whatsapp1' ? 'Whatsapp 1' : 'Whatsapp 2'}</div>
				<div className="flex items-center gap-2">
					<button className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700 disabled:opacity-50" onClick={refresh} disabled={loading}>{loading ? 'Carregando...' : 'Atualizar'}</button>
					<button className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700" onClick={() => ZapiApi.restart(instance)}>Reiniciar</button>
					<button className="rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700" onClick={() => ZapiApi.disconnect(instance)}>Desconectar</button>
				</div>
			</div>
			{error && (
				<div className="bg-red-950/40 border border-red-900 text-red-200 p-3 rounded mb-3">
					<div className="font-semibold">Erro ao carregar {error.who === 'qr' ? 'QR Code' : 'status'}</div>
					{error.status && <div>Código: {error.status}</div>}
					{error.data?.error && <div>Erro: {String(error.data.error)}</div>}
					{error.data?.details && <pre className="whitespace-pre-wrap">{JSON.stringify(error.data.details, null, 2)}</pre>}
				</div>
			)}
			<div className="text-xs text-slate-400 mb-2">Status: {isConnected ? <span className="text-emerald-400">conectado</span> : <span className="text-red-400">desconectado</span>} {isConnected && (live[instance]?.phoneNumber || device?.phoneNumber) && (<span className="ml-2">• Número: <span className="font-mono">{live[instance]?.phoneNumber || device?.phoneNumber}</span></span>)}</div>
			<div className="w-[320px]">
				<h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">QR Code</h3>
				{isConnected || qr?.connected === true ? (
					<div className="p-3 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-200 min-h-[80px] flex items-center">
						<div>
							<div className="font-bold mb-1">conectado</div>
							<div>Número: {live[instance]?.phoneNumber || device?.phoneNumber || '—'}</div>
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
