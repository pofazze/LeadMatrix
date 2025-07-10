import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRouteRole({ children, allowedRoles = [] }) {
  const { user, authChecked } = useAuth();

  if (!authChecked) return null;

  if (!user) return <Navigate to="/" />;

  // Adiciona proteção contra undefined
  if (!Array.isArray(allowedRoles) || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}
