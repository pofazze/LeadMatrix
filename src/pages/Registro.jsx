import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/UseAuth';
import styles from './Registro.module.scss';
import apiClient from '../api/apiClient'; // Importação atualizada
import Navbar from '../components/Navbar';

const ADMIN_PROJECT = 'admin';

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

  const fetchProjetosRoles = useCallback(async () => {
    setLoadingProjetos(true);
    try {
      // Chamada atualizada para apiClient
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

  // ... (outros useEffects e handlers que não usam axios) ...
  
  const enviarDados = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');
    try {
      // Chamada atualizada para apiClient
      await apiClient.post('/webhook/sendVerificationCode', formData);
      setStep(2);
      setSucesso('Código enviado via WhatsApp.');
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao enviar dados.');
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');
    try {
      // Chamada atualizada para apiClient
      await apiClient.post('/webhook/confirmRegistration', {
        ...formData,
        verificationCode,
      });
      setSucesso('Usuário registrado com sucesso!');
      setStep(1);
      setFormData(getInitialFormData(user));
      setVerificationCode('');
    } catch (err) {
      setErro(err.response?.data?.message || 'Código inválido ou erro ao registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.bg}>
        <form /* ... */ >
          {/* ... (Todo o seu JSX continua o mesmo) ... */}
        </form>
      </div>
    </>
  );
}