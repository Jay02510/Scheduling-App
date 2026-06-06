import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Layers, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  BookOpen, 
  Calendar, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Users,
  ShieldCheck,
  TrendingUp,
  Award,
  Globe,
  ChevronRight,
  MousePointerClick
} from 'lucide-react';
import { Language } from '../types';
import LegalModal from './LegalModal';

interface LandingPageProps {
  onEnter: () => void;
  onTryDemo: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  userId?: string;
  serviceError?: string;
}

interface SandboxSubject {
  id: string;
  name: string;
  nameKo: string;
  teacher: string;
  teacherKo: string;
  color: string;
  bgClass: string;
}

const LANDING_SUBJECTS: SandboxSubject[] = [
  { id: 'calc', name: 'AP Calculus', nameKo: '미적분학 AP', teacher: 'Dr. John Doe', teacherKo: '존 도 박사', color: '#6366f1', bgClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' },
  { id: 'hist', name: 'World History', nameKo: '세계사', teacher: 'Dr. John Doe', teacherKo: '존 도 박사', color: '#f59e0b', bgClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { id: 'chem', name: 'AP Chemistry', nameKo: '화학 AP', teacher: 'Dr. Sarah Kim', teacherKo: '김사라 박사', color: '#10b981', bgClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { id: 'music', name: 'Music Theory', nameKo: '음악 이론', teacher: 'Prof. Emily Post', teacherKo: '에밀리 포스트 교수', color: '#a855f7', bgClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onTryDemo, language, setLanguage, userId, serviceError }) => {
  const [legalView, setLegalView] = useState<{ isOpen: boolean, type: 'privacy' | 'terms' | 'compliance' }>({
    isOpen: false,
    type: 'privacy'
  });

  const [activeTab, setActiveTab] = useState<'weaver' | 'guardian' | 'resiliency'>('weaver');

  // Interactive Sandbox state
  const [selectedBrush, setSelectedBrush] = useState<SandboxSubject | null>(null);
  const [sandboxGrid, setSandboxGrid] = useState<{ [key: string]: SandboxSubject | null }>({
    'G9-period1': LANDING_SUBJECTS[0], // AP Calculus (John Doe)
    'G9-period2': null,
    'G9-period3': LANDING_SUBJECTS[2], // AP Chemistry (Sarah Kim)
    'G10-period1': null,
    'G10-period2': LANDING_SUBJECTS[1], // World History (John Doe - clean on period 2)
    'G10-period3': null,
  });

  const [sandboxResetCounter, setSandboxResetCounter] = useState(0);

  const handleCellClick = (cellId: string) => {
    setSandboxGrid(prev => ({
      ...prev,
      [cellId]: selectedBrush
    }));
  };

  const clearSandbox = () => {
    setSandboxGrid({
      'G9-period1': null,
      'G9-period2': null,
      'G9-period3': null,
      'G10-period1': null,
      'G10-period2': null,
      'G10-period3': null,
    });
    setSelectedBrush(null);
    setSandboxResetCounter(prev => prev + 1);
  };

  // Check conflicts in real-time
  const getConflicts = () => {
    const conflictsList: string[] = [];
    const periods = ['period1', 'period2', 'period3'];
    
    periods.forEach(p => {
      const g9Item = sandboxGrid[`G9-${p}`];
      const g10Item = sandboxGrid[`G10-${p}`];
      if (g9Item && g10Item && g9Item.teacher === g10Item.teacher) {
        const teacherName = language === 'ko' ? g9Item.teacherKo : g9Item.teacher;
        const g9Name = language === 'ko' ? g9Item.nameKo : g9Item.name;
        const g10Name = language === 'ko' ? g10Item.nameKo : g10Item.name;
        const periodNum = p.replace('period', '');
        
        conflictsList.push(
          language === 'ko' 
            ? `${teacherName} 교사가 9학년(${g9Name})과 10학년(${g10Name})에 ${periodNum}교시 중복 출강 상태입니다!`
            : `${teacherName} is double-booked for Grade 9 (${g9Name}) and Grade 10 (${g10Name}) at Period ${periodNum}!`
        );
      }
    });

    return conflictsList;
  };

  const conflicts = getConflicts();
  const isKo = language === 'ko';

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openLegal = (type: 'privacy' | 'terms' | 'compliance') => {
    setLegalView({ isOpen: true, type });
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-white overflow-x-hidden font-inter selection:bg-sky-500/30">
      
      {/* Background Interactive Ambient Field */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Futuristic Laser Matrix Grid */}
        <div className="absolute inset-0 bg-grid opacity-25" />
        {/* Neon Light Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[65%] h-[65%] bg-sky-500/10 blur-[130px] rounded-full animate-pulse-soft" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[65%] h-[65%] bg-indigo-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-slate-900/40 border border-indigo-500/5 blur-[90px] rounded-full" />
      </div>

      {/* Floating Futuristic Dock Header */}
      <nav className="fixed top-6 left-0 right-0 z-[100] px-4">
        <div className="max-w-6xl mx-auto bg-slate-950/75 backdrop-blur-2xl border border-slate-800/80 rounded-3xl py-3 px-5 flex items-center justify-between shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center p-[1px] shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-ping" />
                </div>
              </div>
              <span className="text-sm font-black tracking-[0.25em] text-white uppercase group-hover:text-sky-400 transition-colors">
                EduPlanner<span className="text-sky-400">.</span>Pro
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-[-2px]">
              <button onClick={() => scrollTo('sandbox')} className="hover:text-sky-400 transition-colors py-1 relative group">
                {isKo ? '라이브 체험' : 'Interactive Playground'}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-sky-400 group-hover:w-full transition-all duration-300" />
              </button>
              <button onClick={() => scrollTo('features')} className="hover:text-sky-400 transition-colors py-1 relative group">
                {isKo ? '인텔리전스 스펙' : 'Features'}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-sky-400 group-hover:w-full transition-all duration-300" />
              </button>
              <button onClick={() => scrollTo('pricing')} className="hover:text-sky-400 transition-colors py-1 relative group">
                {isKo ? '라이선싱' : 'Pricing'}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-sky-400 group-hover:w-full transition-all duration-300" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800/80">
              <button 
                onClick={() => setLanguage('ko')} 
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${language === 'ko' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                KR
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${language === 'en' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                EN
              </button>
            </div>
            <button 
              onClick={onEnter} 
              className="text-slate-400 hover:text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {isKo ? '로그인' : 'Sign In'}
            </button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onTryDemo}
              className="bg-white hover:bg-sky-400 text-slate-950 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-xl border border-white/20"
            >
              {isKo ? '체험판 시작' : 'Access Sandbox'}
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative z-10 pt-48 pb-20 px-6 lg:px-16 max-w-screen-2xl mx-auto min-h-screen flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-left animate-fadeIn animate-duration-500">
            {serviceError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-start gap-4 text-left shadow-[0_0_50px_rgba(244,63,94,0.1)] mb-4 border-glow-cyan"
              >
                <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-rose-200 uppercase tracking-widest">Platform Boot Warning</h4>
                  <p className="text-xs text-rose-300 font-medium leading-relaxed">{serviceError}</p>
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-sky-500/10 border border-sky-400/20 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
              <span className="text-sky-400 font-extrabold tracking-[0.3em] uppercase text-[9px]">
                {isKo ? '실시간 대화형 하이브리드 자동 최적화 플랫폼' : 'REAL-TIME CONSTRAINT-ORIENTED SCHEDULER'}
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-4xl sm:text-6xl xl:text-[5.5rem] font-black tracking-tight leading-[0.9] uppercase"
            >
              {isKo ? (
                <>
                  교육과정의 <br />
                  <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent italic font-serif text-glow-cyan normal-case">완전무결</span>한 <br />
                  시간표를 디자인하다.
                </>
              ) : (
                <>
                  WEAVE YOUR <br />
                  <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent italic font-serif text-glow-cyan normal-case">FLAWLESS MATRIX</span> <br />
                  IN REAL-TIME.
                </>
              )}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-base sm:text-lg text-slate-400 font-medium max-w-2xl leading-relaxed"
            >
              {isKo 
                ? '번거롭고 복잡한 교사 시간 중복과 시설 제약 조건 해결을 인공지능에게 위임하세요. EduPlanner Pro는 Gemini 지능형 솔버를 사용하여 충돌 없는 시간표와 교직원 번아웃 지표를 즉각 보고합니다.' 
                : 'Say goodbye to scheduling collisions and administrative burnout. EduPlanner Pro harnesses Gemini constraint-intelligence to suggest real-time optimal blueprints, protect faculty wellness, and export flawless compliance grids.'}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.button 
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onTryDemo}
                className="px-8 py-4.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_50px_-10px_rgba(14,165,233,0.4)] hover:shadow-[0_25px_60px_-8px_rgba(14,165,233,0.6)] transition-all flex items-center justify-center gap-3 border border-white/10"
              >
                <span>{isKo ? '무료 체험 시작하기' : 'Lauch Free Blueprint Sandbox'}</span>
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollTo('sandbox')}
                className="px-8 py-4.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
              >
                <span>{isKo ? '라이브 동작 시뮬레이터' : 'Play Live Simulator'}</span>
              </motion.button>
            </motion.div>

            {/* Quick trust metrics */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="pt-10 grid grid-cols-3 gap-8 border-t border-slate-900 max-w-lg"
            >
              <div>
                <p className="text-2xl font-black text-sky-400">0s</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{isKo ? '실시간 동기화 지연' : 'Conflict Check Lag'}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">99.8%</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{isKo ? '교원 탈진 보호율' : 'Burnout Protected'}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-400">Gemini</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{isKo ? '순수 지능형 인프라' : 'Deep Solver model'}</p>
              </div>
            </motion.div>
          </div>

          {/* Hero Right: 3D Hologram Interface Device Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.93, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="lg:col-span-5 relative flex justify-center items-center perspective-1000"
          >
            <div className="relative w-full max-w-md aspect-[4/4] group">
              {/* Outer decorative orbit line */}
              <div className="absolute inset-[-15px] border border-dashed border-sky-500/10 rounded-[3.5rem] animate-[spin_40s_linear_infinite] pointer-events-none" />
              <div className="absolute inset-[-40px] border border-sky-500/5 rounded-full animate-[spin_80s_linear_infinite] pointer-events-none" />

              {/* Main Holo Card Terminal */}
              <div className="relative bg-slate-950/80 border-2 border-indigo-500/20 shadow-[0_30px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-[3rem] p-8 space-y-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />
                
                {/* Simulated Screen Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">MASTER_COGNITION.SYS</span>
                  </div>
                  <span className="flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ONLINE
                  </span>
                </div>

                {/* Simulated Core Diagnostic chart */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2.5xl p-5 space-y-3.5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-10" />
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Faculty Load Matrix</span>
                    <span className="text-sky-400">92% OPTIMAL</span>
                  </div>
                  
                  {/* Vertical bar charts simulated */}
                  <div className="grid grid-cols-4 gap-4 pt-2">
                    {[
                      { l: 'Math', v: '85%', color: 'from-sky-500 to-indigo-600' },
                      { l: 'Science', v: '70%', color: 'from-teal-400 to-emerald-500' },
                      { l: 'Art', v: '40%', color: 'from-purple-500 to-pink-500' },
                      { l: 'Human', v: '95%', color: 'from-amber-400 to-rose-500' }
                    ].map((item, id) => (
                      <div key={id} className="space-y-2 flex flex-col items-center">
                        <div className="w-full h-24 bg-slate-950 rounded-xl relative overflow-hidden flex items-end border border-slate-800">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: item.v }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className={`w-full bg-gradient-to-t ${item.color} rounded-t-lg`} 
                          />
                        </div>
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">{item.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom interactive recommendation badge */}
                <div className="p-4 bg-sky-500/5 border border-sky-500/25 rounded-2xl space-y-1 text-left">
                  <div className="flex items-center gap-2 text-sky-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">COGNITIVE RECOMMENDATION</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                    {isKo 
                      ? 'AP 미적분 강사가 7교시에 연속 배치되었습니다. 번아웃 보호 장치를 켜서 4교시로 순환을 제안합니다.' 
                      : 'AP Calculus instructor assigned back-to-back lessons. Shift Monday slot to Period 3 for optimal cognitive balance.'}
                  </p>
                </div>

                {/* Float-badge simulation */}
                <div className="absolute bottom-6 -right-5 transform rotate-6 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <div className="text-left">
                    <p className="text-[8px] font-black text-slate-500 uppercase">ACTIVE TEACHERS</p>
                    <p className="text-[11px] font-black text-white leading-none mt-0.5">24 REGULATED</p>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* INTERACTIVE PLAYGROUND (SANDBOX) SECTION */}
      <section id="sandbox" className="relative z-10 py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-slate-900">
        
        {/* Title Group */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex gap-2.5 px-3 py-1 bg-sky-500/10 border border-sky-400/20 rounded-full text-sky-400 text-[8.5px] font-black uppercase tracking-widest">
            {isKo ? '실시간 체험 부스' : 'NO-RISK LIVE DEMO'}
          </div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            {isKo ? '시간표 충돌 방지 엔진 체험하기' : 'TEACHER COLLISION PLAYGROUND'}
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {isKo 
              ? '아래 교과목을 클릭하여 시간표 슬롯 에 할당해 보세요. 동일 시간에 같은 교사가 중복 지정될 시, 지능형 엔진이 즉각적으로 경고를 전송합니다.' 
              : 'Pick a course brush from below, then click any grid cell in Grade 9 or 10. If teachers overlap in the same period, watch the logic collision safety warnings dynamically flare open!'}
          </p>
        </div>

        {/* Master Sandbox Console Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          
          {/* LEFT: COURSE BRUSH SELECTOR */}
          <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800/80 p-6 rounded-[2rem] space-y-6">
            <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase text-left flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-sky-400 animate-bounce" />
              1. {isKo ? '교과목 브러쉬 선택' : 'SELECT SUBJECT BRUSH'}
            </h4>
            
            <div className="flex flex-col gap-3">
              {LANDING_SUBJECTS.map((sub) => {
                const isSelected = selectedBrush?.id === sub.id;
                return (
                  <motion.button
                    key={sub.id}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedBrush(sub)}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'border-sky-400 bg-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.2)] text-white' 
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700/80 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Course Swatch */}
                      <span className="w-4 h-4 rounded-md border border-slate-900 shrink-0" style={{ backgroundColor: sub.color }} />
                      <div className="text-left">
                        <p className="text-xs font-black uppercase text-white leading-none">
                          {isKo ? sub.nameKo : sub.name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
                          {isKo ? sub.teacherKo : sub.teacher}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[7.5px] font-black bg-sky-500 text-slate-950 px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0">
                        {isKo ? '선택됨' : 'BRUSH ACTIVE'}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Clear button */}
            <button 
              onClick={clearSandbox}
              className="w-full py-3 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isKo ? '전체 초기화' : 'RESET SANDBOX'}
            </button>
          </div>

          {/* RIGHT: LIVE INTERACTIVE TIME MATRIX */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Real-time Warning Board */}
            <div className="min-h-[55px] flex items-center">
              <AnimatePresence mode="wait">
                {conflicts.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full bg-rose-500/10 border border-rose-500/35 p-3.5 rounded-2xl flex items-start gap-3.5 text-left"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce-short" />
                    <div>
                      <h5 className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">
                        {isKo ? '실시간 교직원 규칙 위반 감지' : 'RULE INTEGRITY FLUSH ERROR'}
                      </h5>
                      {conflicts.map((conf, index) => (
                        <p key={index} className="text-[11px] font-semibold text-rose-200 leading-relaxed uppercase tracking-tight">
                          • {conf}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={`okay-${sandboxResetCounter}`}
                    className="w-full bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center gap-3.5 text-left"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                        {isKo ? '가디언 모토: 안정성 확보됨' : 'SYSTEM HEALTH: 100% COMPLIANT'}
                      </h5>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {isKo ? '선생님 동선과 행정 규격이 충돌 없이 유지되고 있습니다. 마음 편히 추가 배치하세요.' : 'No overlaps detected. Teachers and classrooms occupy completely safe, isolated coordinates.'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Grid display */}
            <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-[2rem] overflow-hidden relative shadow-2xl">
              <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
                <span className="text-[9.5px] font-black tracking-widest text-slate-500 uppercase">
                  2. {isKo ? '선택과정 셀에 클릭하여 배치' : 'CLICK CELLS TO SET SCHEDULE'}
                </span>
                <span className="text-[8.5px] font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/25">
                  {selectedBrush ? (isKo ? `선택: ${selectedBrush.nameKo}` : `Brush: ${selectedBrush.name}`) : (isKo ? '브러쉬 선택 대기' : 'Active Brush: None')}
                </span>
              </div>

              {/* Grid element */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-900/30">
                      <th className="border border-slate-900 p-3.5 text-left text-[9px] font-black uppercase text-slate-500 tracking-wider w-28">
                        {isKo ? '대상 학급' : 'TARGET CLASS'}
                      </th>
                      <th className="border border-slate-900 p-3.5 text-center text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        1{isKo ? '교시' : 'st Period'}
                      </th>
                      <th className="border border-slate-900 p-3.5 text-center text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        2{isKo ? '교시' : 'nd Period'}
                      </th>
                      <th className="border border-slate-900 p-3.5 text-center text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        3{isKo ? '교시' : 'rd Period'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {['G9', 'G10'].map((grade) => (
                      <tr key={grade} className="hover:bg-slate-900/10">
                        <td className="border border-slate-900 p-4 font-black uppercase text-slate-200 text-xs tracking-wider">
                          {isKo ? `${grade.replace('G', '')}학년` : `Grade ${grade.replace('G', '')}`}
                        </td>
                        {['period1', 'period2', 'period3'].map((period) => {
                          const cellId = `${grade}-${period}`;
                          const subject = sandboxGrid[cellId];
                          return (
                            <td 
                              key={period} 
                              onClick={() => handleCellClick(cellId)}
                              className="border border-slate-900 p-2.5 text-center relative cursor-cell h-20 bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
                            >
                              {subject ? (
                                <motion.div 
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="w-full h-full rounded-xl p-2 flex flex-col justify-center text-left border relative group/item"
                                  style={{ 
                                    backgroundColor: `${subject.color}15`, 
                                    borderColor: `${subject.color}80` 
                                  }}
                                >
                                  {/* Delete button preview inside sandbox */}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSandboxGrid(prev => ({ ...prev, [cellId]: null }));
                                    }}
                                    className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-950 text-[8px] font-black text-rose-400 border border-slate-800 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                                  >
                                    ×
                                  </button>
                                  <span className="text-[10px] font-black uppercase text-white tracking-tight truncate">
                                    {isKo ? subject.nameKo : subject.name}
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                                    {isKo ? subject.teacherKo : subject.teacher}
                                  </span>
                                </motion.div>
                              ) : (
                                <div className="absolute inset-2 border-2 border-dashed border-slate-900 hover:border-slate-800 rounded-xl flex items-center justify-center text-[8.5px] font-black text-slate-600 transition-colors">
                                  {isKo ? '비어 있음' : 'VACANT'}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest gap-4">
                <span>⚡ {isKo ? '한 번의 탭으로 브러쉬를 슬롯에 전파합니다' : 'Tip: click any slot with an active brush to draw.'}</span>
                <button 
                  onClick={onTryDemo} 
                  className="bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 hover:text-slate-950 text-sky-400 px-4 py-2 rounded-lg transition-all font-black text-[10px]"
                >
                  {isKo ? '전체 관리자 버전 열기' : 'EXPAND TO FULL PLATFORM'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* CORE SPEC BENTO GRID */}
      <section id="features" className="relative z-10 py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-slate-900">
        
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex gap-2.5 px-3 py-1 bg-sky-500/10 border border-sky-400/20 rounded-full text-sky-400 text-[8.5px] font-black uppercase tracking-widest">
            {isKo ? '가디언 지능형 행정 시스템' : 'GENIAL COGNITIVE MATRIX'}
          </div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            {isKo ? '복잡한 조율 과정을 자동화하는 비결' : 'EDUCATIONAL ORCHESTRATION IN DEPTH'}
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {isKo 
              ? '에듀플래너 프로가 제공하는 다섯 개의 핵심 엔진은 직관적인 운영과 교원의 복지를 최고 순위로 보전합니다.' 
              : 'Our coordinate solver maps the specific constraints of high-density academic environments seamlessly without a single logical leak.'}
          </p>
        </div>

        {/* High-fidelity Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          
          {/* Card 1: Chronos Weaver (Large) */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="md:col-span-8 bg-slate-950/60 border border-slate-800/80 p-10 rounded-[3rem] relative overflow-hidden flex flex-col justify-between group min-h-[350px]"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/[0.04] blur-3xl pointer-events-none rounded-full" />
            <div className="space-y-4 max-w-xl">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Layers className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black uppercase text-white tracking-tight">{isKo ? '크로노스 위버 AI 엔진' : 'Chronos Weaver solver'}</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                {isKo 
                  ? '무제한 규칙과 시설 제약 조건을 동시에 해소하는 다목적 제약 해소 알고리즘이 탑재되어 있습니다. 버튼 클릭 한 번으로 수억 개의 가용 시간 배치 조합 중 최적의 일정을 추출하여 제안합니다.' 
                  : 'Synthesizes high-density, multi-class parameters into structurally perfect matrix grids in seconds. Runs on a powerful localized constraint solver to guarantee zero-defect scheduling.'}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-widest">
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">GEMINI LLM SOLVER</span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">STABILITY RANKING</span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">0s COMPILER</span>
            </div>
          </motion.div>

          {/* Card 2: Guardian Real-time Safeguard (Medium) */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="md:col-span-4 bg-slate-950/60 border border-slate-800/80 p-10 rounded-[3rem] relative overflow-hidden flex flex-col justify-between group min-h-[350px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] blur-2xl pointer-events-none rounded-full" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-505/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black uppercase text-white tracking-tight">{isKo ? '실시간 가디언' : 'Active Guardian'}</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                {isKo 
                  ? '수동 드래그 앤 드롭 중 발생하는 모든 일정 변경을 실시간 추적하고 충돌 사고가 나기 전에 원천 차단 시킵니다.' 
                  : 'Monitors manual changes in real-time. Instantly highlights duplicate bookings or lunch violations before they occur, keeping your operations fully integrated.'}
              </p>
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-6 flex items-center gap-1.5 hover:translate-x-1 transition-transform">
              {isKo ? '실시간 감시 가용' : 'LIVE PROTOCOL ACTIVE'} <ChevronRight className="w-3 h-3" />
            </span>
          </motion.div>

          {/* Card 3: Wellness Analytics (Medium) */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="md:col-span-4 bg-slate-950/60 border border-slate-800/80 p-10 rounded-[3rem] relative overflow-hidden flex flex-col justify-between group min-h-[355px]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black uppercase text-white tracking-tight">{isKo ? '번아웃 위기 진단' : 'Resiliency Index'}</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                {isKo 
                  ? '교직원들의 수업 연강 일수, 여유 교시 부족, 전공 외 시간 배치 비율 등을 진단하여 탈진 지수를 점수화하여 모니터링합니다.' 
                  : 'Automated auditing of workload density, back-to-back lessons, and recovery periods. Reduces supervisor stress and increases faculty retention.'}
              </p>
            </div>
            <div className="mt-6 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20 text-[9.5px] font-black uppercase tracking-widest text-rose-300">
              {isKo ? '교원 복지 최우선 보장제' : 'PROACTIVE RETENTION PROTECTION'}
            </div>
          </motion.div>

          {/* Card 4: Synergy Planner (Large) */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="md:col-span-8 bg-slate-950/60 border border-slate-800/80 p-10 rounded-[3rem] relative overflow-hidden flex flex-col justify-between group min-h-[355px]"
          >
            <div className="absolute bottom-0 right-0 w-64 h-32 bg-teal-500/[0.03] blur-3xl pointer-events-none rounded-full" />
            <div className="space-y-4 max-w-2xl">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black uppercase text-white tracking-tight">{isKo ? '교육과정 로드맵 연계' : 'Quarterly Curriculum Binder'}</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                {isKo 
                  ? '단순한 행적 기록표를 넘어 각 분기별 지정 교재, 필수 수료 시간 계산, 주차별 단원 설계 대시보드를 연계하여 단절 없는 지식의 흐름을 보장합니다.' 
                  : 'Traces your curriculum milestones. Interleaves school syllabus guidelines with weekly scheduling grids to ensure students achieve academic targets seamlessly.'}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-widest">
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">WEEKLY MILESTONES</span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">TEXTBOOK REPOSITORY</span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">STANDARDS BINDER</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* HIGHLAND SCREENSHOT TABS DEEP DIVE */}
      <section className="relative z-10 py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-slate-900">
        
        <div className="text-center mb-16 space-y-4">
          <span className="text-sky-400 text-[10px] font-black uppercase tracking-[0.5em]">{isKo ? '행정 제어 센터' : 'ADMINISTRATOR HUB'}</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">{isKo ? '통합 제어부 미리보기' : 'CHRONOS CONSOLE SUITE'}</h2>
          
          {/* Tab buttons */}
          <div className="flex justify-center flex-wrap gap-2 mt-8 max-w-md mx-auto bg-slate-900/60 p-1.5 rounded-3xl border border-slate-800/80">
            {[
              { id: 'weaver', label: isKo ? '시간표 위버' : 'Schedule Weaver' },
              { id: 'guardian', label: isKo ? '실시간 조율기' : 'Active Guardian' },
              { id: 'resiliency', label: isKo ? '번아웃 진단기' : 'Resiliency Matrix' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-2xl text-[9.5px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Interactive Screenshot Panel */}
        <div className="bg-slate-950/80 border border-slate-800 p-8 rounded-[3.5rem] shadow-2xl max-w-5xl mx-auto relative overflow-hidden text-left min-h-[380px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] blur-3xl pointer-events-none rounded-full" />
          
          <AnimatePresence mode="wait">
            {activeTab === 'weaver' && (
              <motion.div 
                key="weaver" 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                <div className="md:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 text-sky-400">
                    <Calendar className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isKo ? '자동 정렬 행렬' : 'Master Matrix Alignment'}</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase text-white tracking-tight">
                    {isKo ? '충돌 없는 최적의 경로 발굴' : 'GENERATE COMPLIANT BLUEPRINTS'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    {isKo 
                      ? '수많은 학급과 교사의 가용 요일, 필수 시수, 교직 조건 요소를 인공지능이 동시에 탐색합니다. 클릭 무거운 엑셀 작업에서 벗어나 규정과 편익이 조화된 아름다운 주간 시간표 격자를 단 3초 만에 설계하세요.' 
                      : 'Weaves complex teaching availability registers and classroom capacities into beautifully balanced weekly blocks. No manual mathematical calculations required - our unified system performs thousands of permutations in real-time.'}
                  </p>
                  <div className="flex gap-4">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center flex-1">
                      <p className="text-xl font-black text-white">0s</p>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">{isKo ? '수작업 시간 단축' : 'Calculation Lag'}</p>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center flex-1">
                      <p className="text-xl font-black text-indigo-400">100%</p>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">{isKo ? '정부 행정 규격 달성' : 'Constraint Defense'}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <div className="bg-slate-900/50 p-6 rounded-2.5xl border border-slate-800 space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 border-b border-slate-900 pb-2">
                      <span>{isKo ? '강교사 현황' : 'TEACHER PROFILE'}</span>
                      <span>{isKo ? '상태' : 'STATUS'}</span>
                    </div>
                    {[
                      { n: 'Dr. John Mitchell', r: 'Mathematics AP', s: 'OPTIMAL', c: 'text-emerald-400 bg-emerald-500/10' },
                      { n: 'Prof. Sarah Lin (AP Chem)', r: 'Laboratory Room A', s: 'BALANCED', c: 'text-sky-400 bg-sky-500/10' },
                      { n: 'Mr. Arthur Pendelton', r: 'Music Conservatory', s: 'WARN (Back-to-Back)', c: 'text-amber-400 bg-amber-500/10' }
                    ].map((row, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-slate-900/40 text-xs">
                        <div>
                          <p className="font-extrabold text-white uppercase">{row.n}</p>
                          <p className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">{row.r}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${row.c}`}>
                          {row.s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'guardian' && (
              <motion.div 
                key="guardian" 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                <div className="md:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 text-rose-400">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isKo ? '실시간 충돌 보호' : 'Dynamic Integrity Audit'}</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase text-white tracking-tight">
                    {isKo ? '조그마한 논리 모순까지 철저히 예방' : 'PREVENT DESTRUCTIVE COLLISIONS'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    {isKo 
                      ? '수정 사항이 생기는 즉시 백그라운드 AI 가디언 엔진이 작동을 시작합니다. 행정 담당자가 알지 못하는 교사들의 건강 관리 조약 위반(예를 들어 연달아 세 번의 연강, 점심 시간 겹침 등)을 정밀 검측하여 차단합니다.' 
                      : 'Traces your active coordinates continuously. Highlights critical teacher double-booking violations, lunch-break overlaps, or subject pairing issues. Keeps your administrative ledger fully legal and transparent without any auditing latency.'}
                  </p>
                  <p className="text-xs font-semibold text-slate-350 italic">
                    {isKo ? '"AI 가디언은 사용자가 일하는 도중 조용히 길목을 지킵니다."' : '"The active safeguard acts of silent protective intelligence while you build."'}
                  </p>
                </div>
                <div className="md:col-span-6">
                  <div className="p-6 bg-red-950/10 border border-red-900/30 rounded-2.5xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-400">{isKo ? '충돌 경고 로그' : 'LOGICAL CONFLICT FLUX'}</span>
                    </div>
                    <div className="bg-slate-950/80 p-4 border border-slate-900 rounded-xl border-l-[3px] border-l-red-500 text-left">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">RULE_VIOLATION_072</p>
                      <p className="text-xs font-bold text-white mt-1 leading-relaxed">
                        {isKo 
                          ? '김교사는 이미 10학년 화학 수업에 배정되었습니다. 9학년 융합과학에 동시 배치할 수 없습니다!' 
                          : 'Instructor Sarah is booked for Grade 10 AP Biology at Period 3. Cannot duplicate slot to Grade 9 Science.'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'resiliency' && (
              <motion.div 
                key="resiliency" 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                <div className="md:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 text-emerald-400">
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isKo ? '교원 삶의 질 보호' : 'FACULTY WELLNESS SHIELD'}</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase text-white tracking-tight">
                    {isKo ? '지키지 못할 무리한 일정 타파' : 'SAFEGUARD TEACHER WELLNESS'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    {isKo 
                      ? '과도한 연강은 교육의 수준을 낮추고 핵심 교원의 피로도를 누적시킵니다. 에듀플래너의 교직원 번아웃 지수는 연강 한계 도달, 수업 공백 간격, 주간 당직 일수 등을 체계적으로 감사하여 경고 전송 및 대체 방안을 탐험합니다.' 
                      : 'Uncontrolled workload density is the primary catalyst for faculty resignation. Our adaptive wellness monitor checks continuous teaching blocks, mandatory pause duration, and subject drift alerts to prevent teacher exhaustion and build resilient academic cultures.'}
                  </p>
                  <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                    {isKo ? '✨ 교직원 이탈률 평균 22% 감소 증명됨' : '✨ Demonstrated 22% reduction in faculty schedule fatigue'}
                  </p>
                </div>
                <div className="md:col-span-6 bg-slate-900/60 p-6 rounded-2.5xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span>Faculty Fatigue Matrix</span>
                    <span className="text-emerald-400">98% COMPLIANT</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Dr. John Doe', label: 'Math G9', status: 'Optimal Recovery', width: '22%' },
                      { name: 'Dr. Sarah Kim', label: 'Chem G10', status: 'Optimal Recovery', width: '35%' },
                      { name: 'Prof. Emily Post', label: 'Music G10', status: 'Moderate Load', width: '60%' }
                    ].map((row, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                          <span className="text-white">{row.name} ({row.label})</span>
                          <span className="text-slate-500">{row.status}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" style={{ width: row.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 border-t border-slate-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>CHRONOS ENGINE CORE 8.1</span>
            <button onClick={onTryDemo} className="text-sky-400 hover:text-white transition-colors">{isKo ? '대시보드 바로 가기' : 'ENTER MANAGER SUITE'} →</button>
          </div>
        </div>

      </section>

      {/* Modernized Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto border-t border-slate-900">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.6em]">{isKo ? '구독 옵션' : 'SUBSCRIPTION PLANS'}</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{isKo ? '적합한 라이선스를 탐색하세요' : 'AI SCHEDULING FOR EVERY CAMPUS'}</h3>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {isKo ? '간단한 일정 설계용 무료 체험판부터, 다수 학급과 번아웃 정밀 모니터 대량 설비가 연계된 최상위 등급 라이선스까지.' : 'Discover flexible models for educational institutions of all sizes, from private tutoring networks to global academic systems.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-8 hover:translate-y-[1px] transition-transform">
           
           {/* Tier 1 */}
           <motion.div 
             whileHover={{ y: -4 }}
             className="bg-slate-950/60 border border-slate-800/80 p-12 rounded-[3rem] flex flex-col justify-between gap-10 hover:border-slate-705/80 transition-all text-left"
           >
              <div className="space-y-6">
                <div className="inline-flex px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                  {isKo ? '개인 및 소규모 체험' : 'STARTER LAB'}
                </div>
                <div>
                  <h4 className="text-5xl font-black uppercase tracking-tighter text-white">{isKo ? '0원' : '$0'}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-2 tracking-widest">{isKo ? '기간 제한 제한 없음' : 'NO TIME CARD CONSTRAINT'}</p>
                </div>
                <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
                  {isKo ? '가디언 엔진의 실시간 규칙 모순 모니터와 기본적인 드래그 일정 편집 기능을 가볍게 탐닉할 수 있습니다.' : 'Test coordinate scheduling models to easily trace conflicts and construct reliable schedule grids for personal study use.'}
                </p>
                
                <div className="space-y-3.5 pt-4">
                  {[
                    { en: "Up to 3 Active Classes Sync", ko: "최대 3개 지능형 학급 전산 관리" },
                    { en: "Real-time Conflict Interceptor", ko: "가디언 실시간 충돌 차단 탑재" },
                    { en: "Syllabus Quarterly Planner", ko: "분기별 단원 분배기 바인더 기계" },
                    { en: "Premium Raw Content PDF Export", ko: "인큐베이팅 PDF 인쇄 레이아웃" }
                  ].map((f, j) => (
                    <div key={j} className="flex items-center gap-3.5">
                      <div className="w-5 h-5 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{isKo ? f.ko : f.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onTryDemo} 
                className="w-full py-4.5 rounded-2xl bg-white hover:bg-sky-400 text-slate-950 text-[10.5px] font-black uppercase tracking-widest transition-all shadow-xl"
              >
                {isKo ? '체험 Sandbox 시작' : 'Access Free Sandbox'}
              </motion.button>
           </motion.div>

           {/* Tier 2: Pro */}
           <motion.div 
             whileHover={{ y: -4 }}
             className="bg-indigo-600/10 border-2 border-indigo-500/30 p-12 rounded-[3rem] flex flex-col justify-between gap-10 hover:border-indigo-500/60 transition-all text-left relative overflow-hidden shadow-[0_30px_60px_rgba(30,27,75,0.4)]"
           >
              <div className="absolute top-0 right-0 py-6 px-12 transform rotate-45 translate-x-12 translate-y-4 bg-indigo-500 text-white text-[8px] font-extrabold uppercase tracking-widest text-center shadow-lg">
                Enterprise
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="inline-flex px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-500/30">
                  {isKo ? '교육기관 및 캠퍼스 전용' : 'CAMPUS EXECUTIVE'}
                </div>
                <div>
                  <h4 className="text-5xl font-black uppercase tracking-tighter text-white">{isKo ? '견적 상담' : 'CUSTOM'}</h4>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase mt-2 tracking-widest">{isKo ? '대규모 교원 단체 맞춤 적용' : 'SCALABLE CLOUD DISPATCH'}</p>
                </div>
                <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
                  {isKo 
                    ? '수십 조의 복수 학급, 전공 교사 피로도 점검, 정부 교육 시간 충족 가이드와 융합된 완전 관리 환경입니다.' 
                    : 'A comprehensive campus deployment. Access unlimited classes, real-time workload audit dashboards, priority consulting alignment, and system uptime guarantees.'}
                </p>
                
                <div className="space-y-3.5 pt-4">
                  {[
                    { en: "Unlimited Active Class Sync", ko: "무제한 학급 확장 결합" },
                    { en: "High-Cognitive Resiliency Shield", ko: "번아웃 감사 및 피로 안전 경고" },
                    { en: "Dedicated Success Engineer", ko: "동선 디자인 전임 솔루션 엔지니어" },
                    { en: "Database Auto Cloud Backups", ko: "클라우드 스토리지 실시간 백업보존" }
                  ].map((f, j) => (
                    <div key={j} className="flex items-center gap-3.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-400/20 flex items-center justify-center text-indigo-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{isKo ? f.ko : f.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEnter} 
                className="w-full py-4.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-black uppercase tracking-widest transition-all relative z-10 border border-white/10"
              >
                {isKo ? '영업 연구팀 상담 요청' : 'Consult with Campus Engineer'}
              </motion.button>
           </motion.div>
        </div>
      </section>

      {/* Footer Element */}
      <footer className="relative z-10 py-20 px-6 lg:px-16 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center p-[1px] shadow-lg">
                <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                </div>
              </div>
              <span className="text-base font-black tracking-[0.2em] text-white uppercase">EduPlanner.Pro</span>
            </div>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.3em] text-slate-500 max-w-sm leading-relaxed">
              Smarter Institutional Infrastructures. Powered by Gemini Cognitive Optimization. Engineered for Academic Excellence.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-5 text-left">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{isKo ? '탐색' : 'Navigation'}</h4>
              <div className="flex flex-col gap-3.5">
                <button onClick={() => scrollTo('sandbox')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '샌드박스 체험' : 'Interactive Sandbox'}</button>
                <button onClick={() => scrollTo('features')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '기술 사양' : 'Intelligence Tech'}</button>
                <button onClick={() => scrollTo('pricing')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '구독' : 'License model'}</button>
              </div>
            </div>
            
            <div className="space-y-5 text-left">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{isKo ? '법률 파트' : 'Legal Compliance'}</h4>
              <div className="flex flex-col gap-3.5">
                <button onClick={() => openLegal('privacy')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '개인정보 처리원칙' : 'Privacy Protection'}</button>
                <button onClick={() => openLegal('terms')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '이용 서비스 약정' : 'Terms & Conditions'}</button>
              </div>
            </div>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-600">
            © {new Date().getFullYear()} EduPlanner Pro. ALL RIGHTS RESERVED. IN COMPLIANCE WITH EDUCATION CORES.
          </div>
          <div className="flex items-center gap-4 text-slate-600 text-[10px] font-bold">
            <Globe className="w-4 h-4" />
            <span>GLOBAL OS V8.19</span>
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
      `}} />

    </div>
  );
};

export default LandingPage;
