
import React, { useState } from 'react';
import { Language } from '../types';
import LegalModal from './LegalModal';

interface LandingPageProps {
  onEnter: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  userId?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, language, setLanguage, userId }) => {
  const [legalView, setLegalView] = useState<{ isOpen: boolean, type: 'privacy' | 'terms' | 'compliance' }>({
    isOpen: false,
    type: 'privacy'
  });

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openLegal = (type: 'privacy' | 'terms' | 'compliance') => {
    setLegalView({ isOpen: true, type });
  };

  const isKo = language === 'ko';

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
              <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">{isKo ? '인텔리전스' : 'Intelligence'}</button>
              <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">{isKo ? '가격' : 'Pricing'}</button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
               <button onClick={() => setLanguage('ko')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${language === 'ko' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>KR</button>
               <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${language === 'en' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>EN</button>
            </div>
            <button 
              onClick={onEnter}
              className="bg-white text-slate-950 px-7 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-sky-400 transition-all flex items-center gap-2 group shadow-lg"
            >
              {isKo ? '체험판 시작' : 'Try Free Demo'}
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <section id="hero" className="relative z-10 pt-56 pb-32 px-6 lg:px-16 max-w-screen-2xl mx-auto min-h-screen flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
          <div className="flex-1 space-y-8 text-left max-w-3xl">
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <p className="text-sky-500 font-black tracking-[0.5em] uppercase text-[10px]">{isKo ? '지능형 교육 행정 시스템' : 'Intelligent Educational OS'}</p>
            </div>
            
            <h1 className="text-5xl md:text-[5.5rem] font-black tracking-tighter leading-[0.95] uppercase">
              {isKo ? <>가장 완벽한 <br/><span className="font-serif italic text-glow-cyan text-sky-400 normal-case">시간표</span>를 <br/>무료로 경험하세요.</> : <>BUILD YOUR <br/><span className="font-serif italic text-glow-cyan text-sky-400 normal-case">PERFECT SCHEDULE</span> <br/>FOR FREE.</>}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
              {isKo 
                ? '복잡한 교육과정 설계를 AI에게 맡기세요. EduPlanner는 Gemini AI를 활용하여 충돌 없는 최적의 시간표를 실시간으로 제안합니다. 지금 바로 3개 학급까지 무료로 시작해보세요.' 
                : 'Offload complex curriculum design to AI. EduPlanner leverages Gemini to suggest conflict-free master schedules in real-time. Start for free with up to 3 classes today.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <button 
                onClick={onEnter}
                className="px-10 py-5 bg-sky-500 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(14,165,233,0.5)] hover:scale-105 transition-all active:scale-95"
              >
                {isKo ? '체험판 대시보드' : 'Start Free Demo'}
              </button>
              <button 
                onClick={() => scrollTo('pricing')}
                className="px-10 py-5 bg-white/5 border border-white/10 text-slate-300 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3"
              >
                {isKo ? '요금제 보기' : 'View Pricing'}
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 3D Workspace Device Mockup */}
          <div className="flex-1 relative flex justify-center items-center perspective-1000 group">
            <div className="relative w-full max-w-xl aspect-[4/3] transform rotate-y-[-10deg] rotate-x-[5deg] transition-all duration-1000 group-hover:rotate-y-[0deg] group-hover:rotate-x-[0deg] group-hover:scale-105">
              
              <div className="absolute inset-0 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=2070&auto=format&fit=crop" 
                  alt="Workspace Dashboard" 
                  className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                
                <div className="absolute inset-0 p-12 flex flex-col justify-center items-center pointer-events-none">
                  <div className="w-full max-w-md bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                     <div className="flex justify-between items-center">
                       <div className="h-2 w-24 bg-sky-400/50 rounded-full" />
                       <div className="h-4 w-4 bg-sky-500/40 rounded shadow-lg" />
                     </div>
                     <div className="grid grid-cols-4 gap-2 opacity-30">
                       {['MATH', 'ART', 'SCI', 'ENG', 'HIST', 'PHYS', 'MUS', 'LAB'].map((name, i) => (
                         <div key={i} className="h-10 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center text-[8px] font-black text-slate-300">
                            {name}
                         </div>
                       ))}
                     </div>
                     <div className="h-12 border-2 border-dashed border-sky-500/50 rounded-xl bg-sky-500/5 flex items-center justify-center">
                        <span className="text-[8px] font-black text-sky-400 tracking-widest uppercase">{isKo ? 'AI 최적화 실행 중' : 'AI OPTIMIZING...'}</span>
                     </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/4 -left-8 z-20 px-5 py-2.5 bg-indigo-600 rounded-full border border-white/20 shadow-2xl text-[10px] font-black uppercase tracking-widest text-white animate-float cursor-move" style={{ animationDelay: '0.5s' }}>
                Math G1
              </div>
              <div className="absolute top-1/2 -right-4 z-20 px-5 py-2.5 bg-teal-500 rounded-full border border-white/20 shadow-2xl text-[10px] font-black uppercase tracking-widest text-white animate-float cursor-move" style={{ animationDelay: '1.5s' }}>
                Science G3
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em]">{isKo ? '가격 모델' : 'Pricing Model'}</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{isKo ? '모두를 위한 AI 시간표' : 'AI Scheduling for Everyone'}</h3>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">{isKo ? '개인 관리자를 위한 무료 체험판부터 대규모 교육기관을 위한 AI 자동화까지.' : 'From free tools for small schools to full-scale AI automation for global campuses.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto gap-8">
           {/* FREE STARTER TIER */}
           <div className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] flex flex-col gap-10 transition-all hover:bg-white/[0.08] group">
              <div className="space-y-4">
                <div className="inline-flex px-4 py-1.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                  {isKo ? '체험판' : 'Starter'}
                </div>
                <h4 className="text-4xl font-black uppercase tracking-tighter">{isKo ? '0원' : '$0'}</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">{isKo ? 'AI 시간표의 강력함을 직접 경험해보세요. 소규모 학급 관리에 최적화되어 있습니다.' : 'Experience the power of AI scheduling. Perfect for testing logic with small school groups.'}</p>
              </div>

              <div className="space-y-4 flex-1">
                <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 opacity-50">{isKo ? '포함 사항:' : 'Includes:'}</h5>
                {[
                  { en: "Up to 3 Classes AI Sync", ko: "최대 3개 학급 AI 동기화" },
                  { en: "Manual Drag-and-Drop Editor", ko: "수동 드래그 앤 드롭 편집기" },
                  { en: "Basic Conflict Detection", ko: "기초 충돌 감지 시스템" },
                  { en: "Standard PDF Export", ko: "표준 PDF 내보내기" }
                ].map((f, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-sky-500/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{isKo ? f.ko : f.en}</span>
                  </div>
                ))}
              </div>

              <button onClick={onEnter} className="w-full py-5 rounded-full bg-white text-slate-950 text-[11px] font-black uppercase tracking-widest hover:bg-sky-400 transition-all">
                {isKo ? '체험판 시작하기' : 'Start Free Demo'}
              </button>
           </div>

           {/* INSTITUTIONAL TIER */}
           <div className="bg-sky-500 text-slate-950 border-2 border-sky-400 p-12 rounded-[3.5rem] flex flex-col gap-10 transition-all shadow-[0_40px_80px_-20px_rgba(14,165,233,0.4)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                 <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-sky-400 font-black text-xs shadow-2xl animate-pulse">PRO</div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="inline-flex px-4 py-1.5 rounded-full bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest">
                  {isKo ? '기관용' : 'Institutional'}
                </div>
                <h4 className="text-4xl font-black uppercase tracking-tighter">{isKo ? '문의' : 'Custom'}</h4>
                <p className="text-sm font-medium text-slate-900 leading-relaxed">{isKo ? '대규모 캠퍼스를 위한 완전한 행정 감독 및 지능형 최적화 인프라입니다.' : 'Full administrative oversight and intelligent optimization infrastructure for large campuses.'}</p>
              </div>

              <div className="space-y-4 flex-1 relative z-10">
                <h5 className="text-[10px] font-black text-slate-950 uppercase tracking-widest mb-4 opacity-50">{isKo ? '프리미엄 기능:' : 'Premium Logic:'}</h5>
                {[
                  { en: "Unlimited Classes AI Sync", ko: "무제한 학급 AI 동기화" },
                  { en: "Gemini 3 Pro Weaver Logic", ko: "Gemini 3 Pro 위버 로직" },
                  { en: "Faculty Burnout Diagnostics", ko: "교직원 번아웃 정밀 진단" },
                  { en: "Priority Support & Training", ko: "우선 지원 및 교육 서비스" }
                ].map((f, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-slate-950/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{isKo ? f.ko : f.en}</span>
                  </div>
                ))}
              </div>

              <button onClick={onEnter} className="w-full py-5 rounded-full bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all relative z-10">
                {isKo ? '상담 요청' : 'Contact Sales'}
              </button>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-24 px-6 lg:px-16 border-t border-white/5 bg-black/60">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                 <div className="w-3 h-3 bg-sky-400 rounded-full" />
              </div>
              <span className="text-lg font-black tracking-tight text-white uppercase">EduPlanner Pro</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 max-w-xs leading-relaxed">
              Smarter Institutional Infrastructure. Leveraging Gemini Intelligence for Educational Excellence.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{isKo ? '플랫폼' : 'Platform'}</h4>
              <div className="flex flex-col gap-4">
                <button onClick={() => scrollTo('features')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '인텔리전스' : 'Intelligence'}</button>
                <button onClick={() => scrollTo('pricing')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '가격' : 'Pricing'}</button>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{isKo ? '법적 고지' : 'Legal'}</h4>
              <div className="flex flex-col gap-4">
                <button onClick={() => openLegal('privacy')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '개인정보 처리방침' : 'Privacy Policy'}</button>
                <button onClick={() => openLegal('terms')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '이용약관' : 'Terms of Service'}</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
            © {new Date().getFullYear()} EduPlanner Pro. All Rights Reserved.
          </div>
        </div>
      </footer>

      <LegalModal 
        isOpen={legalView.isOpen} 
        onClose={() => setLegalView({ ...legalView, isOpen: false })} 
        language={language}
        type={legalView.type}
      />

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
