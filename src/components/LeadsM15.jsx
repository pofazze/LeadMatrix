import React, { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import styles from './LeadsM15.module.scss';

function LeadsM15({ leads = [], onEdit, onView, onSendMessage }) {
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [canalFiltro, setCanalFiltro] = useState('');
  const [edicaoFiltro, setEdicaoFiltro] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const cidadesUnicas = useMemo(() =>
    Array.from(new Set(leads.map(lead =>
      lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra
        ? lead.cidade.seOutra
        : lead.cidade?.cidade
    ).filter(Boolean))).sort()
  , [leads]);

  const canaisUnicos = useMemo(() =>
    Array.from(new Set(leads.map(lead =>
      lead.canaldeaquisicao?.origem
    ).filter(Boolean))).sort()
  , [leads]);

  const edicoesUnicas = useMemo(() =>
    Array.from(new Set(leads.map(lead => lead.edicao).filter(Boolean))).sort()
  , [leads]);

  const leadsFiltrados = useMemo(() =>
    leads.filter(lead => {
      const cidade = lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra
        ? lead.cidade.seOutra
        : lead.cidade?.cidade;
      return (!cidadeFiltro || cidade === cidadeFiltro)
        && (!canalFiltro || lead.canaldeaquisicao?.origem === canalFiltro)
        && (!edicaoFiltro || lead.edicao === edicaoFiltro);
    }), [leads, cidadeFiltro, canalFiltro, edicaoFiltro]
  );

  const columns = useMemo(() => [
    { header: 'Nome', accessorKey: 'nome' },
    { header: 'WhatsApp', accessorKey: 'whatsappNumber' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Edição', accessorKey: 'edicao' },
    {
      header: 'Cidade',
      accessorFn: row =>
        row.cidade?.cidade === 'Outra cidade' && row.cidade?.seOutra
          ? row.cidade.seOutra
          : row.cidade?.cidade || '-',
    },
    {
      header: 'Canal de aquisição',
      accessorFn: row => row.canaldeaquisicao?.origem || '-',
    },
    {
      header: 'Ações',
      cell: info => (
        <div className={styles.actionBtns}>
          <button onClick={() => onView?.(info.row.original)} title="Visualizar">👁️</button>
          <button onClick={() => onEdit?.(info.row.original)} title="Editar">✏️</button>
          <button onClick={() => onSendMessage?.(info.row.original)} title="Enviar mensagem">💬</button>
        </div>
      ),
    },
  ], [onEdit, onView, onSendMessage, styles.actionBtns]);

  const table = useReactTable({
    data: leadsFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function exportarCSV() {
    const dadosExportar = leads.filter(lead => {
      const cidade = lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra
        ? lead.cidade.seOutra
        : lead.cidade?.cidade;
      return (!cidadeFiltro || cidade === cidadeFiltro);
    }).map(lead => ({
      Nome: lead.nome,
      WhatsApp: lead.whatsappNumber,
      Email: lead.email,
      Edição: lead.edicao,
      Cidade: lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra
        ? lead.cidade.seOutra
        : lead.cidade?.cidade || '-',
      'Canal de aquisição': lead.canaldeaquisicao?.origem || '-',
    }));

    const csv = Papa.unparse(dadosExportar);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `leads_${cidadeFiltro || 'todas'}.csv`);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <select value={cidadeFiltro} onChange={e => setCidadeFiltro(e.target.value)}>
          <option value="">Cidade</option>
          {cidadesUnicas.map(cidade =>
            <option key={cidade} value={cidade}>{cidade}</option>
          )}
        </select>
        <select value={canalFiltro} onChange={e => setCanalFiltro(e.target.value)}>
          <option value="">Canal</option>
          {canaisUnicos.map(canal =>
            <option key={canal} value={canal}>{canal}</option>
          )}
        </select>
        <select value={edicaoFiltro} onChange={e => setEdicaoFiltro(e.target.value)}>
          <option value="">Edição</option>
          {edicoesUnicas.map(ed =>
            <option key={ed} value={ed}>{ed}</option>
          )}
        </select>
        <button onClick={exportarCSV} className={styles.exportBtn}>Exportar CSV</button>
        <button className={styles.toggleBtn} onClick={() => setViewMode(viewMode === 'table' ? 'mini' : 'table')}>
          {viewMode === 'table' ? 'Miniaturas' : 'Tabela'}
        </button>
      </div>

      {viewMode === 'table' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!leadsFiltrados.length && <div className={styles.vazio}>Nenhum lead encontrado</div>}
        </div>
      )}

      {viewMode === 'mini' && (
        <div className={styles.miniGrid}>
          {leadsFiltrados.map(lead => {
            const cidade = lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra
              ? lead.cidade.seOutra
              : lead.cidade?.cidade;
            return (
              <div className={styles.miniCard} key={lead._id?.$oid || lead._id}>
                <div className={styles.cardHeader}>{lead.nome}</div>
                <div className={styles.cardBody}>
                  <div><b>Cidade:</b> {cidade || '-'}</div>
                  <div><b>Edição:</b> {lead.edicao || '-'}</div>
                  <div><b>Canal:</b> {lead.canaldeaquisicao?.origem || '-'}</div>
                  <div><b>WhatsApp:</b> {lead.whatsappNumber || '-'}</div>
                  <div><b>Email:</b> {lead.email || '-'}</div>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => onView?.(lead)} title="Visualizar">👁️</button>
                  <button onClick={() => onEdit?.(lead)} title="Editar">✏️</button>
                  <button onClick={() => onSendMessage?.(lead)} title="Enviar mensagem">💬</button>
                </div>
              </div>
            );
          })}
          {!leadsFiltrados.length && <div className={styles.vazio}>Nenhum lead encontrado</div>}
        </div>
      )}
    </div>
  );
}

export default LeadsM15;
