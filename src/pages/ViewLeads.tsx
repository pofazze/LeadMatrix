
import React, { useEffect, useState, useRef } from 'react';
import ViewLeads from '../components/viewleads';
import DestructiveDeleteModal from '../components/DestructiveDeleteModal';
import axios from 'axios';

export default function ViewLeadsPage() {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios.get('/api/collections', { validateStatus: () => true })
      .then(res => {
        setCollections(res.data.collections || []);
        if (res.data.collections?.length && !selectedCollection) {
          setSelectedCollection(res.data.collections[0]);
        }
        // Backend pode retornar permissão no futuro, por enquanto, heurística:
        setCanManage(res.data.canManageCollections ?? (res.data.collections && res.data.collections.includes('m15leads') === false));
      })
      .catch(() => setError('Erro ao listar coleções'));
  }, []);

  useEffect(() => {
    if (!selectedCollection) return;
    setLoading(true);
    axios.get(`/api/leads?collection=${selectedCollection}`)
      .then(res => setLeads(res.data.items || []))
      .catch(() => setError('Erro ao carregar leads'))
      .finally(() => setLoading(false));
  }, [selectedCollection]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collectionName', file.name.replace(/\.[^.]+$/, ''));
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/collections/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCollections(c => [...c, res.data.collection]);
      setSelectedCollection(res.data.collection);
    } catch (err: any) {
      setError('Erro ao importar arquivo');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (name: string) => {
    setCollectionToDelete(name);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!collectionToDelete) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/collections/${collectionToDelete}`);
      setCollections(c => c.filter(n => n !== collectionToDelete));
      if (selectedCollection === collectionToDelete) setSelectedCollection(collections[0] || '');
    } catch (err: any) {
      setError('Erro ao deletar coleção');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setCollectionToDelete(null);
    }
  };

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <label className="font-semibold text-slate-200">Coleção:</label>
        <select
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-slate-200"
          value={selectedCollection}
          onChange={e => setSelectedCollection(e.target.value)}
        >
          {collections.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {canManage && (
          <>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>Importar Excel/CSV</button>
            {selectedCollection && selectedCollection !== 'm15leads' && (
              <button className="btn btn-danger" onClick={() => handleDelete(selectedCollection)}>Excluir coleção</button>
            )}
          </>
        )}
      </div>
      {loading ? <div>Carregando leads...</div> : <ViewLeads leads={leads} />}
      <DestructiveDeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        collectionName={collectionToDelete || ''}
      />
    </div>
  );
}
