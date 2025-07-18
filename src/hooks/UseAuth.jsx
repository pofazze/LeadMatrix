import { useContext } from 'react';
// Importa o AuthContext do novo arquivo dedicado
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  return useContext(AuthContext);
}