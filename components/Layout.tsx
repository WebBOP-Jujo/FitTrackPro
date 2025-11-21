import React from 'react';
import { Activity, Utensils, BarChart2, LogOut, Dumbbell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Resumen', path: '/', icon: <BarChart2 size={22} /> },
    { label: 'Entreno', path: '/workout', icon: <Dumbbell size={22} /> },
    { label: 'Dieta', path: '/diet', icon: <Utensils size={22} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans selection:bg-brand/20 selection:text-brandDark">
      {/* Header Mobile/Desktop - Glass Effect */}
      <header className="glass-panel px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative group">
             <div className="absolute inset-0 bg-brand blur opacity-40 rounded-full group-hover:opacity-60 transition-opacity duration-500"></div>
             <div className="relative text-white bg-gradient-to-br from-brand to-brandDark p-2.5 rounded-xl shadow-lg shadow-brand/30 transform transition-transform group-hover:scale-105">
                <Activity size={20} />
             </div>
          </div>
          <h1 className="font-bold text-2xl tracking-tight text-slate-800 drop-shadow-sm">
            FitTrack <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">Pro</span>
          </h1>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2.5 text-slate-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50 hover:shadow-inner-soft hover:scale-95 active:scale-90"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation (Desktop) - Floating Glass Pane */}
        <nav className="hidden md:flex flex-col absolute left-4 top-4 bottom-4 w-64 glass-panel rounded-3xl p-4 space-y-2 shadow-glass z-10">
          <div className="flex-1 space-y-2 mt-2">
            {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`group relative flex items-center gap-4 w-full px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${
                    isActive(item.path) 
                      ? 'text-white shadow-neon translate-x-2' 
                      : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-700 hover:translate-x-1'
                  }`}
                >
                  {/* Animated Background for Active State */}
                  {isActive(item.path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand to-brandDark rounded-2xl -z-10 animate-fade-in"></div>
                  )}
                  
                  <span className={`transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="tracking-wide">{item.label}</span>
                </button>
            ))}
          </div>
          
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-white/60 shadow-inner-soft">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Tu plan actual</p>
              <p className="text-sm font-bold text-slate-700">Premium Member</p>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 md:pl-72 pb-24 md:pb-8 w-full scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-8">
             {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) - Glass Dock */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 glass-panel rounded-2xl flex justify-around py-3 shadow-glass-hover z-30 border border-white/40">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive(item.path) ? 'text-brand -translate-y-2' : 'text-slate-400'
            }`}
          >
            <div className={`p-3 rounded-2xl transition-all duration-300 ${
                isActive(item.path) 
                ? 'bg-gradient-to-tr from-brand to-brandDark text-white shadow-neon scale-110' 
                : 'bg-transparent'
            }`}>
                {item.icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300 ${isActive(item.path) ? 'opacity-100 font-extrabold' : 'opacity-0 h-0 overflow-hidden'}`}>
                {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;