import React from 'react';
import { useAuth } from '../hooks/UseAuth';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  console.log('user em Navbar:', user);

  const canRegister = user && user.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={styles.nav}>
      <Link to="/painel" className={styles.link}>
        <div className={styles.brand}>LeadMatrix</div>
      </Link>

      <div style={{ display: 'flex', flexFlow: 'row nowrap', alignItems: 'center', gap: '1em' }}>
        {/* {user && (
          <span style={{ marginRight: 12 }}>
            {user.usuario} {user.gender ? `(${user.gender})` : ''}
          </span>
        )} */}

        {canRegister && (
          <Link to="/registro" className={styles.link}>
            Registrar usuário
          </Link>
        )}
        {canRegister && (
          <Link to="/Disparo" className={styles.link}>
            Disparar mensagens
          </Link>
        )}
        {canRegister && (
          <Link to="/chat" className={styles.link}>
            Chat
          </Link>
        )}

        <button onClick={handleLogout} className={styles.button}>
          Sair
        </button>
      </div>
    </nav>
  );
}
