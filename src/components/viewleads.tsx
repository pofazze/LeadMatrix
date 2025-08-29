import { useMemo, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Popover, Transition } from '@headlessui/react';
import CustomDropdown from './CustomDropdown';
import { Download, Grid3X3, List, Eye, Edit, MessageCircle, Filter, X } from 'lucide-react';

export default function ViewLeads({ leads = [], onEdit, onView, onSendMessage }: { leads: any[]; onEdit?: (lead: any) => void; onView?: (lead: any) => void; onSendMessage?: (lead: any) => void; }) {
	const [cidadeFiltro, setCidadeFiltro] = useState('');
	const [canalFiltro, setCanalFiltro] = useState('');
	const [edicaoFiltro, setEdicaoFiltro] = useState('');
	const [gestorFiltro, setGestorFiltro] = useState('');
	const [viewMode, setViewMode] = useState<'table' | 'mini'>('table');

	const [isExportMenuOpen, setExportMenuOpen] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	let exportTimeout: any;
	const handleExportMenuEnter = () => { clearTimeout(exportTimeout); setExportMenuOpen(true); };
	const handleExportMenuLeave = () => { exportTimeout = setTimeout(() => setExportMenuOpen(false), 200); };

	const clearFilters = () => {
		setCidadeFiltro('');
		setCanalFiltro('');
		setEdicaoFiltro('');
		setGestorFiltro('');
	};

	const cidadesUnicas = useMemo(() =>
		Array.from(new Set(leads.map(lead => lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra ? lead.cidade.seOutra : lead.cidade?.cidade).filter(Boolean))).sort() as string[], [leads]
	);

	const canaisUnicos = useMemo(() =>
		Array.from(new Set(leads.map(lead => lead.canaldeaquisicao?.origem).filter(Boolean))).sort() as string[], [leads]
	);

	const edicoesUnicas = useMemo(() =>
		Array.from(new Set(leads.map(lead => lead.edicao).filter(Boolean))).sort() as string[], [leads]
	);

	const gestoresUnicos = useMemo(() => {
		const gestorMap = new Map<string, string>();
		leads.forEach(lead => {
			const gestorOriginal = lead.canaldeaquisicao?.nomeDoGestor;
			if (gestorOriginal && gestorOriginal.trim()) {
				const gestorNormalizado = gestorOriginal.trim().toLowerCase();
				if (!gestorMap.has(gestorNormalizado)) {
					gestorMap.set(gestorNormalizado, gestorOriginal.trim());
				}
			}
		});
		return Array.from(gestorMap.values()).sort();
	}, [leads]);

	const leadsFiltrados = useMemo(() =>
		leads.filter(lead => {
			const cidade = lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra ? lead.cidade.seOutra : lead.cidade?.cidade;
			const gestorDoLead = lead.canaldeaquisicao?.nomeDoGestor;
			const gestorPassaFiltro = !gestorFiltro || (gestorDoLead && gestorDoLead.trim().toLowerCase() === gestorFiltro.toLowerCase());
			return (!cidadeFiltro || cidade === cidadeFiltro)
				&& (!canalFiltro || lead.canaldeaquisicao?.origem === canalFiltro)
				&& (!edicaoFiltro || lead.edicao === edicaoFiltro)
				&& gestorPassaFiltro;
		}), [leads, cidadeFiltro, canalFiltro, edicaoFiltro, gestorFiltro]
	);

	const exportarPlanilha = (formato: 'csv' | 'excel') => {
		const dadosParaExportar = leadsFiltrados.map((lead: any) => ({
			'Nome': lead.nome,
			'WhatsApp': lead.whatsappNumber,
			'Email': lead.email,
			'Edição': lead.edicao,
			'Cidade': lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra ? lead.cidade.seOutra : lead.cidade?.cidade || '-',
			'Canal de aquisição': lead.canaldeaquisicao?.origem || '-',
			'Nome do Gestor': lead.canaldeaquisicao?.nomeDoGestor?.trim() || '-',
		}));

		if (formato === 'csv') {
			const csv = Papa.unparse(dadosParaExportar as any);
			const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
			saveAs(blob, 'leads_filtrados.csv');
		}

		if (formato === 'excel') {
			const worksheet = XLSX.utils.json_to_sheet(dadosParaExportar);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
			const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
			const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
			saveAs(blob, 'leads_filtrados.xlsx');
		}
		setExportMenuOpen(false);
	};

	const columns = useMemo<ColumnDef<any>[]>(() => [
		{ header: 'Nome', accessorKey: 'nome' },
		{ header: 'WhatsApp', accessorKey: 'whatsappNumber' },
		{ header: 'Email', accessorKey: 'email' },
		{ header: 'Edição', accessorKey: 'edicao' },
		{
			header: 'Cidade',
			accessorFn: (row) => row.cidade?.cidade === 'Outra cidade' && row.cidade?.seOutra ? row.cidade.seOutra : row.cidade?.cidade || '-',
		},
		{ header: 'Canal de aquisição', accessorFn: (row) => row.canaldeaquisicao?.origem || '-' },
		{ header: 'Nome do Gestor', accessorFn: (row) => row.canaldeaquisicao?.nomeDoGestor?.trim() || '-' },
		{
			header: 'Ações',
			cell: (info) => (
								<div className="flex items-center">
									<button className="mx-0.5 rounded-full p-1 text-slate-400 hover:bg-zinc-200 hover:text-zinc-900" onClick={() => onView?.(info.row.original)} title="Visualizar" aria-label="Visualizar">
										<i className="fa-solid fa-eye" aria-hidden="true"></i>
									</button>
									<button className="mx-0.5 rounded-full p-1 text-slate-400 hover:bg-zinc-200 hover:text-zinc-900" onClick={() => onEdit?.(info.row.original)} title="Editar" aria-label="Editar">
										<i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
									</button>
									<button className="mx-0.5 rounded-full p-1 text-slate-400 hover:bg-zinc-200 hover:text-zinc-900" onClick={() => onSendMessage?.(info.row.original)} title="Enviar mensagem" aria-label="Enviar mensagem">
										<i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
									</button>
								</div>
			),
		},
	], [onEdit, onView, onSendMessage]);

	const table = useReactTable({ data: leadsFiltrados, columns, getCoreRowModel: getCoreRowModel() });

	return (
		<motion.div 
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="font-sans flex flex-col gap-6"
		>
			{/* Header com controles */}
			<motion.div 
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				className="card p-6"
			>
				<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
					<div className="flex items-center gap-4">
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setShowFilters(!showFilters)}
							className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
						>
							<Filter className="w-4 h-4 mr-2" />
							Filtros
						</motion.button>
						
						<div className="text-sm text-slate-400 flex items-center gap-2">
							<span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
							Mostrando <span className="text-blue-400 font-medium">{leadsFiltrados.length}</span> de <span className="text-slate-200 font-medium">{leads.length}</span> leads
						</div>
					</div>
					
					<div className="flex items-center gap-2">
						<Popover className="relative inline-block">
							<div onMouseEnter={handleExportMenuEnter} onMouseLeave={handleExportMenuLeave}>
								<Popover.Button as="div" className="btn btn-primary cursor-pointer select-none inline-flex items-center">
									<Download className="w-4 h-4 mr-2" />
									Exportar
								</Popover.Button>
								<Transition show={isExportMenuOpen} as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
									<Popover.Panel static className="absolute right-0 z-10 mt-2 w-44 modal-content rounded-lg">
										<div className="p-2">
											<motion.button 
												whileHover={{ scale: 1.02, x: 4 }}
												className="w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-blue-500/20" 
												onClick={() => exportarPlanilha('csv')}
											>
												CSV
											</motion.button>
											<motion.button 
												whileHover={{ scale: 1.02, x: 4 }}
												className="w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-blue-500/20" 
												onClick={() => exportarPlanilha('excel')}
											>
												Excel (.xlsx)
											</motion.button>
										</div>
									</Popover.Panel>
								</Transition>
							</div>
						</Popover>
						
						<motion.button 
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="btn btn-outline" 
							onClick={() => setViewMode(viewMode === 'table' ? 'mini' : 'table')}
						>
							{viewMode === 'table' ? (
								<><Grid3X3 className="w-4 h-4 mr-2" />Cards</>
							) : (
								<><List className="w-4 h-4 mr-2" />Tabela</>
							)}
						</motion.button>
					</div>
				</div>

				{/* Filtros expansíveis */}
				<AnimatePresence>
					{showFilters && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							className="overflow-hidden"
						>
							<div className="pt-4 border-t border-blue-500/20">
								<div className="flex flex-wrap items-center gap-3 mb-4">
									<CustomDropdown label="Cidade" value={cidadeFiltro} options={cidadesUnicas} onSelect={setCidadeFiltro} />
									<CustomDropdown label="Canal" value={canalFiltro} options={canaisUnicos} onSelect={setCanalFiltro} />
									<CustomDropdown label="Edição" value={edicaoFiltro} options={edicoesUnicas} onSelect={setEdicaoFiltro} />
									<CustomDropdown label="Gestor" value={gestorFiltro} options={gestoresUnicos} onSelect={setGestorFiltro} />
								</div>
								
								{([cidadeFiltro, canalFiltro, edicaoFiltro, gestorFiltro].some(Boolean)) && (
									<motion.button 
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										className="btn btn-ghost" 
										onClick={clearFilters}
									>
										<X className="w-4 h-4 mr-2" />
										Limpar filtros
									</motion.button>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Conteúdo principal */}
			<AnimatePresence mode="wait">
				{viewMode === 'table' ? (
					<motion.div 
						key="table"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="card overflow-x-auto"
					>
						<table className="w-full border-collapse min-w-[900px]">
							<thead>
								{table.getHeaderGroups().map(headerGroup => (
									<tr key={headerGroup.id}>
										{headerGroup.headers.map(header => (
											<th className="sticky top-0 z-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur px-4 py-4 text-left text-blue-300 text-xs uppercase tracking-wide border-b border-blue-500/30" key={header.id}>
												{flexRender(header.column.columnDef.header, header.getContext())}
											</th>
										))}
									</tr>
								))}
							</thead>
							<tbody>
								{table.getRowModel().rows.map((row, index) => (
									<motion.tr 
										key={row.id} 
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.05 }}
										className="table-row hover:bg-blue-500/5 transition-all duration-300"
									>
										{row.getVisibleCells().map((cell, idx) => (
											<td
												className={`px-4 py-4 text-sm text-slate-300 border-b border-blue-500/10 ${idx === 0 ? 'whitespace-nowrap font-medium text-blue-300' : ''}`}
												key={cell.id}
											>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										))}
									</motion.tr>
								))}
							</tbody>
						</table>
						{!leadsFiltrados.length && (
							<motion.div 
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="p-12 w-full text-center text-slate-400"
							>
								<div className="text-6xl mb-4">🔍</div>
								<p className="text-lg">Nenhum lead encontrado</p>
							</motion.div>
						)}
					</motion.div>
				) : (
					<motion.div 
						key="grid"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6"
					>
						{leadsFiltrados.map((lead: any, index) => {
							const cidade = lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra ? lead.cidade.seOutra : lead.cidade?.cidade;
							return (
								<motion.div 
									key={lead._id?.$oid || lead._id}
									initial={{ opacity: 0, y: 20, scale: 0.9 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									transition={{ delay: index * 0.1 }}
									whileHover={{ scale: 1.02, y: -5 }}
									className="card p-6 hover:border-blue-400/50 transition-all duration-300 group"
								>
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1">
											<h3 className="text-lg font-semibold text-blue-300 mb-1 group-hover:text-blue-200 transition-colors">
												{lead.nome}
											</h3>
											<div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
										</div>
									</div>
									
									<div className="space-y-3 mb-6">
										<div className="flex items-center text-sm">
											<span className="text-slate-400 w-20">Cidade:</span>
											<span className="text-slate-300">{cidade || '-'}</span>
										</div>
										<div className="flex items-center text-sm">
											<span className="text-slate-400 w-20">Edição:</span>
											<span className="text-slate-300">{lead.edicao || '-'}</span>
										</div>
										<div className="flex items-center text-sm">
											<span className="text-slate-400 w-20">Canal:</span>
											<span className="text-slate-300">{lead.canaldeaquisicao?.origem || '-'}</span>
										</div>
										<div className="flex items-center text-sm">
											<span className="text-slate-400 w-20">Gestor:</span>
											<span className="text-slate-300">{lead.canaldeaquisicao?.nomeDoGestor?.trim() || '-'}</span>
										</div>
										<div className="flex items-center text-sm">
											<span className="text-slate-400 w-20">WhatsApp:</span>
											<span className="text-slate-300 font-mono">{lead.whatsappNumber || '-'}</span>
										</div>
										<div className="flex items-center text-sm">
											<span className="text-slate-400 w-20">Email:</span>
											<span className="text-slate-300">{lead.email || '-'}</span>
										</div>
									</div>
									
									<div className="flex gap-2 pt-4 border-t border-blue-500/20">
										<motion.button 
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className="flex-1 btn btn-ghost text-xs py-2" 
											onClick={() => onView?.(lead)}
										>
											<Eye className="w-4 h-4" />
										</motion.button>
										<motion.button 
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className="flex-1 btn btn-ghost text-xs py-2" 
											onClick={() => onEdit?.(lead)}
										>
											<Edit className="w-4 h-4" />
										</motion.button>
										<motion.button 
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className="flex-1 btn btn-ghost text-xs py-2" 
											onClick={() => onSendMessage?.(lead)}
										>
											<MessageCircle className="w-4 h-4" />
										</motion.button>
									</div>
								</motion.div>
							);
						})}
						{!leadsFiltrados.length && (
							<motion.div 
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="col-span-full text-center py-12 text-slate-400"
							>
								<div className="text-6xl mb-4">🔍</div>
								<p className="text-lg">Nenhum lead encontrado</p>
							</motion.div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}


			{viewMode === 'mini' && (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
					{leadsFiltrados.map((lead: any) => {
						const cidade = lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra ? lead.cidade.seOutra : lead.cidade?.cidade;
						return (
							<div className="card p-4 hover:border-zinc-700 transition" key={lead._id?.$oid || lead._id}>
								<div className="mb-3 text-lg font-semibold text-slate-100">{lead.nome}</div>
								<div className="flex-1">
									<div className="mb-1.5 text-sm text-slate-400"><span className="text-slate-300">Cidade:</span> {cidade || '-'}</div>
									<div className="mb-1.5 text-sm text-slate-400"><span className="text-slate-300">Edição:</span> {lead.edicao || '-'}</div>
									<div className="mb-1.5 text-sm text-slate-400"><span className="text-slate-300">Canal:</span> {lead.canaldeaquisicao?.origem || '-'}</div>
									<div className="mb-1.5 text-sm text-slate-400"><span className="text-slate-300">Gestor:</span> {lead.canaldeaquisicao?.nomeDoGestor?.trim() || '-'}</div>
									<div className="mb-1.5 text-sm text-slate-400"><span className="text-slate-300">WhatsApp:</span> {lead.whatsappNumber || '-'}</div>
									<div className="mb-1.5 text-sm text-slate-400"><span className="text-slate-300">Email:</span> {lead.email || '-'}</div>
								</div>
								<div className="mt-3 flex gap-2 border-t border-zinc-800 pt-3">
									<button className="rounded-full p-1.5 text-slate-300 hover:bg-zinc-800" onClick={() => onView?.(lead)} title="Visualizar" aria-label="Visualizar">
										<i className="fa-solid fa-eye"></i>
									</button>
									<button className="rounded-full p-1.5 text-slate-300 hover:bg-zinc-800" onClick={() => onEdit?.(lead)} title="Editar" aria-label="Editar">
										<i className="fa-solid fa-pen-to-square"></i>
									</button>
									<button className="rounded-full p-1.5 text-slate-300 hover:bg-zinc-800" onClick={() => onSendMessage?.(lead)} title="Enviar mensagem" aria-label="Enviar mensagem">
										<i className="fa-solid fa-comment-dots"></i>
									</button>
								</div>
							</div>
						);
					})}
					{!leadsFiltrados.length && <div className="my-8 w-full text-center text-slate-400">Nenhum lead encontrado</div>}
				</div>
			)}
		</div>
	);
}
