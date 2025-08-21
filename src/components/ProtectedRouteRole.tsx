import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/UseAuth';
import { ReactNode } from 'react';

export default function ProtectedRouteRole({ children, allowedRoles = [] as string[] }: { children: ReactNode; allowedRoles?: string[] }) {
  const { user, authChecked } = useAuth();

  if (!authChecked) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!Array.isArray(allowedRoles)) {
    console.error("Erro: 'allowedRoles' precisa ser um array de strings.");
    return <Navigate to="/painel" replace />;
  }
  if (!allowedRoles.includes(user.role || '')) {
    console.warn(`[ProtectedRouteRole] Acesso negado. Role "${user.role}" não permitida.`);
    return <Navigate to="/painel" replace />;
  }
  return <>{children}</>;
}
