import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Activity, ArrowRight } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [msg, setMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
        if (mode === 'register') {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            setMsg('Registro exitoso! Revisa tu email o inicia sesión.');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
    } catch (error: any) {
        setMsg(error.message || 'Error de autenticación');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-8 border border-slate-100">
        <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-brand text-white rounded-2xl mb-2 shadow-lg shadow-brand/30">
                <Activity size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">FitTrack Pro</h1>
            <p className="text-slate-500 text-sm font-medium">Tu centro de control físico y nutricional</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                <input 
                    type="email" 
                    required 
                    placeholder="tu@email.com"
                    className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all placeholder-slate-400 font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña</label>
                <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all placeholder-slate-400 font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            {msg && (
                <div className={`text-center text-sm p-3 rounded-xl font-medium ${msg.includes('exitoso') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {msg}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg hover:bg-brandDark transition-all transform active:scale-[0.98] shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
            >
                {loading ? 'Procesando...' : (
                    <>
                        {mode === 'login' ? 'Entrar' : 'Crear Cuenta'} 
                        <ArrowRight size={20} />
                    </>
                )}
            </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
            <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(''); }}
                className="text-sm text-slate-500 hover:text-brand font-medium transition-colors"
            >
                {mode === 'login' ? '¿Nuevo aquí? Crea una cuenta gratis' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;