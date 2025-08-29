import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ViewLeads from './viewleads';
import DestructiveDeleteModal from './DestructiveDeleteModal';
import axios from 'axios';
import { Upload, Trash2, Database } from 'lucide-react';

export default function LeadsManager() {
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
        let allowed = res.data.collections || [];
        setCollections(allowed);
        // Sempre seleciona a primeira coleção permitida
        if (allowed.length === 1) {
          setSelectedCollection(allowed[0]);
        } else if (!allowed.includes(selectedCollection)) {
          setSelectedCollection(allowed[0] || '');
        }
        setCanManage(res.data.canManageCollections ?? (allowed && allowed.includes('m15leads') === false));
      })
      .catch(() => setError('Erro ao listar coleções'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCollection) return;
    // Não tente buscar coleções não permitidas
    if (!collections.includes(selectedCollection)) return;
    setLoading(true);
    axios.get(`/api/leads?collection=${selectedCollection}`)
      .then(res => setLeads(res.data.items || []))
      .catch(() => setError('Erro ao carregar leads'))
      .finally(() => setLoading(false));
  }, [selectedCollection, collections]);

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header com controles */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-400" />
              <label className="text-sm font-medium text-blue-300">Coleção:</label>
            </div>
            <select
              className="input min-w-[200px]"
              value={selectedCollection}
              onChange={e => setSelectedCollection(e.target.value)}
            >
              {collections.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          
          {canManage && (
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImport}
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel/CSV
              </motion.button>
              {selectedCollection && selectedCollection !== 'm15leads' && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-danger" 
                  onClick={() => handleDelete(selectedCollection)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir coleção
                </motion.button>
              )}
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Conteúdo principal */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card p-12 text-center"
          >
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando leads...</p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ViewLeads leads={leads} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <DestructiveDeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        collectionName={collectionToDelete || ''}
      />
    </motion.div>
  );
}
