import { useMemo, useState, Fragment } from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Popover, Transition } from '@headlessui/react';
import CustomDropdown from './CustomDropdown';

export default function ViewLeads({ leads = [], onEdit, onView, onSendMessage }: { leads: any[]; onEdit?: (lead: any) => void; onView?: (lead: any) => void; onSendMessage?: (lead: any) => void; }) {
	const [cidadeFiltro, setCidadeFiltro] = useState('');
	const [canalFiltro, setCanalFiltro] = useState('');
	const [edicaoFiltro, setEdicaoFiltro] = useState('');
	const [gestorFiltro, setGestorFiltro] = useState('');
	const [viewMode, setViewMode] = useState<'table' | 'mini'>('table');

	const [isExportMenuOpen, setExportMenuOpen] = useState(false);
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
		<div className="p-1 font-sans flex flex-col flex-nowrap gap-5">
			<div className="mb-5 card p-4 flex flex-col flex-nowrap gap-3">
				<div className="flex flex-wrap items-center justify-between gap-3 z-40">
					<div className="flex flex-wrap items-center gap-3">
						<CustomDropdown label="Cidade" value={cidadeFiltro} options={cidadesUnicas} onSelect={setCidadeFiltro} />
						<CustomDropdown label="Canal" value={canalFiltro} options={canaisUnicos} onSelect={setCanalFiltro} />
						<CustomDropdown label="Edição" value={edicaoFiltro} options={edicoesUnicas} onSelect={setEdicaoFiltro} />
						<CustomDropdown label="Gestor" value={gestorFiltro} options={gestoresUnicos} onSelect={setGestorFiltro} />
						<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
							<div className="text-sm text-slate-400">Mostrando <span className="text-slate-200 font-medium">{leadsFiltrados.length}</span> de <span className="text-slate-200 font-medium">{leads.length}</span> leads</div>
							{([cidadeFiltro, canalFiltro, edicaoFiltro, gestorFiltro].some(Boolean)) && (
								<button className="btn btn-ghost" onClick={clearFilters}>Limpar filtros</button>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Popover className="relative inline-block">
							<div onMouseEnter={handleExportMenuEnter} onMouseLeave={handleExportMenuLeave}>
								<Popover.Button as="div" className="btn btn-primary cursor-pointer select-none inline-flex">
									Baixar Planilha
									<i className="fa-solid fa-chevron-down ml-2" aria-hidden="true"></i>
								</Popover.Button>
								<Transition show={isExportMenuOpen} as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
									<Popover.Panel static className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-zinc-800 bg-zinc-950">
										<div className="rounded-md border border-zinc-800 bg-zinc-950 p-1">
											<button className="w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-zinc-900" onClick={() => exportarPlanilha('csv')}>CSV</button>
											<button className="w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-zinc-900" onClick={() => exportarPlanilha('excel')}>Excel (.xlsx)</button>
										</div>
									</Popover.Panel>
								</Transition>
							</div>
						</Popover>
						<button className="btn btn-outline" onClick={() => setViewMode(viewMode === 'table' ? 'mini' : 'table')}>
							{viewMode === 'table' ? 'Tabela' : 'Miniaturas'}
						</button>
					</div>
				</div>

			</div>

			{viewMode === 'table' && (
				<div className="card overflow-x-auto">
					<table className="w-full border-collapse min-w-[900px]">
						<thead>
							{table.getHeaderGroups().map(headerGroup => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map(header => (
										<th className="sticky top-0 z-0 bg-zinc-900/80 backdrop-blur px-4 py-3 text-left text-slate-300 text-xs uppercase tracking-wide border-b border-zinc-800" key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map(row => (
								<tr key={row.id} className="hover:bg-zinc-900/40">
									{row.getVisibleCells().map((cell, idx) => (
										<td
											className={`px-4 py-3 text-sm text-slate-300 border-b border-zinc-800 ${idx === 0 ? 'whitespace-nowrap font-medium text-slate-200' : ''}`}
											key={cell.id}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
					{!leadsFiltrados.length && <div className="p-8 w-full text-center text-slate-400">Nenhum lead encontrado</div>}
				</div>
			)}

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
