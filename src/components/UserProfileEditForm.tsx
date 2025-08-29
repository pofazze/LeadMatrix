import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/UseAuth';
import apiClient from '../api/apiClient';
import { Save, User, Mail, Smartphone, Users, Lock, Eye, EyeOff } from 'lucide-react';

export default function UserProfileEditForm() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    whatsapp: user?.whatsapp || '',
    gender: user?.gender || '',
    password: '',
    newPassword: '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (!user) return null;

  const handleChange = (e: any) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMsg(''); setErr(''); setLoading(true);
    if (!form.nome.trim() || !form.email.trim()) {
      setErr('Nome e email são obrigatórios.'); setLoading(false); return;
    }
    if (form.newPassword && form.newPassword.length < 6) {
      setErr('Nova senha deve ter pelo menos 6 caracteres.'); setLoading(false); return;
    }
    try {
      await apiClient.post('/api/auth/update-profile', {
        nome: form.nome,
        email: form.email,
        whatsapp: form.whatsapp,
        gender: form.gender,
        password: form.password,
        newPassword: form.newPassword,
      });
      setMsg('Perfil atualizado com sucesso!');
      setForm(f => ({ ...f, password: '', newPassword: '' }));
      await login(user.usuario || '', form.newPassword || form.password);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-8 max-w-lg mx-auto mt-8"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Editar Perfil
        </h2>
        <p className="text-slate-400 mt-2">Atualize suas informações pessoais</p>
      </motion.div>
      
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onSubmit={handleSubmit} 
        className="space-y-6"
      >
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input 
            name="nome" 
            value={form.nome} 
            onChange={handleChange} 
            placeholder="Nome completo" 
            className="input pl-12" 
            required 
          />
        </div>
        
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            placeholder="Email" 
            className="input pl-12" 
            type="email" 
            required 
          />
        </div>
        
        <div className="relative">
          <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input 
            name="whatsapp" 
            value={form.whatsapp} 
            onChange={handleChange} 
            placeholder="WhatsApp" 
            className="input pl-12" 
          />
        </div>
        
        <div className="relative">
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
          <select name="gender" value={form.gender} onChange={handleChange} className="input pl-12">
            <option value="">Gênero</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
            <option value="other">Outro</option>
          </select>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-blue-500/20">
          <h3 className="text-sm font-medium text-blue-300 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Alterar Senha
          </h3>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              placeholder="Senha atual" 
              className="input pl-12 pr-12" 
              type={showPassword ? "text" : "password"} 
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input 
              name="newPassword" 
              value={form.newPassword} 
              onChange={handleChange} 
              placeholder="Nova senha (opcional)" 
              className="input pl-12 pr-12" 
              type={showNewPassword ? "text" : "password"} 
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {msg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm text-center"
          >
            {msg}
          </motion.div>
        )}
        
        {err && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm text-center"
          >
            {err}
          </motion.div>
        )}
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          className="btn btn-primary w-full py-3 text-lg font-semibold" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Salvando...
            </div>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Alterações
            </>
          )}
        </motion.button>
      </motion.form>
    </motion.div>
  );
}
