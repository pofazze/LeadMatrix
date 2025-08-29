import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../api/apiClient';
import { useAuth } from '../hooks/UseAuth';
import { UserPlus, User, Mail, Lock, Smartphone, Users, Briefcase, Shield } from 'lucide-react';

export default function UserRegisterForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    usuario: '', nome: '', email: '', password: '', whatsapp: '', gender: '', projeto: '', role: ''
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [projetos, setProjetos] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProjetosRoles = useCallback(async () => {
    try {
      const res = await apiClient.get('/webhook/rolesandprojects');
      setProjetos(Array.isArray(res.data) ? res.data.map((p: any) => p.ProjectName) : []);
    } catch {}
  }, []);

  useEffect(() => { fetchProjetosRoles(); }, [fetchProjetosRoles]);

  useEffect(() => {
    if (!form.projeto) { setRoles([]); return; }
    apiClient.get('/webhook/rolesandprojects').then(res => {
      const projetoObj = Array.isArray(res.data) ? res.data.find((p: any) => p.ProjectName === form.projeto) : null;
      setRoles(projetoObj ? projetoObj.roles : []);
    });
  }, [form.projeto]);

  const handleChange = (e: any) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMsg(''); setErr(''); setLoading(true);
    if (!form.usuario.trim() || !form.nome.trim() || !form.email.trim() || !form.password.trim() || !form.projeto || !form.role) {
      setErr('Preencha todos os campos obrigatórios.'); setLoading(false); return;
    }
    try {
      await apiClient.post('/api/auth/admin/create-user', {
        usuario: form.usuario,
        nome: form.nome,
        email: form.email,
        password: form.password,
        whatsapp: form.whatsapp,
        gender: form.gender,
        projeto: form.projeto,
        role: form.role
      });
      setMsg('Usuário registrado com sucesso!');
      setForm({ usuario: '', nome: '', email: '', password: '', whatsapp: '', gender: '', projeto: '', role: '' });
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Erro ao registrar usuário.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return <div className="p-6 text-red-500">Acesso restrito.</div>;

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
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Registrar Usuário
        </h2>
        <p className="text-slate-400 mt-2">Criar nova conta no sistema</p>
      </motion.div>
      
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onSubmit={handleSubmit} 
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input 
              name="usuario" 
              value={form.usuario} 
              onChange={handleChange} 
              placeholder="Usuário" 
              className="input pl-12" 
              required 
            />
          </div>
          
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
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input 
            name="password" 
            value={form.password} 
            onChange={handleChange} 
            placeholder="Senha" 
            className="input pl-12" 
            type="password" 
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <select name="gender" value={form.gender} onChange={handleChange} className="input pl-12">
              <option value="">Gênero</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>
          </div>
          
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
            <select name="projeto" value={form.projeto} onChange={handleChange} className="input pl-12" required>
              <option value="">Projeto</option>
              {projetos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
          <select name="role" value={form.role} onChange={handleChange} className="input pl-12" required>
            <option value="">Função</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
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
              Registrando...
            </div>
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              Registrar Usuário
            </>
          )}
        </motion.button>
      </motion.form>
    </motion.div>
  );
}
