import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, authChecked } = useAuth();

  // Aguarda validação de autenticação (pode colocar spinner aqui)
  if (!authChecked) return null;

  // Não logado? Redireciona pro login
  if (!user) return <Navigate to="/" replace />;

  // Logado? Renderiza o conteúdo protegido
  return children;
}
