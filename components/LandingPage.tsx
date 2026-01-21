
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
              <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">How it Works</button>
              <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Pricing</button>
            </div>
          </div>
          <button 
            onClick={onEnter}
            className="bg-white text-slate-950 px-7 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-sky-400 transition-all flex items-center gap-2 group shadow-lg"
          >
            Go to App
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <section id="hero" className="relative z-10 pt-56 pb-32 px-6 lg:px-16 max-w-screen-2xl mx-auto min-h-screen flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-12 text-left">
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <p className="text-sky-500 font-black tracking-[0.4em] uppercase text-[10px]">Smart School Scheduling</p>
            </div>
            
            <h1 className="text-6xl md:text-[6.5rem] font-medium tracking-tighter leading-[0.9] max-w-4xl uppercase">
              Build your <br/>
              <span className="font-serif italic text-glow-cyan text-sky-400 lowercase">perfect schedule</span> <br/>
              in just a few <br/>
              <span className="font-serif italic text-glow-cyan text-sky-400 lowercase">clicks.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
              Stop fighting with messy spreadsheets. EduPlanner uses AI to create clash-free timetables that balance teacher workloads and track your lesson progress automatically.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <button 
                onClick={onEnter}
                className="px-10 py-5 bg-sky-600/10 border border-sky-500/40 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] backdrop-blur-md shadow-[0_0_30px_rgba(14,165,233,0.15)] hover:bg-sky-600/20 hover:shadow-[0_0_40px_rgba(14,165,233,0.3)] transition-all active:scale-95"
              >
                Start Planning Free
              </button>
              <button 
                onClick={() => scrollTo('features')}
                className="px-10 py-5 bg-white/5 border border-white/10 text-slate-300 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3"
              >
                Learn More
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Abstract HUD Element */}
          <div className="flex-1 relative hidden lg:flex justify-center items-center">
            <div className="relative w-96 h-96">
               <svg className="w-full h-full animate-pulse-soft" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(14, 165, 233, 0.1)" strokeWidth="0.5" strokeDasharray="4 4" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="10" fill="none" stroke="#0ea5e9" strokeWidth="2" />
                  <circle cx="100" cy="100" r="4" fill="#0ea5e9" />
               </svg>
               <div className="absolute top-0 right-0 p-5 border border-white/10 backdrop-blur-xl rounded-[2rem] bg-black/40 text-[9px] font-black uppercase tracking-widest text-sky-400 shadow-2xl">
                 Auto-Optimization
               </div>
               <div className="absolute bottom-10 left-[-10%] p-5 border border-white/10 backdrop-blur-xl rounded-[2rem] bg-black/40 text-[9px] font-black uppercase tracking-widest text-teal-400 shadow-2xl">
                 Balanced Workloads
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="mb-20 text-center">
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em] mb-4">Core Features</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Everything for your School</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { 
               title: "AI Scheduling", 
               desc: "Let our smart engine find the best time for every class. It handles teacher availability and room limits automatically.",
               icon: "M13 10V3L4 14h7v7l9-11h-7z",
               color: "text-sky-400"
             },
             { 
               title: "Staff Wellbeing", 
               desc: "Ensure every teacher has fair breaks and a manageable workload. Avoid burnout with built-in stress checks.",
               icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
               color: "text-teal-400"
             },
             { 
               title: "Curriculum Tracking", 
               desc: "Keep your teaching on pace. Connect textbooks to your timetable and watch progress across all grade levels.",
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
            <h2 className="text-5xl lg:text-[6rem] font-medium font-serif italic text-sky-400 leading-none">Focus on <br/> Teaching.</h2>
            <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-xl">
              EduPlanner handles the heavy lifting of school administration. Create schedules that actually work for teachers and students, without the headache.
            </p>
            <div className="space-y-8">
              {[
                { label: "Stability", val: "100%", desc: "Reliable schedules you can trust." },
                { label: "Efficiency", val: "Fast", desc: "Save weeks of administrative planning." },
                { label: "Ease of Use", val: "Easy", desc: "No complex training required. Just start." }
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
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-sky-500/20 blur-[120px] rounded-full group-hover:bg-sky-500/30 transition-all duration-1000" />
            <div className="relative rounded-[4rem] overflow-hidden border border-white/20 p-2 bg-slate-900 shadow-2xl transition-all duration-700 group-hover:scale-[1.02]">
              <div className="aspect-video bg-slate-800 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop" 
                  alt="Interface" 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div onClick={onEnter} className="w-24 h-24 bg-sky-500/80 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
                      <svg className="w-10 h-10 text-white fill-current ml-1" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
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
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em] mb-4">Pricing</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Ready to Start?</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
           {[
             { 
               plan: "Standard", 
               price: "Free", 
               desc: "Perfect for single departments or small schools.",
               features: ["Conflict Checking", "Weekly Schedule View", "Cloud Storage", "Standard Support"]
             },
             { 
               plan: "Professional", 
               price: "Contact Us", 
               desc: "Full school management with advanced AI planning and curriculum audits.",
               features: ["AI Auto-Scheduling", "Wellbeing Audits", "Textbook Tracking", "Full Analytics", "High-Priority Support"]
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
                  Get Started
                </button>
             </div>
           ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 lg:px-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-black/60">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          EduPlanner Pro • Smarter School Planning
        </div>
        <div className="bg-black/80 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
          <div className="w-4 h-4 rounded bg-sky-500/20 flex items-center justify-center text-sky-400 text-[8px]">
            A
          </div>
          Ready for Planning
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
