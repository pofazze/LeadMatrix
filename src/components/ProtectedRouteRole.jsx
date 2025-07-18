import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // <-- CORREÇÃO APLICADA

export default function ProtectedRouteRole({ children, allowedRoles = [] }) {
  const { user, authChecked } = useAuth();

  if (!authChecked) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (!Array.isArray(allowedRoles)) {
    console.error("Erro: 'allowedRoles' precisa ser um array de strings.");
    return <Navigate to="/painel" replace />; // Redireciona para o painel em caso de erro
  }

  if (!allowedRoles.includes(user.role)) {
    console.warn(`[ProtectedRouteRole] Acesso negado. Role "${user.role}" não permitida.`);
    return <Navigate to="/painel" replace />; // Redireciona se não tiver a role
  }

  return children; // Permite acesso
}