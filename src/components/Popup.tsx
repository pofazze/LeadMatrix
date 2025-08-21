import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

export default function Popup({
  open,
  onClose,
  title = 'Atenção',
  message = 'A função de chat está em modo beta, por isso alguns bugs irão aparecer.',
  buttonText = 'Entendi, prosseguir',
  icon,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  icon?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[rgba(20,20,20,0.78)] backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-[0_6px_48px_rgba(0,0,0,0.55)]"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            onClick={e => e.stopPropagation()}
          >
            <button className="absolute right-5 top-4 text-slate-200 hover:text-red-500" onClick={onClose} aria-label="Fechar">
              <X size={24} />
            </button>
            {icon && <div className="mb-1 text-red-500">{icon}</div>}
            <h2 className="mb-1 text-center text-2xl font-bold text-slate-100">{title}</h2>
            <p className="mb-2 text-center text-slate-200">{message}</p>
            <button className="mt-2 w-full rounded-xl bg-red-600 py-3 font-semibold text-white" onClick={onClose}>
              {buttonText}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
