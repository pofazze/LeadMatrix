// src/components/PaginaDeDetalhes.jsx

import React from 'react';
import styles from './PaginadeDetalhes.module.scss';

// 1. Adicione as props `userRole` e `onEdit`
function PaginaDeDetalhes({ lead, onBack, onEdit, userRole }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          &larr; Voltar para a lista
        </button>

        {/* 2. Adicione o botão de Editar, visível apenas para admins */}
        {userRole === 'admin' && (
          <button onClick={() => onEdit(lead)} className={styles.editButton}>
            Editar Lead
          </button>
        )}
      </div>
      
      <div className={styles.content}>
        <h1>Detalhes do Lead: {lead.nome}</h1>
        <p>
          Esta é uma página temporária. Em breve, mais informações sobre o lead aparecerão aqui.
        </p>
        
        <div className={styles.infoGrid}>
            <div><strong>Email:</strong> {lead.email || '-'}</div>
            <div><strong>WhatsApp:</strong> {lead.whatsappNumber || '-'}</div>
            <div><strong>Edição:</strong> {lead.edicao || '-'}</div>
            <div><strong>Cidade:</strong> {lead.cidade?.cidade || '-'}</div>
        </div>
      </div>
    </div>
  );
}

export default PaginaDeDetalhes;