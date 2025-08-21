import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/UseAuth';
import { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, authChecked } = useAuth();

  if (!authChecked) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
