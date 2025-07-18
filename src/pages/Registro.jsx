import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/UseAuth';
import styles from './Registro.module.scss';
import axios from 'axios';
import Navbar from '../components/Navbar';

// --- Boas Práticas: Definir valores "mágicos" como constantes ---
const ADMIN_PROJECT = 'admin';

// --- Boas Práticas: Função auxiliar para gerar/resetar o estado do formulário ---
// Isso centraliza a lógica e evita repetição de código.
const getInitialFormData = (currentUser) => ({
  user: '',
  nome: '',
  email: '',
  password: '',
  whatsapp: '',
  datanasc: '',
  gender: '',
  role: '',
  // Define o projeto com base no usuário logado
  projeto: currentUser?.project === ADMIN_PROJECT ? '' : currentUser?.project || '',
});

export default function Registro() {
  const { user } = useAuth();

  // O estado inicial é definido usando a função auxiliar
  const [formData, setFormData] = useState(() => getInitialFormData(user));
  const [projetosRoles, setProjetosRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loadingProjetos, setLoadingProjetos] = useState(true);

  // Efeito para buscar projetos e funções
  useEffect(() => {
    // Cleanup para evitar atualização de estado em componente desmontado
    let isMounted = true;

    async function fetchProjetosRoles() {
      setLoadingProjetos(true);
      try {
        // A configuração global do axios no AuthContext garante que esta requisição
        // já envia o cabeçalho de autorização com o token JWT.
        const res = await axios.get('/webhook/rolesandprojects');
        if (isMounted) {
          setProjetosRoles(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setProjetosRoles([]);
        }
        console.error('Erro ao buscar projetos:', err);
      } finally {
        if (isMounted) {
          setLoadingProjetos(false);
        }
      }
    }

    if (user) {
      fetchProjetosRoles();
    }

    // A função de limpeza é executada quando o componente é desmontado
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Efeito simplificado para resetar o formulário quando o usuário muda
  useEffect(() => {
    // Se o usuário mudar (login/logout), reseta o formulário para o estado inicial
    setFormData(getInitialFormData(user));
  }, [user]);

  // Efeito para atualizar as funções disponíveis quando o projeto muda
  useEffect(() => {
    if (!formData.projeto || !projetosRoles.length) {
      setAvailableRoles([]);
      return;
    }
    const projetoObj = projetosRoles.find(p => p.ProjectName === formData.projeto);
    setAvailableRoles(projetoObj ? projetoObj.roles : []);
  }, [formData.projeto, projetosRoles]);

  const handleProjetoChange = (e) => {
    const projeto = e.target.value;
    setFormData(prev => ({
      ...prev,
      projeto,
      role: '', // Limpa função ao trocar projeto
    }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErro('');
    setSucesso('');
  };

  const enviarDados = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);
    try {
      // Graças ao AuthContext, esta chamada já envia o token JWT automaticamente.
      await axios.post('/webhook/sendVerificationCode', formData);
      setStep(2);
      setSucesso('Código enviado via WhatsApp.');
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao enviar dados. Verifique as informações e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);
    try {
      // O JWT também é enviado automaticamente aqui.
      await axios.post('/webhook/confirmRegistration', {
        ...formData,
        verificationCode,
        // O campo 'createdBy' foi removido daqui. O backend agora extrai
        // essa informação diretamente do token JWT, o que é mais seguro.
      });
      setSucesso('Usuário registrado com sucesso!');
      setStep(1);
      // Usa a função auxiliar para resetar o formulário
      setFormData(getInitialFormData(user));
      setVerificationCode('');
    } catch (err) {
      setErro(err.response?.data?.message || 'Código inválido ou erro ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de `disabled` mais robusta para o botão
  const isSubmitDisabled =
    loading ||
    loadingProjetos ||
    (step === 1 && (!formData.role || !formData.projeto)) ||
    (step === 1 && formData.projeto && availableRoles.length === 0);

  return (
    <>
    <Navbar />
    <div className={styles.bg}>
      <form className={styles.form} onSubmit={step === 1 ? enviarDados : verificarCodigo}>
        <h2 className={styles.title}>
          {step === 1 ? 'Registrar Novo Usuário' : 'Verificar Código'}
        </h2>

        {step === 1 && (
          <>
            
            <div className={styles.inputgroup}>
              <input name="user" placeholder="Nome de usuário" value={formData.user} onChange={handleChange} required className={styles.input} autoComplete="username" />
              <input name="nome" placeholder="Nome completo" value={formData.nome} onChange={handleChange} required className={styles.input} autoComplete="name" />
            </div>
            <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required className={styles.input} autoComplete="email" />
            <input name="password" type="password" placeholder="Senha" value={formData.password} onChange={handleChange} required minLength={4} className={styles.input} autoComplete="new-password" />
            <input name="whatsapp" placeholder="WhatsApp (apenas números, com DDD)" value={formData.whatsapp} onChange={handleChange} required pattern="\d{10,14}" className={styles.input} />
            <input name="datanasc" type="date" placeholder="Data de nascimento" value={formData.datanasc} onChange={handleChange} required className={styles.input} />
            <select name="gender" value={formData.gender} onChange={handleChange} required className={styles.input}>
              <option value="">Gênero</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>

            {/* PROJETO */}
            {user?.project === ADMIN_PROJECT ? (
              <select name="projeto" value={formData.projeto} onChange={handleProjetoChange} required className={styles.input} disabled={loadingProjetos || projetosRoles.length === 0}>
                <option value="">Selecione o Projeto</option>
                {projetosRoles.map(p => (
                  <option key={p.ProjectName} value={p.ProjectName}>
                    {p.ProjectName === ADMIN_PROJECT ? "Administrador Global" : p.ProjectName}
                  </option>
                ))}
              </select>
            ) : (
              <input name="projeto" value={user?.project || ''} readOnly className={styles.input} style={{ background: "#f5f5f5", cursor: "not-allowed" }} />
            )}

            {/* FUNÇÃO */}
            <select name="role" value={formData.role} onChange={handleChange} required className={styles.input} disabled={!formData.projeto || availableRoles.length === 0}>
              <option value="">Selecione a Função</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>

            {loadingProjetos && (
              <div className={styles.info}>Carregando projetos...</div>
            )}
          </>
        )}

        {step === 2 && (
          <input name="verificationCode" placeholder="Código de verificação" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required className={styles.input} />
        )}

        {erro && <div className={styles.error}>{erro}</div>}
        {sucesso && <div className={styles.success}>{sucesso}</div>}

        <button type="submit" disabled={isSubmitDisabled} className={styles.button}>
          {loading
            ? (step === 1 ? 'Enviando...' : 'Verificando...')
            : (step === 1 ? 'Enviar código' : 'Confirmar registro')}
        </button>
      </form>
    </div>
    </>
  );
}