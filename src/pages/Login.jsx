import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import styles from './Login.module.scss';
import { Navigate } from 'react-router-dom';

function Login() {
  const { user, authChecked, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  if (authChecked && user) {
    return <Navigate to="/painel" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await login(usuario, senha);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro no login';
      setErro(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className={styles.bg}>
      <form className={styles.form} onSubmit={handleLogin}>
        <h2 className={styles.title}>LeadMatrix</h2>
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
        <div className={styles.copyright}>
          © {new Date().getFullYear()} LeadMatrix
        </div>
      </form>
    </div>
  );
}

export default Login;
