
import React, { useState } from 'react';
import { Language } from '../types';
import LegalModal from './LegalModal';
import BetaCodeModal from './BetaCodeModal';

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
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);

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

  const features = [
    {
      title: isKo ? "AI 위버 로직" : "AI Weaver Logic",
      desc: isKo ? "Gemini Pro의 추론력을 사용하여 단 몇 초 만에 수만 가지의 시간표 조합을 분석하고 최적의 결과를 도출합니다." : "Leverage Gemini Pro's reasoning to analyze thousands of permutations and deliver a conflict-free master schedule in seconds.",
      icon: "M13 10V3L4 14h7v7l9-11h-7z"
    },
    {
      title: isKo ? "전략적 감사 엔진" : "Strategic Audit Engine",
      desc: isKo ? "단순한 시간표를 넘어, 교사 번아웃 위험도와 교육과정 달성 가능성을 수치화하여 기관의 건강도를 측정합니다." : "Go beyond slots. Measure institutional health by quantifying faculty burnout risks and curriculum pacing confidence.",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    },
    {
      title: isKo ? "커리큘럼 로드맵" : "Curriculum Roadmap",
      desc: isKo ? "교과서 단원과 주간 진도를 자동으로 매칭하여 연간 학사 일정에 맞춘 완벽한 교육 흐름을 설계합니다." : "Automatically match textbook units and weekly progress to create a seamless instructional flow across the academic year.",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    },
    {
      title: isKo ? "기관용 인프라" : "Enterprise Infra",
      desc: isKo ? "대규모 캠퍼스와 다수의 교직원을 관리할 수 있는 클라우드 기반의 통합 행정 감독 시스템을 제공합니다." : "A cloud-native oversight system built to scale for multi-campus management and diverse faculty populations.",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#020617] text-white overflow-x-hidden font-inter selection:bg-sky-500/30">
      
      {/* Background Grid & Decorative Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-sky-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/10 blur-[150px] rounded-full" />
      </div>

      {/* Floating Pill Navigation */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-4">
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
              {isKo ? '플랫폼 시작하기' : 'Launch Platform'}
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <section id="hero" className="relative z-10 pt-56 pb-20 px-6 lg:px-16 max-w-screen-2xl mx-auto min-h-[90vh] flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
          <div className="flex-1 space-y-8 text-left max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <p className="text-sky-500 font-black tracking-[0.5em] uppercase text-[10px]">{isKo ? '기관급 자동화 시스템' : 'Institutional Grade Automation'}</p>
            </div>
            
            <h1 className="text-5xl md:text-[5.5rem] font-black tracking-tighter leading-[0.95] uppercase">
              {isKo ? <>가장 완벽한 <br/><span className="font-serif italic text-glow-cyan text-sky-400 normal-case">시간표</span>를 <br/>단 몇 번의 클릭으로.</> : <>BUILD YOUR <br/><span className="font-serif italic text-glow-cyan text-sky-400 normal-case">PERFECT SCHEDULE</span> <br/>IN JUST A FEW CLICKS.</>}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
              {isKo 
                ? '정밀한 기관 운영 흐름을 설계하세요. 더 이상 복잡한 스프레드시트와 씨름할 필요가 없습니다. EduPlanner는 Gemini AI를 활용하여 균형 잡힌 인간 중심의 시간표를 생성합니다.' 
                : 'Design your institutional flow with precision. Stop fighting spreadsheets—EduPlanner leverages Gemini AI to generate balanced, human-centric schedules.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <button 
                onClick={onEnter}
                className="px-10 py-5 bg-sky-500 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(14,165,233,0.5)] hover:scale-105 transition-all active:scale-95"
              >
                {isKo ? '대시보드 접속' : 'Access Dashboard'}
              </button>
              <button 
                onClick={() => scrollTo('features')}
                className="px-10 py-5 bg-white/5 border border-white/10 text-slate-300 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3"
              >
                {isKo ? '기능 살펴보기' : 'Explore Features'}
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Device Mockup */}
          <div className="flex-1 relative perspective-1000 group hidden lg:block">
            <div className="relative w-full max-w-xl aspect-[4/3] transform rotate-y-[-10deg] rotate-x-[5deg] transition-all duration-1000 group-hover:rotate-y-[0deg] group-hover:rotate-x-[0deg]">
              <div className="absolute inset-0 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-xl">
                <img 
                  src="https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=2070&auto=format&fit=crop" 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover grayscale opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute inset-0 p-12 flex flex-col justify-end">
                  <div className="space-y-4">
                     <div className="h-2 w-32 bg-sky-400/50 rounded-full" />
                     <div className="h-4 w-64 bg-white/10 rounded-full" />
                     <div className="grid grid-cols-4 gap-2 pt-4">
                       {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl border border-white/5" />)}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Ledger */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-black/20">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-16 flex flex-wrap justify-center md:justify-between items-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded bg-sky-500/20 flex items-center justify-center text-sky-400 font-black text-[10px]">AI</div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Guardian Core v2.5</span>
           </div>
           <div className="flex items-center gap-4">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">GDPR & PIPA Compliant</span>
           </div>
           <div className="flex items-center gap-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Google Cloud Infra</span>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="text-center mb-24 space-y-4">
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em]">{isKo ? '주요 인텔리전스' : 'Key Intelligence'}</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{isKo ? '행정의 한계를 넘어서' : 'Transcending Admin Limits'}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] space-y-6 hover:bg-white/[0.08] transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={f.icon} />
                </svg>
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-black uppercase tracking-tight text-white">{f.title}</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em]">{isKo ? '가격 모델' : 'Pricing Model'}</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{isKo ? '기관 규모별 맞춤 솔루션' : 'Enterprise Scaling'}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto gap-8">
           {/* FREE TIER */}
           <div className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] flex flex-col gap-10 transition-all hover:bg-white/[0.08] group">
              <div className="space-y-4">
                <div className="inline-flex px-4 py-1.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                  {isKo ? '수동 관리' : 'Manual Management'}
                </div>
                <h4 className="text-4xl font-black uppercase tracking-tighter">{isKo ? '무료' : 'Free'}</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">{isKo ? '개별 학과장이나 소규모 아카데미에 적합한 강력한 시간표 편집 도구입니다.' : 'Powerful manual grid tools for individual department leads or small local academies.'}</p>
              </div>

              <div className="space-y-4 flex-1">
                {[
                  { en: "Manual Drag-and-Drop Editor", ko: "수동 드래그 앤 드롭 편집기" },
                  { en: "Basic Conflict Red Flags", ko: "기초적인 충돌 경고 시스템" },
                  { en: "Cloud Profile Sync", ko: "클라우드 프로필 동기화" },
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
                {isKo ? '지금 시작하기' : 'Start Designing'}
              </button>
           </div>

           {/* INSTITUTIONAL TIER */}
           <div className="bg-sky-500 text-slate-950 border-2 border-sky-400 p-12 rounded-[3.5rem] flex flex-col gap-10 transition-all shadow-[0_40px_80px_-20px_rgba(14,165,233,0.4)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                 <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-sky-400 font-black text-xs shadow-2xl animate-pulse">AI</div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="inline-flex px-4 py-1.5 rounded-full bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest">
                  {isKo ? 'AI 자동화' : 'AI Autonomous'}
                </div>
                <h4 className="text-4xl font-black uppercase tracking-tighter">{isKo ? '문의' : 'Inquire'}</h4>
                <p className="text-sm font-medium text-slate-900 leading-relaxed">{isKo ? '대규모 캠퍼스를 위한 완전한 행정 감독 및 지능형 최적화 인프라입니다.' : 'Full administrative oversight and intelligent optimization infrastructure for large campuses.'}</p>
              </div>

              <div className="space-y-4 flex-1 relative z-10">
                {[
                  { en: "Gemini AI Master Scheduling", ko: "Gemini AI 마스터 스케줄링" },
                  { en: "Faculty Burnout Diagnostics", ko: "교직원 번아웃 정밀 진단" },
                  { en: "Natural Language Sync (Tuning)", ko: "자연어 기반 세부 규칙 설정" },
                  { en: "Curriculum Roadmap Automation", ko: "교과과정 진도 자동 로드맵" }
                ].map((f, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-slate-950/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{isKo ? f.ko : f.en}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mt-auto">
                <button onClick={onEnter} className="w-full py-5 rounded-full bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all relative z-10">
                  {isKo ? '온보딩 요청' : 'Request Enterprise Demo'}
                </button>
                <button 
                  onClick={() => setIsBetaModalOpen(true)}
                  className="w-full text-[9px] font-black text-slate-900 uppercase tracking-widest hover:underline transition-all"
                >
                  {isKo ? '초대 코드가 있으신가요? (베타)' : 'Have an invite code? (Beta)'}
                </button>
              </div>
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
                <button onClick={() => openLegal('compliance')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '법적 준수' : 'Compliance'}</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
            © {new Date().getFullYear()} EduPlanner Pro. All Rights Reserved.
          </div>
          <div className="flex gap-8">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Guardian Core v2.5</span>
          </div>
        </div>
      </footer>

      <LegalModal 
        isOpen={legalView.isOpen} 
        onClose={() => setLegalView({ ...legalView, isOpen: false })} 
        language={language}
        type={legalView.type}
      />

      {userId && (
        <BetaCodeModal 
          isOpen={isBetaModalOpen} 
          onClose={() => setIsBetaModalOpen(false)} 
          userId={userId} 
          language={language} 
          onSuccess={() => {
            alert(isKo ? "베타 액세스가 활성화되었습니다!" : "Beta access activated!");
            onEnter();
          }}
        />
      )}

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
