
import React from 'react';
import { Language } from '../types';

interface LandingPageProps {
  onEnter: () => void;
  language: Language;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, language }) => {
  return (
    <div className="relative min-h-screen bg-[#020617] overflow-x-hidden font-inter selection:bg-sky-500/30">
      
      {/* Background Grid & Decorative Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-sky-900/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal-900/10 blur-[150px] rounded-full" />
        
        {/* Abstract Lines & Nodes (Benchmar style) */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,500 Q400,300 800,500 T1800,500" fill="none" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="1" />
          <path d="M-100,600 Q600,400 1200,600 T2400,600" fill="none" stroke="rgba(45, 212, 191, 0.1)" strokeWidth="1" />
          <circle cx="80%" cy="40%" r="4" fill="#0ea5e9" className="animate-pulse-soft" />
          <circle cx="20%" cy="70%" r="3" fill="#2dd4bf" className="animate-pulse-soft" />
        </svg>
      </div>

      {/* Floating Pill Navigation */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full py-2 px-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6 px-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                 <div className="w-2 h-2 bg-sky-400 rounded-full" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white uppercase">EduPlanner</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Infrastructure</a>
              <a href="#" className="hover:text-white transition-colors">Protocol</a>
              <a href="#" className="hover:text-white transition-colors">Network</a>
            </div>
          </div>
          <button 
            onClick={onEnter}
            className="bg-white text-slate-950 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-sky-400 transition-all flex items-center gap-2 group"
          >
            Start Engine
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 pt-44 pb-32 px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-12 text-left">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <p className="text-sky-500 font-black tracking-[0.3em] uppercase text-[10px]">System Operational</p>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-medium tracking-tighter leading-[0.9] max-w-3xl">
              Architect your <br/>
              <span className="font-serif italic text-glow-cyan text-sky-400">institution</span> <br/>
              with absolute <br/>
              <span className="font-serif italic text-glow-cyan text-sky-400">precision.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
              Advanced administrative protocols merged with intuitive design. We provide the infrastructure to accelerate your educational legacy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <button 
                onClick={onEnter}
                className="px-10 py-5 bg-sky-600/10 border border-sky-500/40 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] backdrop-blur-md shadow-[0_0_30px_rgba(14,165,233,0.15)] hover:bg-sky-600/20 hover:shadow-[0_0_40px_rgba(14,165,233,0.3)] transition-all active:scale-95"
              >
                Initialize Engine
              </button>
              <button 
                className="px-10 py-5 bg-white/5 border border-white/10 text-slate-300 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3"
              >
                View Infrastructure
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Abstract HUD Element (Benchmark style) */}
          <div className="flex-1 relative flex justify-center items-center">
            <div className="absolute inset-0 bg-sky-500/5 blur-[100px] rounded-full" />
            <div className="relative w-80 h-80 md:w-96 md:h-96">
               <svg className="w-full h-full animate-pulse-soft" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(14, 165, 233, 0.1)" strokeWidth="0.5" strokeDasharray="4 4" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="10" fill="none" stroke="#0ea5e9" strokeWidth="2" />
                  <circle cx="100" cy="100" r="4" fill="#0ea5e9" />
                  <line x1="100" y1="20" x2="100" y2="40" stroke="rgba(14, 165, 233, 0.5)" strokeWidth="1" />
                  <line x1="100" y1="160" x2="100" y2="180" stroke="rgba(14, 165, 233, 0.5)" strokeWidth="1" />
                  <line x1="20" y1="100" x2="40" y2="100" stroke="rgba(14, 165, 233, 0.5)" strokeWidth="1" />
                  <line x1="160" y1="100" x2="180" y2="100" stroke="rgba(14, 165, 233, 0.5)" strokeWidth="1" />
               </svg>
               <div className="absolute top-0 right-0 p-4 border border-white/5 backdrop-blur-xl rounded-2xl bg-black/40 text-[9px] font-black uppercase tracking-widest text-sky-400">
                 Zero Latency
               </div>
               <div className="absolute bottom-10 left-[-20%] p-4 border border-white/5 backdrop-blur-xl rounded-2xl bg-black/40 text-[9px] font-black uppercase tracking-widest text-teal-400">
                 AI Native Engine
               </div>
            </div>
          </div>
        </div>

        {/* Features Section (Benchmark cards) */}
        <section className="pt-44 grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { 
               title: "Automated Optimization", 
               desc: "Generate high-precision strategies and execute schedules in milliseconds with our custodial algorithms.",
               icon: (
                 <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                 </svg>
               )
             },
             { 
               title: "Dynamic Allocation", 
               desc: "Connect to deep resource pools across departments to ensure zero-slippage execution on institutional orders.",
               icon: (
                 <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                 </svg>
               )
             },
             { 
               title: "Institutional Governance", 
               desc: "Manage operations with institutional-grade security. Set permissions, approve plans, and audit logs.",
               icon: (
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                 </svg>
               )
             }
           ].map((feat, i) => (
             <div key={i} className="bg-black/20 border-glow-cyan p-10 rounded-[2.5rem] backdrop-blur-xl transition-all flex flex-col gap-8">
               <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                 {feat.icon}
               </div>
               <div className="space-y-4">
                 <h3 className="text-2xl font-black text-white leading-tight">{feat.title}</h3>
                 <p className="text-slate-400 text-sm leading-relaxed font-medium">{feat.desc}</p>
               </div>
               <div className="pt-4">
                 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-sky-500/50 w-1/3 animate-pulse-soft" />
                 </div>
               </div>
             </div>
           ))}
        </section>

        <div className="mt-44 flex justify-center">
          <button 
            onClick={onEnter}
            className="group px-12 py-5 bg-white text-slate-950 rounded-full font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-sky-400 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95"
          >
            Explore Capabilities
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </main>

      {/* Footer Branded Element (Benchmark style) */}
      <footer className="relative z-10 py-16 px-6 lg:px-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          EduPlanner Institutional Protocol v2.5
        </div>
        <div className="bg-black/60 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
          <div className="w-4 h-4 rounded bg-sky-500/10 flex items-center justify-center text-sky-500">
            A
          </div>
          Made in Aura
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
