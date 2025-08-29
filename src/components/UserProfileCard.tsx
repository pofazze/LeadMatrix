import { useAuth } from '../hooks/UseAuth';
import { motion } from 'framer-motion';
import { User, Mail, Smartphone, Briefcase, Users } from 'lucide-react';

export default function UserProfileCard() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-8 max-w-md mx-auto mt-8"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl text-white font-bold mx-auto mb-4 shadow-lg">
          {user.nome?.[0]?.toUpperCase() || user.usuario?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
          {user.nome || user.usuario}
        </h2>
        <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
          {user.role || 'Usuário'}
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <Mail className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Email</div>
            <div className="text-slate-300">{user.email || 'Não informado'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
          <Smartphone className="w-5 h-5 text-green-400" />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">WhatsApp</div>
            <div className="text-slate-300 font-mono">{user.whatsapp || 'Não informado'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
          <Briefcase className="w-5 h-5 text-purple-400" />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Projeto</div>
            <div className="text-slate-300">{user.project || 'Não informado'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-500/5 border border-pink-500/20">
          <User className="w-5 h-5 text-pink-400" />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Usuário</div>
            <div className="text-slate-300 font-mono">{user.usuario}</div>
          </div>
        </div>
        
        {user.gender && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <Users className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Gênero</div>
              <div className="text-slate-300 capitalize">{user.gender}</div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
