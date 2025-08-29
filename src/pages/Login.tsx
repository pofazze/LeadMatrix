import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/UseAuth';
import styles from './Login.module.scss';
import { Navigate } from 'react-router-dom';
import logo from './images/logo.svg';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export default function Login() {
  const { user, authChecked, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (authChecked && user) {
    return <Navigate to="/painel" replace />;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await login(usuario, senha);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro no login';
      setErro(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Formulário */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              LeadMatrix
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
            <p className="text-gray-400 mt-4">Sistema de Gestão Futurístico</p>
          </motion.div>

          <motion.form 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="card p-8 space-y-6" 
            onSubmit={handleLogin}
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="text"
                placeholder="Nome de usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className="input pl-12"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="input pl-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {erro && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-center text-sm bg-red-900/20 border border-red-800/30 rounded-lg p-3"
              >
                {erro}
              </motion.div>
            )}
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading} 
              className="btn btn-primary w-full py-3 text-lg font-semibold"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </motion.button>
          </motion.form>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center mt-8 text-gray-500 text-sm"
          >
            © {new Date().getFullYear()} LeadMatrix - Tecnologia Avançada
          </div>
        </motion.div>
      </motion.div>

      {/* Lado direito - Visual futurístico */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="absolute inset-0 grid-pattern opacity-30"></div>
        
        {/* Elementos flutuantes animados */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-32 h-32 border border-blue-400/30 rounded-full"
        ></motion.div>
        
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-1/2 right-1/4 w-24 h-24 border border-purple-400/30 rounded-lg rotate-45"
        ></motion.div>
        
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/3 left-1/3 w-16 h-16 border border-pink-400/30 rounded-full"
        ></motion.div>
        
        <div className="flex items-center justify-center w-full h-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-center"
          >
            <h2 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
              Futuro
            </h2>
            <p className="text-xl text-gray-300 max-w-md">
              Gestão de leads com tecnologia de ponta e interface futurística
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
