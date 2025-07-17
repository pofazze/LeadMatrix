import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LeadsM15 from '../components/LeadsM15';
import PaginaDeDetalhes from '../components/PaginaDeDetalhes'; // 1. Importar o novo componente
import styles from './Painel.module.scss';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Painel() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Estado para controlar a exibição da página de detalhes
  const [leadParaVisualizar, setLeadParaVisualizar] = useState(null);

  useEffect(() => {
    // Só busca os leads se o usuário for do projeto correto
    if (user && ['m15', 'admin'].includes(user.project?.toLowerCase())) {
      setLoading(true);
      axios.get('/webhook/getLeadsM15')
        .then(res => setLeads(Array.isArray(res.data) ? res.data : []))
        .catch(() => setLeads([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false); // Garante que o loading termine se não houver permissão
    }
  }, [user]);

  // Função para lidar com a ação de editar
  const handleEdit = (lead) => {
    console.log('Iniciando edição para o lead:', lead.nome);
    // Aqui você pode adicionar a lógica para abrir um modal de edição ou navegar para uma página de formulário.
  };

  // 3. Lógica de renderização condicional
  // Se um lead foi selecionado para visualização, renderiza a página de detalhes
  if (leadParaVisualizar) {
    return (
      <>
        <Navbar />
        <PaginaDeDetalhes
          lead={leadParaVisualizar}
          userRole={user?.role} // Passa a role para a página de detalhes
          onBack={() => setLeadParaVisualizar(null)}
          onEdit={handleEdit}
        />
      </>
    );
  }

  // Caso contrário, renderiza a tela principal do painel com a lista
  return (
    <div>
      <Navbar />
      <div className={styles.bg}>
        {/* Renderiza a tabela só se o usuário tiver permissão */}
        {user && ['m15', 'admin'].includes(user.project?.toLowerCase()) ? (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ marginBottom: 12, paddingLeft: 20 }}>Leads M15</h2>
            {loading ? (
              <div style={{ padding: '16px 20px' }}>Carregando leads...</div>
            ) : (
              <LeadsM15
                leads={leads}
                userRole={user?.role} // Passa a role para a lista
                onView={(lead) => setLeadParaVisualizar(lead)} // Define qual lead visualizar
                onEdit={handleEdit}
                onSendMessage={(lead) => console.log('Enviando mensagem para:', lead.nome)}
              />
            )}
          </div>
        ) : (
          // Mensagem para usuários sem permissão para ver os leads
          !loading && <div style={{ padding: '16px 20px' }}>Você não tem permissão para visualizar estes leads.</div>
        )}
      </div>
    </div>
  );
}