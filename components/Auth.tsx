
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 overflow-hidden bg-black font-inter">
      {/* Cinematic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[60s] scale-110"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
          animation: 'slowZoom 60s ease-in-out infinite alternate'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-900/40 to-indigo-950/70"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
      </div>

      {/* Large Decorative Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[25vw] font-black text-white/[0.02] leading-none tracking-tighter uppercase translate-y-12">
          SYSTEM
        </h1>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
             <div className="w-14 h-14 gradient-primary rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)] transform hover:rotate-3 transition-transform duration-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
             </div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">EduPlanner</h1>
          <p className="text-indigo-400 font-black tracking-[0.5em] uppercase text-[10px] opacity-80">Global Academic Node</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-[50px] border border-white/10 p-10 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          <div className="flex bg-black/40 p-1.5 rounded-[1.5rem] mb-12 ring-1 ring-white/5">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-700 ${isLogin ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-700 ${!isLogin ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2 group">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 group-focus-within:text-indigo-400">Institutional ID</label>
              <input 
                type="email"
                required
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/[0.08] transition-all placeholder:text-slate-700"
                placeholder="admin@institution.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2 group">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 group-focus-within:text-indigo-400">Access Key</label>
              <input 
                type="password"
                required
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/[0.08] transition-all placeholder:text-slate-700"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] animate-shake">
                <p className="text-rose-400 text-[10px] font-bold text-center leading-relaxed uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full py-7 rounded-[2rem] gradient-primary text-white font-black text-[12px] uppercase tracking-[0.4em] shadow-[0_30px_60px_-15px_rgba(99,102,241,0.6)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <div className="flex items-center gap-4">
                  <span>{isLogin ? 'Initialize Session' : 'Create Identity'}</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-14 text-center opacity-40">
           <p className="text-[8px] text-white font-black uppercase tracking-[0.6em]">Infrastructure Version 2.5.4-STABLE</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slowZoom { from { transform: scale(1.05); } to { transform: scale(1.18); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out 0s 2; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default Auth;
