import { useState } from 'react';
import { useAuth } from '../hooks/UseAuth';
import styles from './Login.module.scss';
import { Navigate } from 'react-router-dom';
import logo from './images/logo.svg';

export default function Login() {
  const { user, authChecked, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  if (authChecked && user) {
    return <Navigate to="/painel" replace />;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await login(usuario, senha);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro no login';
      setErro(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) return null;

  return (
    <div className={styles.bg}>
      <div className={styles.formDiv}>
        <img src={logo} alt="LeadMatrix" />
        <form className={styles.form} onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Nome de usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className={styles.input}
          />
          {erro && <div className={styles.error}>{erro}</div>}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className={styles.copyright}>© {new Date().getFullYear()} LeadMatrix</div>
      </div>
      <div className={styles.imageDiv}>
        <h1>teste</h1>
      </div>
    </div>
  );
}
