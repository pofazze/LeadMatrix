import React, { useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { AuthContext, User } from './AuthContext';
import apiClient from '../api/apiClient';

export default function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const verifyUser = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/refresh'); // rotate access token cookie if needed
    } catch {}
    try {
      const res = await apiClient.get('/api/auth/me');
      setUser({
        id: res.data.id,
        usuario: res.data.usuario,
        nome: res.data.nome,
        email: res.data.email,
        role: res.data.role,
        gender: res.data.gender,
        project: res.data.project,
        whatsapp: res.data.whatsapp,
        iat: res.data.iat
      });
    } catch (error) {
      setUser(null);
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => { verifyUser(); }, [verifyUser]);

  const login = async (usuario: string, senha: string) => {
  try { await apiClient.get('/api/auth/csrf'); } catch {}
  await apiClient.post('/api/auth/login', { usuario, senha });
    await verifyUser();
  };

  const logout = async () => {
    try { await apiClient.post('/api/auth/logout'); } catch {}
    setUser(null);
  };

  const value = { user, authChecked, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {authChecked ? children : null}
    </AuthContext.Provider>
  );
}
