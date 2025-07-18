import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/UseAuth'; // <-- CORREÇÃO APLICADA

export default function ProtectedRoute({ children }) {
  const { user, authChecked } = useAuth();

  if (!authChecked) return null; // Aguarda checagem

  if (!user) return <Navigate to="/login" replace />; // Redireciona se não logado

  return children; // Permite acesso
}