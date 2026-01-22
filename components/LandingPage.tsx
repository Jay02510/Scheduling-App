
import React, { useState } from 'react';
import { Language } from '../types';
import LegalModal from './LegalModal';

interface LandingPageProps {
  onEnter: () => void;
  language: Language;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, language }) => {
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
              <button onClick={() => scrollTo('about')} className="hover:text-white transition-colors">{isKo ? '우리의 비전' : 'Our Vision'}</button>
              <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">{isKo ? '가격' : 'Pricing'}</button>
            </div>
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
      </nav>

      {/* Hero Content */}
      <section id="hero" className="relative z-10 pt-56 pb-32 px-6 lg:px-16 max-w-screen-2xl mx-auto min-h-screen flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
          <div className="flex-1 space-y-8 text-left max-w-3xl">
            <div className="flex items-center gap-3 animate-fadeIn">
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
                {isKo ? '분석 도구 보기' : 'View Analytics'}
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
                        <span className="text-[8px] font-black text-sky-400 tracking-widest uppercase">{isKo ? '여기에 수업을 드롭하세요' : 'Drop Class Here'}</span>
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
              <div className="absolute bottom-1/3 -left-12 z-20 px-5 py-2.5 bg-amber-500 rounded-full border border-white/20 shadow-2xl text-[10px] font-black uppercase tracking-widest text-white animate-float cursor-move" style={{ animationDelay: '2.5s' }}>
                History G2
              </div>

              <div className="absolute top-4 right-4 z-30 p-3.5 border border-white/10 backdrop-blur-xl rounded-[1.2rem] bg-black/70 text-[9px] font-black uppercase tracking-widest text-sky-400 shadow-2xl group-hover:scale-105 transition-transform">
                {isKo ? '충돌 없는 로직' : 'CONFLICT-FREE LOGIC'}
              </div>
              <div className="absolute bottom-8 left-4 z-30 p-3.5 border border-white/10 backdrop-blur-xl rounded-[1.2rem] bg-black/70 text-[9px] font-black uppercase tracking-widest text-teal-400 shadow-2xl group-hover:scale-105 transition-transform">
                {isKo ? '균형 잡힌 부하' : 'BALANCED LOAD'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - REDESIGNED */}
      <section id="pricing" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em]">{isKo ? '가격 모델' : 'Pricing Model'}</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{isKo ? '기관 규모별 맞춤 솔루션' : 'Enterprise Scaling'}</h3>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">{isKo ? '개인 관리자를 위한 무료 도구부터 대규모 교육기관을 위한 AI 자동화까지.' : 'From manual tools for individual admins to full-scale AI automation for global campuses.'}</p>
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
                <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 opacity-50">{isKo ? '포함 사항:' : 'Includes:'}</h5>
                {[
                  { en: "Manual Drag-and-Drop Editor", ko: "수동 드래그 앤 드롭 편집기" },
                  { en: "Basic Conflict Red Flags", ko: "기초적인 충돌 경고 시스템" },
                  { en: "Cloud Profile Sync", ko: "클라우드 프로필 동기화" },
                  { en: "Standard PDF Export", ko: "표준 PDF 내보내기" },
                  { en: "Single School Profile", ko: "단일 학교 프로필 관리" }
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
                <h5 className="text-[10px] font-black text-slate-950 uppercase tracking-widest mb-4 opacity-50">{isKo ? '프리미엄 기능:' : 'Premium Logic:'}</h5>
                {[
                  { en: "Gemini AI Master Scheduling", ko: "Gemini AI 마스터 스케줄링" },
                  { en: "Faculty Burnout Diagnostics", ko: "교직원 번아웃 정밀 진단" },
                  { en: "Natural Language Sync (Tuning)", ko: "자연어 기반 세부 규칙 설정" },
                  { en: "Curriculum Roadmap Automation", ko: "교과과정 진도 자동 로드맵" },
                  { en: "Multi-User Campus Access", ko: "다중 사용자 캠퍼스 접근 권한" }
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
                {isKo ? '온보딩 요청' : 'Request Enterprise Demo'}
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
                <button onClick={() => openLegal('compliance')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '법적 준수' : 'Compliance'}</button>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{isKo ? '기관용' : 'Institutional'}</h4>
              <div className="bg-black/80 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
                <div className="w-4 h-4 rounded bg-sky-500/20 flex items-center justify-center text-sky-400 text-[8px]">AI</div>
                {isKo ? '최적화 활성화됨' : 'Optimization Active'}
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
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Optimized for Enterprise</span>
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
