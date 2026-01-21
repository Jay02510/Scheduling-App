
import React from 'react';
import { Language } from '../types';

interface LandingPageProps {
  onEnter: () => void;
  language: Language;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, language }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] text-white overflow-y-auto overflow-x-hidden font-inter selection:bg-indigo-500/30">
      {/* Background with Ambient Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[200px] rounded-full" />
      </div>

      {/* Cinematic Hero Image (The Globe/Sphere Reference) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] bg-center bg-no-repeat bg-contain animate-pulse-slow"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
            maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
            filter: 'hue-rotate(220deg) brightness(0.8)'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-8 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-base font-black tracking-[0.4em] uppercase">EduPlanner</span>
        </div>
        <button 
          onClick={onEnter}
          className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all duration-700 active:scale-95"
        >
          {language === 'ko' ? '로그인' : 'Log In'}
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-40 px-8 lg:px-16 max-w-screen-2xl mx-auto flex flex-col items-center text-center">
        <div className="max-w-4xl space-y-8">
          <p className="text-slate-400 font-black tracking-[0.6em] uppercase text-[10px] animate-fadeIn">Building Digital Excellence</p>
          <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tighter leading-[0.85] uppercase drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            Optimizing <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-500">Institutional Flow</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed pt-8">
            Experience the intelligence engine that blends strategy, design, and institutional logic to craft seamless academic environments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-12">
            <button 
              onClick={onEnter}
              className="group relative px-10 py-6 bg-indigo-600 rounded-full font-black text-xs uppercase tracking-[0.3em] overflow-hidden shadow-[0_20px_50px_rgba(99,102,241,0.4)] hover:shadow-[0_25px_60px_rgba(99,102,241,0.6)] transition-all duration-500 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative flex items-center gap-4">
                Start Your Engine
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
            <button 
              className="px-10 py-6 bg-transparent border border-white/20 hover:border-white/40 rounded-full font-black text-xs uppercase tracking-[0.3em] backdrop-blur-md transition-all duration-500"
            >
              Explore Infrastructure
            </button>
          </div>
        </div>
      </main>

      {/* Feature Highlights */}
      <section className="relative z-10 px-8 lg:px-16 max-w-screen-2xl mx-auto pb-40 grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          {
            title: "Predictive Sync",
            desc: "AI-driven logic that eliminates scheduling overlaps before they occur.",
            icon: "M13 10V3L4 14h7v7l9-11h-7z"
          },
          {
            title: "Balance Matrix",
            desc: "A powerful framework for teacher workload and sustainability.",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          },
          {
            title: "Global Overview",
            desc: "One central hub for institutional pacing and resource mapping.",
            icon: "M9 20l-5.447-2.724A2 2 0 013 15.447V5.553a2 2 0 011.553-1.944L9 2l6 3 5.447-2.724A2 2 0 0121 4.223v9.894a2 2 0 01-1.106 1.789L15 18l-6 2z"
          }
        ].map((feat, i) => (
          <div key={i} className="group p-10 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] hover:bg-white/[0.08] transition-all duration-700">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 flex items-center justify-center mb-8 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feat.icon} />
              </svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-4">{feat.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">{feat.desc}</p>
          </div>
        ))}
      </section>

      {/* How it Works / Video Replacement Section */}
      <section className="relative z-10 bg-white/5 border-y border-white/10 py-40">
        <div className="max-w-screen-2xl mx-auto px-8 lg:px-16 flex flex-col lg:flex-row items-center gap-24">
          <div className="flex-1 space-y-12">
            <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
              Institutional <br/> Control in <span className="text-indigo-400">Seconds</span>
            </h2>
            <div className="space-y-8">
              {[
                { n: "01", t: "Registry", d: "Add your faculty and institutional resources to the engine." },
                { n: "02", t: "Logic", d: "Set the daily rhythm and core constraints for your campus." },
                { n: "03", t: "Mastery", d: "Generate and refine a perfect operational sequence with one click." }
              ].map((step, i) => (
                <div key={i} className="flex gap-8 group">
                  <span className="text-4xl font-black text-white/10 group-hover:text-indigo-500/50 transition-colors duration-500">{step.n}</span>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-widest mb-2">{step.t}</h4>
                    <p className="text-slate-400 text-sm font-medium">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-1000" />
            <div className="relative rounded-[4rem] border border-white/20 p-2 bg-slate-900 overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop" 
                alt="System Overview" 
                className="w-full h-auto rounded-[3.5rem] opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
                    <svg className="w-10 h-10 text-white fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 border-t border-white/5 flex flex-col items-center gap-12">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-[10px] font-black tracking-[0.6em] uppercase">EduPlanner Systems</span>
        </div>
        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">© 2024 Institutional Intelligence Inc. Built with Gemini AI.</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; } 50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.8; } }
        .animate-pulse-slow { animation: pulse-slow 15s ease-in-out infinite; }
      `}} />
    </div>
  );
};

export default LandingPage;
