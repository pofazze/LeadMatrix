import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/UseAuth';
import styles from './Registro.module.scss';
import apiClient from '../api/apiClient'; // Agora usa apiClient
import Navbar from '../components/Navbar';

// --- Boas Práticas: Definir valores "mágicos" como constantes ---
const ADMIN_PROJECT = 'admin';

// --- Função auxiliar para gerar/resetar o estado do formulário ---
const getInitialFormData = (currentUser) => ({
  user: '',
  nome: '',
  email: '',
  password: '',
  whatsapp: '',
  datanasc: '',
  gender: '',
  role: '',
  projeto: currentUser?.project === ADMIN_PROJECT ? '' : currentUser?.project || '',
});

export default function Registro() {
  const { user } = useAuth();

  const [formData, setFormData] = useState(() => getInitialFormData(user));
  const [projetosRoles, setProjetosRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loadingProjetos, setLoadingProjetos] = useState(true);

  // Efeito para buscar projetos e funções usando apiClient
  const fetchProjetosRoles = useCallback(async () => {
    setLoadingProjetos(true);
    try {
      const res = await apiClient.get('/webhook/rolesandprojects');
      setProjetosRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setProjetosRoles([]);
      console.error('Erro ao buscar projetos:', err);
    } finally {
      setLoadingProjetos(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjetosRoles();
    }
  }, [user, fetchProjetosRoles]);

  // Efeito para resetar o formulário quando o usuário muda (login/logout)
  useEffect(() => {
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

  // Handlers
  const handleProjetoChange = (e) => {
    const projeto = e.target.value;
    setFormData(prev => ({
      ...prev,
      projeto,
      role: '', // Limpa função ao trocar projeto
    }));
    setErro('');
    setSucesso('');
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
      await apiClient.post('/webhook/sendVerificationCode', formData);
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
      await apiClient.post('/webhook/confirmRegistration', {
        ...formData,
        verificationCode,
      });
      setSucesso('Usuário registrado com sucesso!');
      setStep(1);
      setFormData(getInitialFormData(user));
      setVerificationCode('');
    } catch (err) {
      setErro(err.response?.data?.message || 'Código inválido ou erro ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de disabled robusta para o botão
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
