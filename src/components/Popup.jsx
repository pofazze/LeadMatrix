import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import styles from "./Popup.module.scss"; // Atualize o import aqui

export default function Popup({
  open,
  onClose,
  title = "Atenção",
  message = "A função de chat está em modo beta, por isso alguns bugs irão aparecer.",
  buttonText = "Entendi, prosseguir",
  icon,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdropWrapper}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className={styles.backdrop} onClick={onClose} />
          {/* Container */}
          <motion.div
            className={styles.popupContainer}
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 340, damping: 22 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Fechar */}
            <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
              <X size={24} />
            </button>
            {/* Ícone */}
            {icon && <div className={styles.icon}>{icon}</div>}
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
            <button className={styles.actionButton} onClick={onClose}>
              {buttonText}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
