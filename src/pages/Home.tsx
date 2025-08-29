import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/UseAuth';
import { useNavigate } from 'react-router-dom';
import WhatsappConnect from '../components/WhatsappConnect';
import DisparoWPP from '../components/DisparoWPP';
import LeadsManager from '../components/LeadsManager';
import PaginaDeDetalhes from '../components/PaginadeDetalhes';
import apiClient from '../api/apiClient';
import { io, Socket } from 'socket.io-client';
import WhatsappChat from '../components/WhatsappChat';
import { ChevronDown, User, Settings, UserPlus, LogOut, BarChart3, MessageSquare, Zap } from 'lucide-react';

// Painel inline: busca leads e exibe ViewLeads + detalhes
function TabPainel() {
  return <LeadsManager />;
}

function TabDisparo() {
  const [subtab, setSubtab] = useState<'disparo'|'whatsapp'>('disparo');
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex gap-3">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSubtab('disparo')} 
          className={subtab==='disparo' ? 'btn btn-primary' : 'btn btn-ghost'}
        >
          <Zap className="w-4 h-4 mr-2" />
          Disparo
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSubtab('whatsapp')} 
          className={subtab==='whatsapp' ? 'btn btn-primary' : 'btn btn-ghost'}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          WhatsApp Connect
        </motion.button>
      </div>
      <AnimatePresence mode="wait">
        {subtab === 'disparo' ? (
          <motion.div 
            key="disparo"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full"
          >
            <DisparoWPP />
          </motion.div>
        ) : (
          <motion.div 
            key="whatsapp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <WhatsappConnect embed />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TabChat() { 
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-6"
    >
      <WhatsappChat />
    </motion.div>
  ); 
}

export default function Home() {
  const [tab, setTab] = useState<'painel'|'disparo'|'chat'>('painel');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr] text-slate-100 relative">
      <motion.aside 
        initial={{ x: -220 }}
        animate={{ x: 0 }}
        className="sidebar sticky top-0 h-screen px-4 py-6 flex flex-col justify-between"
      >
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent glow-text">
              LeadMatrix
            </h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mt-2"></div>
          </motion.div>
          <nav className="space-y-2">
            <motion.button 
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`btn w-full justify-start ${tab==='painel' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setTab('painel')}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              Painel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`btn w-full justify-start ${tab==='disparo' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setTab('disparo')}
            >
              <Zap className="w-5 h-5 mr-3" />
              Disparo
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`btn w-full justify-start ${tab==='chat' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setTab('chat')}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Chat
            </motion.button>
          </nav>
        </div>
        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn w-full justify-start btn-ghost" 
            onClick={() => setUserMenuOpen(v => !v)}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1 text-left">{user?.usuario || 'Usuário'}</span>
            <motion.div
              animate={{ rotate: userMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 bottom-16 w-full modal-content rounded-lg shadow-lg z-50 p-2"
              >
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="btn btn-ghost justify-start w-full" 
                  onClick={() => { setUserMenuOpen(false); navigate('/perfil'); }}
                >
                  <User className="w-4 h-4 mr-3" />
                  Meu Perfil
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="btn btn-ghost justify-start w-full" 
                  onClick={() => { setUserMenuOpen(false); navigate('/perfil?edit=1'); }}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Editar Perfil
                </motion.button>
                {user?.role === 'admin' && (
                  <motion.button 
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="btn btn-ghost justify-start w-full" 
                    onClick={() => { setUserMenuOpen(false); navigate('/registro'); }}
                  >
                    <UserPlus className="w-4 h-4 mr-3" />
                    Registrar Usuários
                  </motion.button>
                )}
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="btn btn-ghost justify-start w-full text-red-400 hover:text-red-300" 
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sair
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
      <main className="p-8 relative">
        <div className="grid-pattern absolute inset-0 opacity-20"></div>
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {tab === 'painel' && (
              <motion.div
                key="painel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TabPainel />
              </motion.div>
            )}
            {tab === 'disparo' && (
              <motion.div
                key="disparo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TabDisparo />
              </motion.div>
            )}
            {tab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TabChat />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
