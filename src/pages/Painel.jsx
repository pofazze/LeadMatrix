import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LeadsM15 from '../components/LeadsM15';
import styles from './Painel.module.scss';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Painel() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Só busca se for dos projetos corretos
    if (user && ['m15', 'admin'].includes(user.project?.toLowerCase())) {
      setLoading(true);
      axios.get('/webhook/getLeadsM15')
        .then(res => setLeads(Array.isArray(res.data) ? res.data : []))
        .catch(() => setLeads([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div>
      <Navbar />
      <div className={styles.bg}>
        <div className={styles.container}>
          <div className={styles.title}>
            Bem-vindo, {user?.usuario || 'Usuário'}!
          </div>
          <div className={styles.subtitle}>Sua role: {user?.role}</div>
          <div className={styles.subtitle}>Gender: {user?.gender}</div>
        </div>

        {/* Renderiza a tabela só se for m15 OU admin */}
        {user && ['m15', 'admin'].includes(user.project?.toLowerCase()) && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ marginBottom: 12 }}>Leads M15</h2>
            {loading ? (
              <div style={{ padding: 16 }}>Carregando leads...</div>
            ) : (
              <LeadsM15 leads={leads} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
