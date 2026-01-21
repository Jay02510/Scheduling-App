
import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface LandingPageProps {
  onEnter: () => void;
  language: Language;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, language }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] text-white overflow-y-auto overflow-x-hidden font-inter selection:bg-indigo-500/30">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop")',
            filter: 'brightness(0.5) contrast(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 via-[#020617]/60 to-[#020617]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
      </div>

      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] overflow-hidden">
        <h1 className="text-[30vw] font-black tracking-tighter uppercase translate-y-20">ENGINE</h1>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-sm font-black tracking-[0.3em] uppercase">EduPlanner</span>
        </div>
        <button 
          onClick={onEnter}
          className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all duration-500"
        >
          {language === 'ko' ? '로그인' : 'Sign In'}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-8 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-fadeIn">
          Institutional Intelligence Engine
        </div>
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase mb-10 max-w-4xl drop-shadow-2xl">
          Master Your <br/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500">Institution's Flow</span>
        </h1>
        <p className="text-lg lg:text-xl text-slate-400 font-medium max-w-2xl leading-relaxed mb-12 text-balance">
          Stop struggling with scheduling conflicts and manual planning. EduPlanner uses advanced reasoning to keep your teachers happy, your students focused, and your institution running at peak health.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <button 
            onClick={onEnter}
            className="group px-10 py-6 gradient-primary text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(99,102,241,0.5)] hover:-translate-y-1 hover:shadow-[0_35px_60px_-15px_rgba(99,102,241,0.6)] active:translate-y-0.5 transition-all duration-500 flex items-center gap-4"
          >
            Enter Workspace
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <button 
            className="px-10 py-6 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-500"
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-8 lg:px-12 max-w-7xl mx-auto pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Clash-Free Living",
              desc: "The engine solves the scheduling puzzle for you, ensuring no teacher is double-booked and every class has a lead.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
              color: "text-indigo-400"
            },
            {
              title: "Burnout Prevention",
              desc: "Automatically balances teacher workloads, protecting breaks and ensuring no one is stretched too thin.",
              icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
              color: "text-emerald-400"
            },
            {
              title: "Curriculum Pacing",
              desc: "Link your textbooks to your timeline. The system maps out units to ensure you finish the year on time.",
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              color: "text-purple-400"
            }
          ].map((feat, i) => (
            <div key={i} className="group bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3.5rem] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 shadow-2xl">
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform ${feat.color}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feat.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Guide Section */}
      <section className="relative z-10 bg-white/5 border-y border-white/10 py-32 px-8 lg:px-12 mb-32">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none">
              Simple steps <br/> to <span className="text-indigo-400">total control</span>
            </h2>
            <div className="space-y-6">
              {[
                { step: "01", title: "Add Your Staff", text: "Tell the engine who your teachers are and what they can teach." },
                { step: "02", title: "Set the Rhythm", text: "Define your school hours and when lunch or assemblies happen." },
                { step: "03", title: "One-Click Sync", text: "Watch as the engine weaves everything into a perfect master plan." }
              ].map((s, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <span className="text-2xl font-black text-indigo-500/40 group-hover:text-indigo-500 transition-colors">{s.step}</span>
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-sm mb-1">{s.title}</h4>
                    <p className="text-slate-400 text-sm font-medium">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={onEnter}
              className="mt-4 px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl"
            >
              Get Started Now
            </button>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
            <div className="relative bg-slate-900/80 backdrop-blur-3xl border border-white/20 rounded-[3.5rem] p-1 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop" 
                alt="Interface Preview" 
                className="rounded-[3.2rem] opacity-90 border border-white/10"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 lg:px-12 py-20 border-t border-white/5 flex flex-col items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-[10px] font-black tracking-[0.4em] uppercase">EduPlanner Institutional Suite</span>
        </div>
        <div className="flex gap-8 text-[10px] font-black uppercase text-slate-500 tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
        </div>
        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">© 2024 Institutional Systems Inc. Built with Gemini AI.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
