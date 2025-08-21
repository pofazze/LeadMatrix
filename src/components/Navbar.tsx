import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-800 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
        <Link to="/painel" className="text-slate-50 font-semibold tracking-wide">LeadMatrix</Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-300 hover:text-white">Home</Link>
          <Link to="/painel" className="text-slate-300 hover:text-white">Painel</Link>
        </div>
      </div>
    </nav>
  );
}
