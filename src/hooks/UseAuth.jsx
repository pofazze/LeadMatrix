import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Hook customizado para consumir o contexto de forma limpa.
export function useAuth() {
  return useContext(AuthContext);
}