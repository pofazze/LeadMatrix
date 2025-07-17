import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRouteRole({ children, allowedRoles = [] }) {
  const { user, authChecked } = useAuth();

  // Aguarda validação de autenticação (pode colocar spinner aqui)
  if (!authChecked) return null;

  // Não logado? Redireciona pro login
  if (!user) return <Navigate to="/" replace />;

  // Garante que allowedRoles é um array de strings
  if (!Array.isArray(allowedRoles)) {
    console.error("Erro: 'allowedRoles' precisa ser um array de strings.");
    return <Navigate to="/" replace />;
  }

  // Se a role não estiver permitida, redireciona pro login
  if (!allowedRoles.includes(user.role)) {
    // Debug opcional:
    console.warn(`[ProtectedRouteRole] Role "${user.role}" não permitida. Allowed:`, allowedRoles);
    return <Navigate to="/" replace />;
  }

  // Logado e autorizado? Renderiza o conteúdo protegido
  return children;
}
