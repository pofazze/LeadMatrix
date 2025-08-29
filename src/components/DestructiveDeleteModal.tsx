import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function DestructiveDeleteModal({ open, onClose, onConfirm, collectionName }: { open: boolean; onClose: () => void; onConfirm: () => void; collectionName: string; }) {
  const [phrase, setPhrase] = useState('');
  const requiredPhrase = 'mudança destrutitva';
  const canDelete = phrase.trim().toLowerCase() === requiredPhrase;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-51 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content max-w-md w-full p-8 relative"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-4 top-4 text-slate-400 hover:text-red-400 transition-colors"
                onClick={onClose}
              >
                <X size={20} />
              </motion.button>
              
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"
                >
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-red-400 mb-4"
                >
                  Confirmação de Exclusão
                </motion.h2>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <p className="text-slate-300 text-center leading-relaxed">
                  Tem certeza que deseja <span className="text-red-400 font-semibold">excluir permanentemente</span> a coleção{' '}
                  <span className="font-bold text-blue-300">{collectionName}</span>?
                </p>
                
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-300 text-sm text-center">
                    ⚠️ Esta ação não pode ser desfeita
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm text-center">
                    Para confirmar, digite{' '}
                    <span className="font-mono bg-red-900/30 px-2 py-1 rounded text-red-300">
                      mudança destrutitva
                    </span>
                  </p>
                  <input
                    className="input w-full text-center"
                    value={phrase}
                    onChange={e => setPhrase(e.target.value)}
                    placeholder="Digite a frase exata para confirmar"
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3 mt-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-ghost flex-1"
                  onClick={onClose}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: canDelete ? 1.05 : 1 }}
                  whileTap={{ scale: canDelete ? 0.95 : 1 }}
                  className="btn btn-danger flex-1"
                  disabled={!canDelete}
                  onClick={onConfirm}
                >
                  Excluir Permanentemente
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

        </div>
      </div>
    </div>
  );
}
