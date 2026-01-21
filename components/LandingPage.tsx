import React from 'react';
import { Language } from '../types';

interface LandingPageProps {
  onEnter: () => void;
  language: Language;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, language }) => {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-white overflow-x-hidden font-inter selection:bg-sky-500/30">
      
      {/* Background Grid & Decorative Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-sky-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/10 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 blur-[120px] rounded-full animate-pulse-soft" />
      </div>

      {/* Floating Pill Navigation */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full py-2.5 px-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6 px-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                 <div className="w-2.5 h-2.5 bg-sky-400 rounded-full" />
              </div>
              <span className="text-sm font-black tracking-tight text-white uppercase">EduPlanner</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Intelligence</button>
              <button onClick={() => scrollTo('about')} className="hover:text-white transition-colors">Our Vision</button>
              <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Enterprise</button>
            </div>
          </div>
          <button 
            onClick={onEnter}
            className="bg-white text-slate-950 px-7 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-sky-400 transition-all flex items-center gap-2 group shadow-lg"
          >
            Launch Platform
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <section id="hero" className="relative z-10 pt-56 pb-32 px-6 lg:px-16 max-w-screen-2xl mx-auto min-h-screen flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
          <div className="flex-1 space-y-8 text-left max-w-3xl">
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <p className="text-sky-500 font-black tracking-[0.5em] uppercase text-[10px]">Institutional Grade Automation</p>
            </div>
            
            <h1 className="text-5xl md:text-[5.5rem] font-black tracking-tighter leading-[0.95] uppercase">
              BUILD YOUR <br/>
              <span className="font-serif italic text-glow-cyan text-sky-400 normal-case">PERFECT SCHEDULE</span> <br/>
              IN JUST A FEW CLICKS.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
              Design your institutional flow with precision. Stop fighting spreadsheets—EduPlanner leverages Gemini AI to generate balanced, human-centric schedules.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <button 
                onClick={onEnter}
                className="px-10 py-5 bg-sky-500 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(14,165,233,0.5)] hover:scale-105 transition-all active:scale-95"
              >
                Access Dashboard
              </button>
              <button 
                onClick={() => scrollTo('features')}
                className="px-10 py-5 bg-white/5 border border-white/10 text-slate-300 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3"
              >
                View Analytics
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* 3D Workspace Device Mockup */}
          <div className="flex-1 relative flex justify-center items-center perspective-1000 group">
            <div className="relative w-full max-w-xl aspect-[4/3] transform rotate-y-[-10deg] rotate-x-[5deg] transition-all duration-1000 group-hover:rotate-y-[0deg] group-hover:rotate-x-[0deg] group-hover:scale-105">
              
              {/* Image Container */}
              <div className="absolute inset-0 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop" 
                  alt="Workspace Schedule" 
                  className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                
                {/* Overlay UI elements to mimic a schedule interface */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                     <div className="flex justify-between items-center">
                       <div className="h-2 w-24 bg-sky-400 rounded-full" />
                       <div className="h-4 w-4 bg-sky-500 rounded shadow-lg shadow-sky-500/50" />
                     </div>
                     <div className="grid grid-cols-4 gap-2">
                       {['MATH', 'ART', 'SCI', 'ENG', 'HIST', 'PHYS', 'MUS', 'LAB'].map((name, i) => (
                         <div key={i} className="h-10 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-[8px] font-black text-slate-300">
                            {name}
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              </div>

              {/* Floating "Draggable" Class Chips */}
              <div className="absolute -top-10 left-10 z-20 px-4 py-2 bg-indigo-600 rounded-full border border-white/20 shadow-2xl text-[10px] font-black uppercase tracking-widest text-white animate-float cursor-move" style={{ animationDelay: '0.5s' }}>
                Math G1
              </div>
              <div className="absolute top-1/2 -right-16 z-20 px-4 py-2 bg-teal-500 rounded-full border border-white/20 shadow-2xl text-[10px] font-black uppercase tracking-widest text-white animate-float cursor-move" style={{ animationDelay: '1.5s' }}>
                Science G3
              </div>
              <div className="absolute -bottom-8 right-12 z-20 px-4 py-2 bg-amber-500 rounded-full border border-white/20 shadow-2xl text-[10px] font-black uppercase tracking-widest text-white animate-float cursor-move" style={{ animationDelay: '2.5s' }}>
                History G2
              </div>

              {/* Float Labels - Adjusted for visible positioning */}
              <div className="absolute top-8 right-0 z-30 p-4 border border-white/10 backdrop-blur-xl rounded-[1.5rem] bg-black/60 text-[9px] font-black uppercase tracking-widest text-sky-400 shadow-2xl group-hover:scale-110 transition-transform">
                CONFLICT-FREE LOGIC
              </div>
              <div className="absolute bottom-16 left-0 z-30 p-4 border border-white/10 backdrop-blur-xl rounded-[1.5rem] bg-black/60 text-[9px] font-black uppercase tracking-widest text-teal-400 shadow-2xl group-hover:scale-110 transition-transform">
                BALANCED LOAD
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="mb-20 text-center space-y-4">
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em]">System Architecture</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Institutional Stability</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { 
               title: "AI Optimization", 
               desc: "Gemini 3 Flash reasoning resolves teacher conflicts and ensures subject variety automatically across 5-day cycles.",
               icon: "M13 10V3L4 14h7v7l9-11h-7z",
               color: "text-sky-400"
             },
             { 
               title: "Health Audits", 
               desc: "Real-time diagnostics monitor faculty burnout risks and institutional operational integrity scores.",
               icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
               color: "text-teal-400"
             },
             { 
               title: "Resource Maps", 
               desc: "Sync textbooks and curriculum targets directly to your timetable for 100% pacing transparency.",
               icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
               color: "text-indigo-400"
             }
           ].map((feat, i) => (
             <div key={i} className="bg-white/[0.03] border-glow-cyan p-12 rounded-[3.5rem] backdrop-blur-xl transition-all hover:translate-y-[-8px] flex flex-col gap-8 group">
               <div className="w-16 h-16 rounded-[1.8rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-sky-500/10 transition-colors">
                 <svg className={`w-8 h-8 ${feat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feat.icon} />
                 </svg>
               </div>
               <div className="space-y-4">
                 <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">{feat.title}</h3>
                 <p className="text-slate-400 text-sm leading-relaxed font-medium">{feat.desc}</p>
               </div>
               <div className="pt-4 mt-auto">
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-sky-500/40 w-1/4 animate-pulse-soft" />
                 </div>
               </div>
             </div>
           ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-32 bg-black/40 border-y border-white/5">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-16 flex flex-col lg:flex-row items-center gap-24">
          <div className="flex-1 space-y-12">
            <h2 className="text-5xl lg:text-[6rem] font-medium font-serif italic text-sky-400 leading-none">The Future of <br/> Pedagogy.</h2>
            <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-xl">
              EduPlanner handles the technical complexity of school governance. We believe administrators should focus on curriculum and culture, while we manage the logic.
            </p>
            <div className="space-y-8">
              {[
                { label: "Stability", val: "Enterprise", desc: "Military-grade data synchronization." },
                { label: "Efficiency", val: "Optimal", desc: "Automate months of manual entry." },
                { label: "UI Experience", val: "Elite", desc: "Designed for high-performance leadership." }
              ].map((stat, i) => (
                <div key={i} className="flex gap-10 items-center">
                  <span className="text-4xl font-black text-white/10">{stat.val}</span>
                  <div>
                    <h4 className="text-sm font-black uppercase text-white tracking-widest">{stat.label}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{stat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* About Section Visual: Computer Screen Schedule */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-sky-500/20 blur-[120px] rounded-full group-hover:bg-sky-500/30 transition-all duration-1000" />
            <div className="relative rounded-[4rem] overflow-hidden border border-white/20 p-2 bg-slate-900 shadow-2xl transition-all duration-700 group-hover:scale-[1.02]">
              <div className="aspect-[16/10] bg-slate-800 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=2070&auto=format&fit=crop" 
                  alt="Institutional Schedule Display" 
                  className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                
                {/* Visual Schedule Overlay on the screen */}
                <div className="absolute inset-0 flex flex-col p-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                   <div className="flex justify-between items-center mb-6">
                      <div className="h-4 w-32 bg-sky-400/30 rounded-full" />
                      <div className="flex gap-2">
                        {[1,2,3].map(i => <div key={i} className="h-3 w-3 rounded-full bg-white/20" />)}
                      </div>
                   </div>
                   <div className="grid grid-cols-5 gap-3 flex-1">
                      {Array.from({length: 15}).map((_, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                          <div className={`h-1/2 w-3/4 rounded-lg ${i % 3 === 0 ? 'bg-indigo-500/20' : 'bg-sky-500/10'}`} />
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em] mb-4">Pricing Model</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Enterprise Scaling</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
           {[
             { 
               plan: "Standard", 
               price: "Free", 
               desc: "Ideal for individual department leads or smaller academies.",
               features: ["Cloud Synchronization", "Conflict Auditing", "Manual Grid Refinement"]
             },
             { 
               plan: "Institutional", 
               price: "Inquire", 
               desc: "Full-scale administrative oversight for large campuses.",
               features: ["Gemini AI Scheduling", "Faculty Burnout Diagnostics", "Curriculum Roadmap Sync", "Premium Infrastructure"]
             }
           ].map((tier, i) => (
             <div key={i} className={`p-12 rounded-[3.5rem] border-2 flex flex-col gap-10 transition-all hover:scale-[1.02] ${i === 1 ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_20px_50px_rgba(14,165,233,0.3)]' : 'bg-white/5 border-white/10'}`}>
                <div className="space-y-2">
                  <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] ${i === 1 ? 'text-slate-900' : 'text-sky-500'}`}>{tier.plan}</h4>
                  <div className="text-4xl font-black uppercase tracking-tighter">{tier.price}</div>
                </div>
                <p className={`text-sm font-medium leading-relaxed ${i === 1 ? 'text-slate-800' : 'text-slate-400'}`}>{tier.desc}</p>
                <div className="space-y-4 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <svg className={`w-4 h-4 ${i === 1 ? 'text-slate-900' : 'text-sky-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">{f}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={onEnter}
                  className={`w-full py-5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${i === 1 ? 'bg-slate-950 text-white hover:bg-slate-900' : 'bg-white text-slate-950 hover:bg-sky-400'}`}
                >
                  Request Onboarding
                </button>
             </div>
           ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 lg:px-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-black/60">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          EduPlanner Pro • Smarter Institutional Infrastructure
        </div>
        <div className="bg-black/80 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
          <div className="w-4 h-4 rounded bg-sky-500/20 flex items-center justify-center text-sky-400 text-[8px]">
            AI
          </div>
          Active Optimization Engaged
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-[-10deg] { transform: rotateY(-10deg); }
        .rotate-x-[5deg] { transform: rotateX(5deg); }
        .group:hover .rotate-y-\[0deg\] { transform: rotateY(0deg) rotateX(0deg); }
      `}} />

    </div>
  );
};

export default LandingPage;