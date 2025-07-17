import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Painel from './pages/Painel';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedRouteRole from './components/ProtectedRouteRole';
import Registro from './pages/Registro';
import Disparo from './pages/Disparo';
import './Global.module.scss';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ambas as rotas abrem o login */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Rota protegida (qualquer usuário autenticado) */}
          <Route
            path="/painel"
            element={
              <ProtectedRoute>
                <Painel />
              </ProtectedRoute>
            }
          />

          {/* Rota só para admin */}
          <Route
            path="/registro"
            element={
              <ProtectedRouteRole allowedRoles={['admin']}>
                <Registro />
              </ProtectedRouteRole>
            }
          />

          <Route
            path="/disparo"
            element={
              <ProtectedRouteRole allowedRoles={['admin']}>
                <Disparo />
              </ProtectedRouteRole>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
