import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Registro.module.scss';
import axios from 'axios';

export default function Registro() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const enviarDados = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    setSucesso('');

    try {
      await axios.post('/webhook/sendVerificationCode', formData);
      setStep(2);
      setSucesso('Código enviado via WhatsApp.');
    } catch {
      setErro('Erro ao enviar dados. Verifique as informações e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    setSucesso('');

    try {
      await axios.post('/webhook/confirmRegistration', {
        ...formData,
        verificationCode,
        createdBy: user?.usuario || 'admin', // opcional
      });
      setSucesso('Usuário registrado com sucesso!');
      setStep(1);
      setFormData({ nome: '', email: '', telefone: '' });
      setVerificationCode('');
    } catch {
      setErro('Código inválido ou erro ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.bg}>
      <form className={styles.form} onSubmit={step === 1 ? enviarDados : verificarCodigo}>
        <h2 className={styles.title}>
          {step === 1 ? 'Registrar Novo Usuário' : 'Verificar Código'}
        </h2>

        {step === 1 && (
          <>
            <input
              name="nome"
              placeholder="Nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className={styles.input}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
            />
            <input
              name="telefone"
              placeholder="Telefone com DDD"
              value={formData.telefone}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </>
        )}

        {step === 2 && (
          <input
            name="verificationCode"
            placeholder="Código de verificação"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            className={styles.input}
          />
        )}

        {erro && <div className={styles.error}>{erro}</div>}
        {sucesso && <div className={styles.success}>{sucesso}</div>}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading
            ? step === 1 ? 'Enviando...' : 'Verificando...'
            : step === 1 ? 'Enviar código' : 'Confirmar registro'}
        </button>
      </form>
    </div>
  );
}
