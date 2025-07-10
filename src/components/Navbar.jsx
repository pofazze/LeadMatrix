import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.scss';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>LeadMatrix</div>
      <button onClick={handleLogout} className={styles.button}>
        Sair
      </button>
      {canRegister && (
        <Link to="/registro" className={styles.link}>
          Registrar usuário
        </Link>
      )}
    </nav>
  );
}
