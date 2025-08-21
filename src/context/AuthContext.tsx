import { createContext } from 'react';

export interface User {
  id?: string;
  usuario?: string;
  nome?: string;
  email?: string;
  role?: string;
  gender?: string;
  project?: string;
  whatsapp?: string;
  iat?: number;
}

export interface AuthContextValue {
  user: User | null;
  authChecked: boolean;
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
