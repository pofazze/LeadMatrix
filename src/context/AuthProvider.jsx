import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import apiClient from '../api/apiClient';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const verifyUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await apiClient.get('/webhook/me');
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
      } catch (error) {
        console.error("Falha na verificação do token:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  const login = async (usuario, senha) => {
    const res = await apiClient.post('/webhook/panelauth', { usuario, senha });
    if (!res.data.success || !res.data.token) {
      throw new Error(res.data.message || 'Login falhou');
    }
    localStorage.setItem('token', res.data.token);
    await verifyUser(); // Re-verifica o usuário para atualizar o estado
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = { user, authChecked, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {authChecked ? children : null /* Pode substituir por um spinner de carregamento global */}
    </AuthContext.Provider>
  );
}