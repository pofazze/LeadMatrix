import { useState } from 'react';
import { useAuth } from '../hooks/UseAuth';
import apiClient from '../api/apiClient';

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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 max-w-md mx-auto mt-8 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">Editar Perfil</h2>
      <input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" className="input input-bordered" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="input input-bordered" type="email" required />
      <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp" className="input input-bordered" />
      <select name="gender" value={form.gender} onChange={handleChange} className="input input-bordered">
        <option value="">Gênero</option>
        <option value="male">Masculino</option>
        <option value="female">Feminino</option>
        <option value="other">Outro</option>
      </select>
      <input name="password" value={form.password} onChange={handleChange} placeholder="Senha atual" className="input input-bordered" type="password" required />
      <input name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="Nova senha (opcional)" className="input input-bordered" type="password" />
      {msg && <div className="text-green-500 text-sm">{msg}</div>}
      {err && <div className="text-red-500 text-sm">{err}</div>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Salvando...' : 'Salvar alterações'}</button>
    </form>
  );
}
