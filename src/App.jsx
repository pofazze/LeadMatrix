import { BrowserRouter, Routes, Route } from 'react-router-dom';
// 1. A importação do AuthProvider foi corrigida
import AuthProvider from './context/AuthProvider'; 
import Login from './pages/Login';
import Painel from './pages/Painel';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedRouteRole from './components/ProtectedRouteRole';
import Registro from './pages/Registro';
import Disparo from './pages/Disparo';
import './Global.module.scss';
import WhatsappChatPage from './pages/WhatsappChatPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas para Usuários Logados */}
          <Route
            path="/painel"
            element={ <ProtectedRoute> <Painel /> </ProtectedRoute> }
          />
          
          {/* 2. A rota do chat agora está protegida */}
          <Route
            path="/chat"
            element={ <ProtectedRoute> <WhatsappChatPage /> </ProtectedRoute> }
          />

          {/* Rotas Protegidas apenas para Admins */}
          <Route
            path="/registro"
            element={ <ProtectedRouteRole allowedRoles={['admin']}> <Registro /> </ProtectedRouteRole> }
          />
          <Route
            path="/disparo"
            element={ <ProtectedRouteRole allowedRoles={['admin']}> <Disparo /> </ProtectedRouteRole> }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;