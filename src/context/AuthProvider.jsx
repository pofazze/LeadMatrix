import { useState, useEffect } from 'react';
import axios from 'axios';
// 1. Importa o AuthContext do arquivo separado
import { AuthContext } from './AuthContext';

// 2. Apenas o componente é exportado deste arquivo
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/webhook/me')
        .then(res => {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          setUser({
            id: data.id,
            usuario: data.usuario,
            role: data.role || 'user',
            gender: data.gender,
            project: data.project,
            whatsapp: data.whatsapp,
            iat: data.iat,
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
    if (!res.data.success || !res.data.token) {
      throw new Error(res.data.message || 'Login falhou');
    }
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    const meRes = await axios.get('/webhook/me');
    const data = Array.isArray(meRes.data) ? meRes.data[0] : meRes.data;
    setUser({
      id: data.id,
      usuario: data.usuario,
      role: data.role || 'user',
      gender: data.gender,
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
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authChecked }}>
      {children}
    </AuthContext.Provider>
  );
}