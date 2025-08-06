import { useAuth } from '../hooks/UseAuth';
import Navbar from '../components/Navbar';
import LeadsM15 from '../components/LeadsM15';
import PaginaDeDetalhes from '../components/PaginadeDetalhes';
import styles from './Painel.module.scss';
import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export default function Painel() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadParaVisualizar, setLeadParaVisualizar] = useState(null);

  useEffect(() => {
    if (user && ['m15', 'admin'].includes(user.project?.toLowerCase())) {
      setLoading(true);
      apiClient.get('/webhook/getLeadsM15')
        .then(res => {
          // --- LÓGICA DE EXTRAÇÃO DE DADOS ATUALIZADA E MAIS SEGURA ---
          let dadosDosLeads = [];
          if (Array.isArray(res.data)) {
            // Verifica se a estrutura é [{ data: [...] }]
            if (res.data.length > 0 && res.data[0] && Array.isArray(res.data[0].data)) {
              dadosDosLeads = res.data[0].data;
            } else {
              // Se não for, assume que a estrutura é [...] (a própria lista de leads)
              dadosDosLeads = res.data;
            }
          }
          setLeads(dadosDosLeads);
        })
        .catch((err) => {
            console.error("Erro ao buscar leads:", err);
            // Garante que 'leads' seja sempre um array em caso de erro
            setLeads([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleEdit = (lead) => {
    // Lógica para editar o lead
  };

  if (leadParaVisualizar) {
    return (
      <>
        <Navbar />
        <PaginaDeDetalhes
          lead={leadParaVisualizar}
          userRole={user?.role}
          onBack={() => setLeadParaVisualizar(null)}
          onEdit={handleEdit}
        />
      </>
    );
  }

  return (
    <div>
      <Navbar />
      <div className={styles.bg}>
        {user && ['m15', 'admin'].includes(user.project?.toLowerCase()) ? (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ marginBottom: 12, paddingLeft: 20 }}>Leads M15</h2>
            {loading ? (
              <div style={{ padding: '16px 20px' }}>Carregando leads...</div>
            ) : (
              // O componente LeadsM15 agora receberá um array, mesmo que vazio.
              <LeadsM15
                leads={leads}
                userRole={user?.role}
                onView={(lead) => setLeadParaVisualizar(lead)}
                onEdit={handleEdit}
                onSendMessage={(lead) => { /* lógica de envio de mensagem */ }}
              />
            )}
          </div>
        ) : (
          !loading && <div style={{ padding: '16px 20px' }}>Você não tem permissão para visualizar estes leads.</div>
        )}
      </div>
    </div>
  );
}