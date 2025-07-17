import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('[AuthContext] Token no localStorage:', token);

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/webhook/me')
        .then(res => {
          // Garante que retorna objeto, não array
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          console.log('[AuthContext] Dados do /me:', data);
          setUser({
            id: data.id,
            usuario: data.usuario,
            role: data.role || 'user',
            gender: data.gender, // <-- trocado aqui!
            project: data.project,
            whatsapp: data.whatsapp,
            iat: data.iat,
          });
        })
        .catch(err => {
          console.error('[AuthContext] Erro ao buscar /me:', err);
          setUser(null);
        })
        .finally(() => {
          setAuthChecked(true);
          console.log('[AuthContext] Finalizou checagem de auth');
        });
    } else {
      setAuthChecked(true);
      console.log('[AuthContext] Nenhum token, liberou authChecked');
    }
  }, []);

  const login = async (usuario, senha) => {
    setUser(null);
    setAuthChecked(false);
    console.log('[AuthContext] Iniciando login...');

    const res = await axios.post('/webhook/panelauth', { usuario, senha });

    if (!res.data.success || !res.data.token) {
      throw new Error(res.data.message || 'Login falhou');
    }

    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    console.log('[AuthContext] Token salvo após login:', res.data.token);

    const meRes = await axios.get('/webhook/me');
    const data = Array.isArray(meRes.data) ? meRes.data[0] : meRes.data;
    console.log('[AuthContext] Dados retornados após login:', data);

    setUser({
      id: data.id,
      usuario: data.usuario,
      role: data.role || 'user',
      gender: data.gender, // <-- trocado aqui!
      project: data.project,
      whatsapp: data.whatsapp,
      iat: data.iat,
    });
    setAuthChecked(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setAuthChecked(true);
    console.log('[AuthContext] Logout realizado');
  };

  useEffect(() => {
    console.log('[AuthContext] User atualizado:', user);
    console.log('[AuthContext] AuthChecked:', authChecked);
  }, [user, authChecked]);

  return (
    <AuthContext.Provider value={{ user, login, logout, authChecked }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
