
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
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 overflow-hidden bg-slate-950 font-inter">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[60s] scale-110"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
          animation: 'slowZoom 60s ease-in-out infinite alternate'
        }}
      >
        <div className="absolute inset-0 bg-slate-950/80 backdrop-brightness-75"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 via-transparent to-slate-950/60"></div>
      </div>

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[25vw] font-black text-white/[0.03] leading-none tracking-tighter uppercase translate-y-12">
          PLANNER
        </h1>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
             <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.4)] transform hover:rotate-3 transition-transform duration-500 ring-4 ring-white/10">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
             </div>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-2 drop-shadow-2xl">EduPlanner</h1>
          <p className="text-indigo-400 font-black tracking-[0.5em] uppercase text-[10px] opacity-100 drop-shadow-md">Simple School Planning</p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-3xl border border-white/20 p-10 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
          <div className="flex bg-black/60 p-1.5 rounded-[1.5rem] mb-12 ring-1 ring-white/10">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isLogin ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${!isLogin ? 'bg-white text-slate-900 shadow-2xl' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Join
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] ml-2 group-focus-within:text-white transition-colors">Email Address</label>
              <input 
                type="email"
                required
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/15 focus:border-white/30 transition-all placeholder:text-slate-500"
                placeholder="admin@school.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] ml-2 group-focus-within:text-white transition-colors">Password</label>
              <input 
                type="password"
                required
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/15 focus:border-white/30 transition-all placeholder:text-slate-500"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-5 bg-rose-500/20 border border-rose-500/40 rounded-[1.5rem] animate-shake">
                <p className="text-rose-300 text-[10px] font-bold text-center leading-relaxed uppercase tracking-tight">{error}</p>
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
                  <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-14 text-center opacity-60">
           <p className="text-[8px] text-white font-black uppercase tracking-[0.6em]">System Version 2.5</p>
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
