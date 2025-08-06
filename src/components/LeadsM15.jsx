import React, { useMemo, useState, Fragment } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Popover, Transition } from '@headlessui/react';
import styles from './LeadsM15.module.scss';
import CustomDropdown from './CustomDropdown.jsx';

// Componente de Ícone
const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

function LeadsM15({ leads = [], onEdit, onView, onSendMessage }) {
  // Estados para os filtros e visualização
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [canalFiltro, setCanalFiltro] = useState('');
  const [edicaoFiltro, setEdicaoFiltro] = useState('');
  const [gestorFiltro, setGestorFiltro] = useState('');
  const [viewMode, setViewMode] = useState('table');
  
  // Estado e lógica para o dropdown de exportação
  const [isExportMenuOpen, setExportMenuOpen] = useState(false);
  let exportTimeout;

  const handleExportMenuEnter = () => {
    clearTimeout(exportTimeout);
    setExportMenuOpen(true);
  };
  const handleExportMenuLeave = () => {
    exportTimeout = setTimeout(() => {
      setExportMenuOpen(false);
    }, 200);
  };

  // Memoização para extrair opções únicas para os filtros
  const cidadesUnicas = useMemo(() =>
    Array.from(new Set(leads.map(lead =>
      lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra
        ? lead.cidade.seOutra
        : lead.cidade?.cidade
    ).filter(Boolean))).sort(),
    [leads]
  );

  const canaisUnicos = useMemo(() =>
    Array.from(new Set(leads.map(lead =>
      lead.canaldeaquisicao?.origem
    ).filter(Boolean))).sort(),
    [leads]
  );

  const edicoesUnicas = useMemo(() =>
    Array.from(new Set(leads.map(lead => lead.edicao).filter(Boolean))).sort(),
    [leads]
  );

  // Lógica atualizada para criar uma lista de gestores únicos e normalizados
  const gestoresUnicos = useMemo(() => {
    const gestorMap = new Map();
    leads.forEach(lead => {
      const gestorOriginal = lead.canaldeaquisicao?.nomeDoGestor;
      // Verifica se o gestor existe e não é apenas uma string de espaços
      if (gestorOriginal && gestorOriginal.trim()) {
        const gestorNormalizado = gestorOriginal.trim().toLowerCase();
        if (!gestorMap.has(gestorNormalizado)) {
          // Armazena a versão normalizada como chave e a primeira versão original (sem espaços) como valor
          gestorMap.set(gestorNormalizado, gestorOriginal.trim());
        }
      }
    });
    return Array.from(gestorMap.values()).sort();
  }, [leads]);

  // Lógica de filtragem atualizada para usar a normalização
  const leadsFiltrados = useMemo(() =>
    leads.filter(lead => {
      const cidade = lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra
        ? lead.cidade.seOutra
        : lead.cidade?.cidade;
      
      const gestorDoLead = lead.canaldeaquisicao?.nomeDoGestor;

      // Comparação normalizada: compara o valor do lead (normalizado) com o valor do filtro (normalizado)
      const gestorPassaFiltro = !gestorFiltro || (gestorDoLead && gestorDoLead.trim().toLowerCase() === gestorFiltro.toLowerCase());

      return (!cidadeFiltro || cidade === cidadeFiltro)
        && (!canalFiltro || lead.canaldeaquisicao?.origem === canalFiltro)
        && (!edicaoFiltro || lead.edicao === edicaoFiltro)
        && gestorPassaFiltro;
    }),
    [leads, cidadeFiltro, canalFiltro, edicaoFiltro, gestorFiltro]
  );

  // Função para exportar os dados filtrados para CSV ou Excel
  const exportarPlanilha = (formato) => {
    const dadosParaExportar = leadsFiltrados.map(lead => ({
      'Nome': lead.nome,
      'WhatsApp': lead.whatsappNumber,
      'Email': lead.email,
      'Edição': lead.edicao,
      'Cidade': lead.cidade?.cidade === 'Outra cidade' && lead.cidade?.seOutra
        ? lead.cidade.seOutra
        : lead.cidade?.cidade || '-',
      'Canal de aquisição': lead.canaldeaquisicao?.origem || '-',
      // Limpa os dados do gestor na exportação também
      'Nome do Gestor': lead.canaldeaquisicao?.nomeDoGestor?.trim() || '-',
    }));

    if (formato === 'csv') {
      const csv = Papa.unparse(dadosParaExportar);
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'leads_filtrados.csv');
    }

    if (formato === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dadosParaExportar);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      saveAs(blob, 'leads_filtrados.xlsx');
    }
    setExportMenuOpen(false);
  };

  // Definição das colunas para a tabela
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
      header: 'Nome do Gestor',
      // Limpa o dado para exibição na tabela também
      accessorFn: row => row.canaldeaquisicao?.nomeDoGestor?.trim() || '-',
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
  ], [onEdit, onView, onSendMessage]);

  // Instância da tabela
  const table = useReactTable({
    data: leadsFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        {/* Filtros personalizados */}
        <CustomDropdown
          label="Cidade"
          value={cidadeFiltro}
          options={cidadesUnicas}
          onSelect={setCidadeFiltro}
        />
        <CustomDropdown
          label="Canal"
          value={canalFiltro}
          options={canaisUnicos}
          onSelect={setCanalFiltro}
        />
        <CustomDropdown
          label="Edição"
          value={edicaoFiltro}
          options={edicoesUnicas}
          onSelect={setEdicaoFiltro}
        />
        <CustomDropdown
          label="Gestor"
          value={gestorFiltro}
          options={gestoresUnicos}
          onSelect={setGestorFiltro}
        />

        {/* Dropdown de Exportação */}
        <Popover className={styles.dropdown}>
          <div onMouseEnter={handleExportMenuEnter} onMouseLeave={handleExportMenuLeave}>
            <Popover.Button as="div" className={`${styles.dropdownBtn} ${styles.exportBtn}`}>
              Baixar Planilha
              <ChevronDownIcon className={styles.dropdownIcon} aria-hidden="true" />
            </Popover.Button>
            <Transition
              show={isExportMenuOpen}
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel static className={`${styles.dropdownMenu} ${styles.exportMenu}`}>
                <div className={styles.dropdownItemsWrapper}>
                  <button className={styles.dropdownItem} onClick={() => exportarPlanilha('csv')}>CSV</button>
                  <button className={styles.dropdownItem} onClick={() => exportarPlanilha('excel')}>Excel (.xlsx)</button>
                </div>
              </Popover.Panel>
            </Transition>
          </div>
        </Popover>

        {/* Botão de alternar visualização */}
        <button className={styles.toggleBtn} onClick={() => setViewMode(viewMode === 'table' ? 'mini' : 'table')}>
          {viewMode === 'table' ? 'Tabela' : 'Miniaturas'}
        </button>
      </div>

      {/* Renderização condicional da Tabela */}
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

      {/* Renderização condicional das Miniaturas */}
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
                  <div><b>Gestor:</b> {lead.canaldeaquisicao?.nomeDoGestor?.trim() || '-'}</div>
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