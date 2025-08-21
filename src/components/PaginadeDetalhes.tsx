export default function PaginaDeDetalhes({ lead, onBack, onEdit }: { lead: any; onBack: () => void; onEdit: (lead: any) => void; }) {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="text-red-500 hover:underline">&larr; Voltar para a lista</button>
        <button onClick={() => onEdit(lead)} className="rounded-md bg-red-600 px-4 py-2 text-white">Editar Lead</button>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="text-xl font-bold mb-2">Detalhes do Lead: {lead.nome}</h1>
        <p className="text-slate-300 mb-4">Esta é uma página temporária. Em breve, mais informações sobre o lead aparecerão aqui.</p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-5">
          <div><strong>Email:</strong> {lead.email || '-'}</div>
          <div><strong>WhatsApp:</strong> {lead.whatsappNumber || '-'}</div>
          <div><strong>Edição:</strong> {lead.edicao || '-'}</div>
          <div><strong>Cidade:</strong> {lead.cidade?.cidade || '-'}</div>
        </div>
      </div>
    </div>
  );
}
