import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.scss';
import { Navigate, useLocation } from 'react-router-dom';

export default function Login() {
  const { user, authChecked, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Redireciona após autenticação, independente da rota ("/" ou "/login")
  if (authChecked && user) {
    return <Navigate to="/painel" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await login(usuario, senha);
      // Não precisa usar window.location.href!
      // O Navigate acima já faz o redirecionamento.
      // (O estado user vai ser atualizado, causando rerender)
    } catch (error) {
      setErro(error.message || 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

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
