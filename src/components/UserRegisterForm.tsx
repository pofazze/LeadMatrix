import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../hooks/UseAuth';

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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 max-w-md mx-auto mt-8 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">Registrar Usuário</h2>
      <input name="usuario" value={form.usuario} onChange={handleChange} placeholder="Usuário" className="input input-bordered" required />
      <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" className="input input-bordered" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="input input-bordered" type="email" required />
      <input name="password" value={form.password} onChange={handleChange} placeholder="Senha" className="input input-bordered" type="password" required />
      <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp" className="input input-bordered" />
      <select name="gender" value={form.gender} onChange={handleChange} className="input input-bordered">
        <option value="">Gênero</option>
        <option value="male">Masculino</option>
        <option value="female">Feminino</option>
        <option value="other">Outro</option>
      </select>
      <select name="projeto" value={form.projeto} onChange={handleChange} className="input input-bordered" required>
        <option value="">Projeto</option>
        {projetos.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select name="role" value={form.role} onChange={handleChange} className="input input-bordered" required>
        <option value="">Função</option>
        {roles.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      {msg && <div className="text-green-500 text-sm">{msg}</div>}
      {err && <div className="text-red-500 text-sm">{err}</div>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</button>
    </form>
  );
}
