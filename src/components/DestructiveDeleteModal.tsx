import React, { useState } from 'react';

export default function DestructiveDeleteModal({ open, onClose, onConfirm, collectionName }: { open: boolean; onClose: () => void; onConfirm: () => void; collectionName: string; }) {
  const [phrase, setPhrase] = useState('');
  const requiredPhrase = 'mudança destrutitva';
  const canDelete = phrase.trim().toLowerCase() === requiredPhrase;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-red-400 mb-4">Confirmação de exclusão destrutiva</h2>
        <p className="mb-4 text-slate-300">Tem certeza que deseja <span className="text-red-400 font-semibold">excluir permanentemente</span> a coleção <span className="font-bold">{collectionName}</span>?<br />
        Esta ação não pode ser desfeita.<br />
        Para confirmar, digite <span className="font-mono bg-zinc-800 px-2 py-1 rounded">mudança destrutitva</span> abaixo:</p>
        <input
          className="w-full border border-zinc-700 rounded px-3 py-2 mb-4 bg-zinc-800 text-slate-200"
          value={phrase}
          onChange={e => setPhrase(e.target.value)}
          placeholder="Digite a frase exata para confirmar"
        />
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" disabled={!canDelete} onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}
