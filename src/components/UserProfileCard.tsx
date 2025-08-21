import { useAuth } from '../hooks/UseAuth';

export default function UserProfileCard() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 max-w-md mx-auto mt-8 border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-500 flex items-center justify-center text-3xl text-white font-bold">
          {user.nome?.[0]?.toUpperCase() || user.usuario?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{user.nome || user.usuario}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">{user.email || 'Sem email'}</div>
          <div className="inline-block mt-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-semibold">
            {user.role || 'Usuário'}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <div><span className="font-semibold">Projeto:</span> {user.project || '-'}</div>
        <div><span className="font-semibold">WhatsApp:</span> {user.whatsapp || '-'}</div>
        <div><span className="font-semibold">Gênero:</span> {user.gender || '-'}</div>
        <div><span className="font-semibold">Usuário:</span> {user.usuario}</div>
      </div>
    </div>
  );
}
