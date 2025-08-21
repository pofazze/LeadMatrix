import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Perfil from './pages/Perfil';
import PerfilEdit from './pages/PerfilEdit';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedRouteRole from './components/ProtectedRouteRole';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redireciona raiz para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Login público */}
        <Route path="/login" element={<Login />} />
        {/* Painel protegido */}
        <Route
          path="/painel"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        {/* Registro somente admins */}
        <Route
          path="/registro"
          element={
            <ProtectedRouteRole allowedRoles={["admin"]}>
              <Registro />
            </ProtectedRouteRole>
          }
        />
  <Route path="/perfil" element={<Perfil />} />
  <Route path="/perfil-edit" element={<PerfilEdit />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
