import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Buscar os dados do usuário
      axios.get('/api/me')
        .then(res => {
          const userData = res.data;
          setUser({
            id: userData.id,
            usuario: userData.usuario,
            role: userData.role || 'user', // fallback para user
          });
        })
        .catch(() => setUser(null))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const login = async (usuario, senha) => {
    const res = await axios.post('/webhook/panelauth', { usuario, senha });

    if (!res.data.success) {
      throw new Error(res.data.message || 'Login falhou');
    }

    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

    // Buscar os dados do usuário após login
    const me = await axios.get('/api/me');
    setUser({
      id: me.data.id,
      usuario: me.data.usuario,
      role: me.data.role || 'user',
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authChecked }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
