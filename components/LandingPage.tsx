import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useMotionValueEvent, useSpring, useMotionValue } from 'motion/react';

const FadeUp = ({ children, delay = 0, className = '' }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
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
  { id: 'calc', name: 'AP Calculus', nameKo: '미적분학 AP', teacher: 'Dr. John Doe', teacherKo: '존 도 박사', color: '#0ea5e9', bgClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40' },
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 150, damping: 20 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const relX = (e.clientX - centerX) / (rect.width / 2);
    const relY = (e.clientY - centerY) / (rect.height / 2);
    rotateX.set(-relY * 10);
    rotateY.set(relX * 10);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  const [counted, setCounted] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setCounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const [scrolled, setScrolled] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('hero');
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 80);
  });

  React.useEffect(() => {
    const sections = ['hero', 'sandbox', 'features', 'pricing'];
    const observers = sections.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActiveSection(id);
      }, { threshold: 0.3 });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(obs => obs?.disconnect());
  }, []);

  const [lastDropped, setLastDropped] = React.useState<string | null>(null);

  const handleCellClick = (cellId: string) => {
    setSandboxGrid(prev => ({
      ...prev,
      [cellId]: selectedBrush
    }));
    setLastDropped(cellId);
    setTimeout(() => setLastDropped(null), 300);
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

  const TimetableBg = () => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="tgrid" width="120" height="60" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="120" y2="0" stroke="#94a3b8" strokeWidth="0.5"/>
          <line x1="0" y1="0" x2="0" y2="60" stroke="#94a3b8" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tgrid)" />
      {[
        { x: 10, y: 10, w: 90, color: '#0ea5e9', delay: '0.2s' },
        { x: 130, y: 10, w: 70, color: '#2dd4bf', delay: '0.4s' },
        { x: 250, y: 10, w: 100, color: '#0ea5e9', delay: '0.6s' },
        { x: 10, y: 70, w: 70, color: '#a78bfa', delay: '0.8s' },
        { x: 130, y: 70, w: 90, color: '#0ea5e9', delay: '1.0s' },
        { x: 370, y: 70, w: 80, color: '#2dd4bf', delay: '1.2s' },
        { x: 10, y: 130, w: 100, color: '#2dd4bf', delay: '1.4s' },
        { x: 250, y: 130, w: 70, color: '#a78bfa', delay: '1.6s' },
        { x: 490, y: 10, w: 90, color: '#0ea5e9', delay: '1.8s' },
        { x: 490, y: 70, w: 70, color: '#2dd4bf', delay: '2.0s' },
        { x: 370, y: 130, w: 100, color: '#0ea5e9', delay: '2.2s' },
      ].map((pill, i) => (
        <rect
          key={i}
          x={pill.x} y={pill.y + 4} width={pill.w} height={20}
          rx="4" fill={pill.color} fillOpacity="0.6"
          className="timetable-pill"
          style={{ animationDelay: pill.delay, animationFillMode: 'both' }}
        />
      ))}
    </svg>
  );

  return (
    <div className="relative min-h-screen bg-[#020617] text-white overflow-x-hidden font-inter selection:bg-sky-500/30">
      
      {/* Background Interactive Ambient Field */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Futuristic Laser Matrix Grid */}
        <TimetableBg />
      </div>

      {/* Floating Futuristic Dock Header */}
      <nav className="fixed top-6 left-0 right-0 z-[100] px-4">
        <motion.div
          animate={{ paddingTop: scrolled ? '0.5rem' : '0.75rem', paddingBottom: scrolled ? '0.5rem' : '0.75rem' }}
          transition={{ duration: 0.2 }}
          className="max-w-6xl mx-auto bg-slate-950/75 backdrop-blur-2xl border border-slate-800/80 rounded-3xl px-5 flex items-center justify-between shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
        >
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-600 flex items-center justify-center p-[1px] shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-ping" />
                </div>
              </div>
              <span className="text-sm font-medium tracking-normal text-white group-hover:text-sky-400 transition-colors">
                EduPlanner<span className="text-sky-400">.</span>Pro
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-normal mb-[-2px]">
              <button 
                onClick={() => scrollTo('sandbox')} 
                className={`transition-colors py-1 relative group ${activeSection === 'sandbox' ? 'text-white' : 'text-slate-400 hover:text-sky-400'}`}
              >
                {isKo ? '라이브 체험' : 'Interactive Playground'}
                <span className={`absolute bottom-0 left-0 h-[2px] bg-sky-400 transition-all duration-300 ${activeSection === 'sandbox' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </button>
              <button 
                onClick={() => scrollTo('features')} 
                className={`transition-colors py-1 relative group ${activeSection === 'features' ? 'text-white' : 'text-slate-400 hover:text-sky-400'}`}
              >
                {isKo ? '인텔리전스 스펙' : 'Features'}
                <span className={`absolute bottom-0 left-0 h-[2px] bg-sky-400 transition-all duration-300 ${activeSection === 'features' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </button>
              <button 
                onClick={() => scrollTo('pricing')} 
                className={`transition-colors py-1 relative group ${activeSection === 'pricing' ? 'text-white' : 'text-slate-400 hover:text-sky-400'}`}
              >
                {isKo ? '라이선싱' : 'Pricing'}
                <span className={`absolute bottom-0 left-0 h-[2px] bg-sky-400 transition-all duration-300 ${activeSection === 'pricing' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800/80">
              <button 
                onClick={() => setLanguage('ko')} 
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${language === 'ko' ? 'bg-sky-500 text-slate-950 font-medium shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                KR
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${language === 'en' ? 'bg-sky-500 text-slate-950 font-medium shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                EN
              </button>
            </div>
            <button 
              onClick={onEnter} 
              className="text-slate-400 hover:text-white px-3 py-1.5 text-xs font-medium tracking-normal transition-all"
            >
              {isKo ? '로그인' : 'Sign In'}
            </button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onTryDemo}
              className="bg-white hover:bg-sky-400 text-slate-950 px-5 py-2.5 rounded-2xl text-xs font-medium tracking-normal transition-all flex items-center gap-2 shadow-xl border border-white/20"
            >
              {isKo ? '체험판 시작' : 'Access Sandbox'}
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>
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
                <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
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
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="text-sky-400 font-medium tracking-[0.06em] text-xs">
                {isKo ? '실시간 대화형 하이브리드 자동 최적화 플랫폼' : 'AI schedule optimizer'}
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
                  <span className="text-sky-400 italic font-serif normal-case">완전무결</span>한 <br />
                  시간표를 디자인하다.
                </>
              ) : (
                <>
                  WEAVE YOUR <br />
                  <span className="text-sky-400 italic font-serif normal-case">FLAWLESS MATRIX</span> <br />
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
                ? '번거롭고 복잡한 교사 시간 중복 조율을 인공지능에게 위임하세요. EduPlanner Pro는 Gemini의 스마트 추천을 활용하여 충돌 없는 시간표와 교직원 업무 상태를 즉각 알려줍니다.' 
                : 'Say goodbye to scheduling collisions and administrative burnout. EduPlanner Pro uses Gemini smart assistance to suggest real-time optimal schedules, balance teacher workloads, and export clean timetables.'}
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
                className="px-8 py-4.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-[0_20px_50px_-10px_rgba(14,165,233,0.4)] hover:shadow-[0_25px_60px_-8px_rgba(14,165,233,0.6)] transition-all flex items-center justify-center gap-3 border border-white/10"
              >
                <span>{isKo ? '무료 체험 시작하기' : 'Lauch Free Blueprint Sandbox'}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollTo('sandbox')}
                className="px-8 py-4.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-300 rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
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
              <FadeUp delay={0.1}>
                <div>
                  <p className="text-2xl font-black text-sky-400">
                    <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={counted ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                      0s
                    </motion.span>
                  </p>
                  <p className="text-xs font-medium text-slate-400 normal-case mt-1">{isKo ? '실시간 동기화 지연' : 'Conflict Check Lag'}</p>
                </div>
              </FadeUp>
              <FadeUp delay={0.2}>
                <div>
                  <p className="text-2xl font-black text-white">
                    <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={counted ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>
                      99.8%
                    </motion.span>
                  </p>
                  <p className="text-xs font-medium text-slate-400 normal-case mt-1">{isKo ? '교원 탈진 보호율' : 'Burnout Protected'}</p>
                </div>
              </FadeUp>
              <FadeUp delay={0.3}>
                <div>
                  <p className="text-2xl font-black text-sky-400">
                    <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={counted ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                      Gemini
                    </motion.span>
                  </p>
                  <p className="text-xs font-medium text-slate-400 normal-case mt-1">{isKo ? '순수 지능형 인프라' : 'Deep Solver model'}</p>
                </div>
              </FadeUp>
            </motion.div>
          </div>

          {/* Hero Right: 3D Hologram Interface Device Mockup */}
          <div className="lg:col-span-5 relative flex justify-center items-center" style={{ perspective: '1000px' }}>
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="relative w-full max-w-md group cursor-default"
            >
              {/* Floating depth layer — sits behind the card in 3D space */}
              <motion.div
                style={{ translateZ: '-40px', transformStyle: 'preserve-3d' }}
                className="absolute inset-4 rounded-2xl bg-sky-500/10 blur-xl"
              />

              {/* Main Holo Card Terminal */}
              <div
                style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}
                className="relative bg-slate-950/80 border border-sky-500/20 hero-card-border shadow-[0_30px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-2xl p-8 space-y-6 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />

                {/* Simulated Screen Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 tracking-widest uppercase">MASTER_COGNITION.SYS</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    ONLINE
                  </span>
                </div>

                {/* Simulated Core Diagnostic chart */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 space-y-3.5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-10" />
                  <div className="flex justify-between items-center text-xs font-medium uppercase tracking-widest text-slate-400">
                    <span>Faculty Load Matrix</span>
                    <span className="text-sky-400">92% OPTIMAL</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 pt-2">
                    {[
                      { l: 'Math', v: '85%', color: 'from-sky-500 to-sky-600' },
                      { l: 'Science', v: '70%', color: 'from-teal-400 to-emerald-500' },
                      { l: 'Art', v: '40%', color: 'from-purple-500 to-pink-500' },
                      { l: 'Human', v: '95%', color: 'from-amber-400 to-rose-500' }
                    ].map((item, id) => (
                      <div key={id} className="space-y-2 flex flex-col items-center">
                        <div className="w-full h-24 bg-slate-950 rounded-xl relative overflow-hidden flex items-end border border-slate-800">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: item.v }}
                            transition={{ duration: 0.8, delay: id * 0.15 + 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className={`w-full bg-gradient-to-t ${item.color} rounded-t-lg`}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{item.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating recommendation badge — raised in Z */}
                <div
                  style={{ transform: 'translateZ(20px)' }}
                  className="p-4 bg-sky-500/5 border border-sky-500/25 rounded-2xl space-y-1 text-left"
                >
                  <div className="flex items-center gap-2 text-sky-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-widest">COGNITIVE RECOMMENDATION</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {isKo
                      ? 'AP 미적분 강사가 7교시에 연속 배치되었습니다. 번아웃 보호 장치를 켜서 4교시로 순환을 제안합니다.'
                      : 'AP Calculus instructor assigned back-to-back lessons. Shift Monday slot to Period 3 for optimal cognitive balance.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE PLAYGROUND (SANDBOX) SECTION */}
      <section id="sandbox" className="relative z-10 py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-slate-900">
        
        {/* Title Group */}
        <FadeUp delay={0}>
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex gap-2.5 px-3 py-1 bg-sky-500/10 border border-sky-400/20 rounded-full text-sky-400 text-xs font-medium uppercase tracking-[0.06em]">
              {isKo ? '실시간 체험 부스' : 'NO-RISK LIVE DEMO'}
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              {isKo ? '시간표 충돌 방지 엔진 체험하기' : 'Teacher collision playground'}
            </h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              {isKo 
                ? '아래 교과목을 클릭하여 시간표 슬롯 에 할당해 보세요. 동일 시간에 같은 교사가 중복 지정될 시, 지능형 엔진이 즉각적으로 경고를 전송합니다.' 
                : 'Pick a course brush from below, then click any grid cell in Grade 9 or 10. If teachers overlap in the same period, watch the logic collision safety warnings dynamically flare open!'}
            </p>
          </div>
        </FadeUp>

        {/* Master Sandbox Console Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          
          {/* LEFT: COURSE BRUSH SELECTOR */}
          <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800/80 p-6 rounded-2xl space-y-6">
            <h4 className="text-xs font-medium tracking-widest text-slate-400 uppercase text-left flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-sky-400" />
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
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wider">
                          {isKo ? sub.teacherKo : sub.teacher}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-black bg-sky-500 text-slate-950 px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0">
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
              className="w-full py-3 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
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
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-black text-rose-400 uppercase tracking-widest leading-none mb-1">
                        {isKo ? '실시간 교직원 규칙 위반 감지' : 'RULE INTEGRITY FLUSH ERROR'}
                      </h5>
                      {conflicts.map((conf, index) => (
                        <p key={index} className="text-xs font-semibold text-rose-200 leading-relaxed uppercase tracking-tight">
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
                      <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none">
                        {isKo ? '가디언 모토: 안정성 확보됨' : 'SYSTEM HEALTH: 100% COMPLIANT'}
                      </h5>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {isKo ? '선생님 동선과 행정 규격이 충돌 없이 유지되고 있습니다. 마음 편히 추가 배치하세요.' : 'No overlaps detected. Teachers and classrooms occupy completely safe, isolated coordinates.'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Grid display */}
            <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl overflow-hidden relative shadow-2xl">
              <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
                <span className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  2. {isKo ? '선택과정 셀에 클릭하여 배치' : 'CLICK CELLS TO SET SCHEDULE'}
                </span>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/25">
                  {selectedBrush ? (isKo ? `선택: ${selectedBrush.nameKo}` : `Brush: ${selectedBrush.name}`) : (isKo ? '브러쉬 선택 대기' : 'Active Brush: None')}
                </span>
              </div>

              {/* Grid element */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-900/30">
                      <th className="border border-slate-900 p-3.5 text-left text-xs font-medium text-slate-500 tracking-wider w-28">
                        {isKo ? '대상 학급' : 'Target class'}
                      </th>
                      <th className="border border-slate-900 p-3.5 text-center text-xs font-medium text-slate-500 tracking-wider">
                        1{isKo ? '교시' : 'st Period'}
                      </th>
                      <th className="border border-slate-900 p-3.5 text-center text-xs font-medium text-slate-500 tracking-wider">
                        2{isKo ? '교시' : 'nd Period'}
                      </th>
                      <th className="border border-slate-900 p-3.5 text-center text-xs font-medium text-slate-500 tracking-wider">
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
                          const isLastDropped = cellId === lastDropped;
                          const hasConflict = !!(sandboxGrid[`G9-${period}`] && sandboxGrid[`G10-${period}`] && sandboxGrid[`G9-${period}`]?.teacher === sandboxGrid[`G10-${period}`]?.teacher);
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
                                  className={`w-full h-full rounded-xl p-2 flex flex-col justify-center text-left border relative group/item ${isLastDropped ? 'cell-drop' : ''} ${hasConflict ? 'conflict-cell' : ''}`}
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
                                    className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-950 text-xs font-medium text-rose-400 border border-slate-800 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                                  >
                                    ×
                                  </button>
                                  <span className="text-xs font-medium uppercase text-white tracking-tight truncate">
                                    {isKo ? subject.nameKo : subject.name}
                                  </span>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                                    {isKo ? subject.teacherKo : subject.teacher}
                                  </span>
                                </motion.div>
                              ) : (
                                <div className={`absolute inset-2 border-2 border-dashed border-slate-900 hover:border-slate-800 rounded-xl flex items-center justify-center text-xs font-medium text-slate-600 transition-all ${selectedBrush ? 'hover:scale-[1.02] transition-transform duration-200' : 'transition-colors'}`}>
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

              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest gap-4">
                <span>⚡ {isKo ? '한 번의 탭으로 브러쉬를 슬롯에 전파합니다' : 'Tip: click any slot with an active brush to draw.'}</span>
                <button 
                  onClick={onTryDemo} 
                  className="bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 hover:text-slate-950 text-sky-400 px-4 py-2 rounded-lg transition-all font-semibold text-xs"
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
          <div className="inline-flex gap-2.5 px-3 py-1 bg-sky-500/10 border border-sky-400/20 rounded-full text-sky-400 text-xs font-medium uppercase tracking-[0.06em]">
            {isKo ? '지능형 시간표 관리 시스템' : 'INTELLIGENT ACADEMIC SCHEDULING'}
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            {isKo ? '복잡한 조율 과정을 자동화하는 비결' : 'Schedule intelligence, redesigned.'}
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {isKo 
              ? '에듀플래너 프로가 제공하는 핵심 엔진은 직관적인 운영과 교원의 복지를 최고 순위로 보전합니다.' 
              : 'Our intelligent scheduling engine organizes complex teacher and classroom requirements seamlessly without any overlaps.'}
          </p>
        </div>

        {/* High-fidelity Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          
          {/* Card 1: Smart Schedule Generator (Large) */}
          <FadeUp delay={0} className="md:col-span-8">
            <motion.div 
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-full h-full bg-slate-950/60 border border-slate-800/80 p-10 rounded-2xl relative overflow-hidden flex flex-col justify-between group min-h-[350px]"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/[0.04] blur-3xl pointer-events-none rounded-full" />
              <div className="space-y-4 max-w-xl">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">{isKo ? '지능형 자동 시간표 엔진' : 'Smart Schedule Generator'}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">
                  {isKo 
                    ? '학교 고유의 다양한 수업 규칙과 시설 요구조건을 똑똑하게 이해합니다. 버튼 클릭 한 번으로 수많은 일정 조합을 자동 탐색하여 최적의 시간표를 안전하게 추천합니다.' 
                    : 'Combines class and teacher requirements into structured schedules in seconds. Runs on a fast local helper engine to guarantee conflict-free, easy timetables.'}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-widest">
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">GEMINI SMART ASSISTANT</span>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">SCHEDULE STABILITY</span>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">INSTANT GENERATION</span>
              </div>
            </motion.div>
          </FadeUp>

          {/* Card 2: Guardian Real-time Safeguard (Medium) */}
          <FadeUp delay={0.08} className="md:col-span-4">
            <motion.div 
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-full h-full bg-slate-950/60 border border-slate-800/80 p-10 rounded-2xl relative overflow-hidden flex flex-col justify-between group min-h-[350px]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/[0.03] blur-2xl pointer-events-none rounded-full" />
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">{isKo ? '실시간 가디언' : 'Active Safeguard'}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">
                  {isKo 
                    ? '수동 드래그 앤 드롭 중 발생하는 모든 일정 변경을 실시간 추적하고 충돌 사고가 나기 전에 원천 차단 시킵니다.' 
                    : 'Monitors manual changes in real-time. Instantly highlights duplicate bookings or lunch overlaps before they occur, keeping your schedules perfectly coordinated.'}
                </p>
              </div>
              <span className="text-xs font-medium uppercase text-sky-400 tracking-widest mt-6 flex items-center gap-1.5 hover:translate-x-1 transition-transform">
                {isKo ? '실시간 보호 작동 중' : 'SAFEGUARD SYSTEM ACTIVE'} <ChevronRight className="w-3 h-3" />
              </span>
            </motion.div>
          </FadeUp>

          {/* Card 3: Wellness Analytics (Medium) */}
          <FadeUp delay={0.16} className="md:col-span-4">
            <motion.div 
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-full h-full bg-slate-950/60 border border-slate-800/80 p-10 rounded-2xl relative overflow-hidden flex flex-col justify-between group min-h-[355px]"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">{isKo ? '수업 피로도 모니터' : 'Workload Balance'}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">
                  {isKo 
                    ? '교직원들의 수업 연강 일수, 여유 교시 부족, 전공 외 시간 배치 비율 등을 진단하여 피로도와 업무 부담을 골고루 모니터링합니다.' 
                    : 'Checks back-to-back lessons, workload density, and recovery periods. Reduces teacher fatigue and promotes a happier, more balanced work environment.'}
                </p>
              </div>
              <div className="mt-6 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20 text-xs font-medium uppercase tracking-widest text-rose-300">
                {isKo ? '교원 피로 예방 지원제' : 'BALANCED WORKLOAD ASSURANCE'}
              </div>
            </motion.div>
          </FadeUp>

          {/* Card 4: Synergy Planner (Large) */}
          <FadeUp delay={0.24} className="md:col-span-8">
            <motion.div 
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-full h-full bg-slate-950/60 border border-slate-800/80 p-10 rounded-2xl relative overflow-hidden flex flex-col justify-between group min-h-[355px]"
            >
              <div className="absolute bottom-0 right-0 w-64 h-32 bg-teal-500/[0.03] blur-3xl pointer-events-none rounded-full" />
              <div className="space-y-4 max-w-2xl">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">{isKo ? '교육과정 강의 계획' : 'Curriculum Planner'}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">
                  {isKo 
                    ? '단순한 교시 배치를 넘어 분기별 지정 교재, 필수 교육 시간 계산, 주차별 학습 설계표를 연계하여 일관성 있는 수업을 지원합니다.' 
                    : 'Tracks course timelines. Combines class schedules with weekly guidelines to ensure teachers and students meet academic goals easily.'}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-widest">
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">WEEKLY GOALS</span>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">RESOURCE LIBRARY</span>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">ACADEMIC STANDARDS</span>
              </div>
            </motion.div>
          </FadeUp>

        </div>
      </section>

      {/* HIGHLAND SCREENSHOT TABS DEEP DIVE */}
      <section className="relative z-10 py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-slate-900">
        
        <div className="text-center mb-16 space-y-4">
          <span className="text-sky-400 text-xs font-medium uppercase tracking-[0.06em]">{isKo ? '행정 제어 센터' : 'ADMINISTRATOR HUB'}</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">{isKo ? '통합 제어부 미리보기' : 'Schedule Control Center'}</h2>
          
          {/* Tab buttons */}
          <div className="flex justify-center flex-wrap gap-2 mt-8 max-w-md mx-auto bg-slate-900/60 p-1.5 rounded-3xl border border-slate-800/80">
            {[
              { id: 'weaver', label: isKo ? '자동 시간표 생성기' : 'Schedule Generator' },
              { id: 'guardian', label: isKo ? '실시간 검사기' : 'Real-time Checker' },
              { id: 'resiliency', label: isKo ? '수업 피로도 모니터' : 'Workload Status' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-medium uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-sky-500 text-slate-950 shadow-md font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
 
        {/* Dynamic Interactive Screenshot Panel */}
        <div className="bg-slate-950/80 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-5xl mx-auto relative overflow-hidden text-left min-h-[380px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/[0.02] blur-3xl pointer-events-none rounded-full" />
          
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
                    <span className="text-xs font-medium uppercase tracking-widest">{isKo ? '자동 시간표 격자' : 'Automatic Schedule Grid'}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    {isKo ? '충돌 없는 최적의 시간표 설계' : 'Create balanced timetables'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    {isKo 
                      ? '자동으로 수많은 학급과 강사의 수업 시간을 조율합니다. 복잡한 엑셀 수작업에서 벗어나 충돌과 중복 없는 주간 시간표를 단 몇 초 만에 설계해 보세요.' 
                      : 'Automatically organizes teaching hours and class slots in seconds. Skip the manual spreadsheet edits and construct perfectly balanced weekly timetables with ease.'}
                  </p>
                  <div className="flex gap-4">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center flex-1">
                      <p className="text-xl font-black text-white">0s</p>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">{isKo ? '수작업 대기 시간' : 'Calculation Lag'}</p>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center flex-1">
                      <p className="text-xl font-black text-sky-400">100%</p>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">{isKo ? '시간표 충돌 예방' : 'Conflict Prevention'}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <div className="bg-slate-900/50 p-6 rounded-2.5xl border border-slate-800 space-y-3">
                    <div className="flex justify-between text-xs font-medium uppercase text-slate-500 border-b border-slate-900 pb-2">
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
                          <p className="font-medium text-white uppercase">{row.n}</p>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{row.r}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${row.c}`}>
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
                    <ShieldCheck className="w-5 h-5 text-sky-400" />
                    <span className="text-xs font-medium uppercase tracking-widest">{isKo ? '실시간 충돌 방지' : 'Real-time Overlap Protection'}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    {isKo ? '일정 겹침이나 중복 철저 예방' : 'Prevent schedule collisions'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    {isKo 
                      ? '시간표를 수정하는 즉시 오류 검사가 작동합니다. 담당자가 미처 발견하기 힘든 수업 중복이나 점심 시간 누락 등의 문제를 즉각 경고하고 예방해 줍니다.' 
                      : 'Checks your schedule instantly during edits. Automatically highlights and flags teacher double-bookings, lunch period issues, or subject overlaps to keep everything correct.'}
                  </p>
                  <p className="text-xs font-semibold text-slate-350 italic">
                    {isKo ? '"실시간 검사 시스템이 시간표 작성 도중 조용히 길목을 지킵니다."' : '"The active safeguard acts as silent protective intelligence while you build."'}
                  </p>
                </div>
                <div className="md:col-span-6">
                  <div className="p-6 bg-red-950/10 border border-red-900/30 rounded-2.5xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium uppercase tracking-widest text-red-400">{isKo ? '시간표 충돌 알림' : 'SCHEDULE CONFLICT DETECTED'}</span>
                    </div>
                    <div className="bg-slate-950/80 p-4 border border-slate-900 rounded-xl border-l-[3px] border-l-red-500 text-left">
                      <p className="text-xs font-medium text-rose-400 uppercase tracking-widest">CONFLICT_DETECTED</p>
                      <p className="text-xs font-medium text-white mt-1 leading-relaxed">
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
                    <span className="text-xs font-medium uppercase tracking-widest">{isKo ? '강사 수업 부담 보호' : 'TEACHER WORKLOAD SAFETY'}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    {isKo ? '무리한 시간표 편성 예방' : 'Balance teacher workloads'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    {isKo 
                      ? '지나친 연속 수업은 교직원의 피로를 높이고 수업의 질을 낮출 수 있습니다. 에듀플래너는 연속된 수업 횟수나 휴식 시간을 실시간으로 분석해 더 여유 있는 배치를 돕습니다.' 
                      : 'Too many continuous lessons can lead to fatigue. Our balanced workload helper automatically reviews back-to-back classes and break times, helping you build a healthy environment.'}
                  </p>
                  <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                    {isKo ? '✨ 교직원 업무 피로도 및 연강 이탈률 22% 감소 증명' : '✨ Demonstrated 22% reduction in faculty schedule fatigue'}
                  </p>
                </div>
                <div className="md:col-span-6 bg-slate-900/60 p-6 rounded-2.5xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-xs font-medium uppercase text-slate-400">
                    <span>Teacher Workload Status</span>
                    <span className="text-emerald-400">98% COMPLIANT</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Dr. John Doe', label: 'Math G9', status: 'Optimal Recovery', width: '22%' },
                      { name: 'Dr. Sarah Kim', label: 'Chem G10', status: 'Optimal Recovery', width: '35%' },
                      { name: 'Prof. Emily Post', label: 'Music G10', status: 'Moderate Load', width: '60%' }
                    ].map((row, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-medium uppercase">
                          <span className="text-white">{row.name} ({row.label})</span>
                          <span className="text-slate-500">{row.status}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full" style={{ width: row.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 border-t border-slate-900 flex justify-between items-center text-xs font-medium uppercase tracking-widest text-slate-500">
            <span>CHRONOS ENGINE CORE 8.1</span>
            <button onClick={onTryDemo} className="text-sky-400 hover:text-white transition-colors">{isKo ? '대시보드 바로 가기' : 'ENTER MANAGER SUITE'} →</button>
          </div>
        </div>

      </section>

      {/* Modernized Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 lg:px-16 max-w-screen-2xl mx-auto border-t border-slate-900">
        <FadeUp delay={0}>
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-xs font-medium text-sky-500 uppercase tracking-[0.06em]">{isKo ? '구독 옵션' : 'SUBSCRIPTION PLANS'}</h2>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">{isKo ? '적합한 라이선스를 탐색하세요' : 'Simple, transparent pricing.'}</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              {isKo ? '간단한 일정 설계용 무료 체험판부터, 다수 학급과 번아웃 정밀 모니터 대량 설비가 연계된 최상위 등급 라이선스까지.' : 'Discover flexible models for educational institutions of all sizes, from private tutoring networks to global academic systems.'}</p>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-8 hover:translate-y-[1px] transition-transform">
           
           {/* Tier 1 */}
           <FadeUp delay={0} className="h-full">
             <motion.div 
               whileHover={{ y: -4 }}
               className="w-full h-full bg-slate-950/60 border border-slate-800/80 p-12 rounded-2xl flex flex-col justify-between gap-10 hover:border-slate-705/80 transition-all text-left"
             >
                <div className="space-y-6">
                  <div className="inline-flex px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-medium uppercase tracking-widest">
                    {isKo ? '개인 및 소규모 체험' : 'STARTER LAB'}
                  </div>
                  <div>
                    <h4 className="text-5xl font-black uppercase tracking-tighter text-white">{isKo ? '0원' : '$0'}</h4>
                    <p className="text-xs font-medium text-slate-500 uppercase mt-2 tracking-widest">{isKo ? '기간 제한 제한 없음' : 'NO TIME CARD CONSTRAINT'}</p>
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
                        <span className="text-xs font-medium uppercase tracking-widest text-slate-300">{isKo ? f.ko : f.en}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onTryDemo} 
                  className="w-full py-4.5 rounded-2xl bg-white hover:bg-sky-400 text-slate-950 text-xs font-semibold uppercase tracking-widest transition-all shadow-xl"
                >
                  {isKo ? '체험 Sandbox 시작' : 'Access Free Sandbox'}
                </motion.button>
             </motion.div>
           </FadeUp>

           {/* Tier 2: Pro */}
           <FadeUp delay={0.12} className="h-full">
             <motion.div 
               whileHover={{ y: -4 }}
               className="w-full h-full bg-sky-500/5 border-2 border-sky-500/30 p-12 rounded-2xl flex flex-col justify-between gap-10 hover:border-sky-500/60 transition-all text-left relative overflow-hidden shadow-[0_30px_60px_rgba(30,27,75,0.4)]"
             >
                <div className="absolute top-0 right-0 py-6 px-12 transform rotate-45 translate-x-12 translate-y-4 bg-sky-500 text-white text-xs font-semibold uppercase tracking-widest text-center shadow-lg">
                  Enterprise
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="inline-flex px-4 py-1.5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-medium uppercase tracking-widest border border-sky-500/30">
                    {isKo ? '대규모 학교 및 재단 전용' : 'SCHOOL ENTERPRISE'}
                  </div>
                  <div>
                    <h4 className="text-5xl font-black uppercase tracking-tighter text-white">{isKo ? '견적 상담' : 'CUSTOM'}</h4>
                    <p className="text-xs font-medium text-sky-400 uppercase mt-2 tracking-widest">{isKo ? '학교 및 재단 맞춤형 시스템' : 'SCALABLE CLOUD SYSTEM'}</p>
                  </div>
                  <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
                    {isKo 
                      ? '수많은 학급, 전공 교사 피로도 점검, 교육 시간 충족 가이드와 융합된 안전하고 직관적인 관리 시스템을 누려보세요.' 
                      : 'A comprehensive campus deployment. Access unlimited classes, real-time workload audit dashboards, priority consulting alignment, and system uptime guarantees.'}
                  </p>
                  
                  <div className="space-y-3.5 pt-4">
                    {[
                      { en: "Unlimited Active Class Sync", ko: "무제한 학급 확장 결합" },
                      { en: "Teacher Workload Protection", ko: "교사 수업 강도 및 피로 안전 경고" },
                      { en: "Dedicated Success Specialist", ko: "전임 솔루션 지원 담당자" },
                      { en: "Database Auto Cloud Backups", ko: "클라우드 스토리지 실시간 백업보존" }
                    ].map((f, j) => (
                      <div key={j} className="flex items-center gap-3.5">
                        <div className="w-5 h-5 rounded-full bg-sky-400/20 flex items-center justify-center text-sky-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium uppercase tracking-widest text-slate-300">{isKo ? f.ko : f.en}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onEnter} 
                  className="w-full py-4.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-widest transition-all relative z-10 border border-white/10"
                >
                  {isKo ? '영업 연구팀 상담 요청' : 'Consult with Campus Engineer'}
                </motion.button>
             </motion.div>
           </FadeUp>
        </div>
      </section>

      {/* Footer Element */}
      <footer className="relative z-10 py-20 px-6 lg:px-16 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-600 flex items-center justify-center p-[1px] shadow-lg">
                <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                </div>
              </div>
              <span className="text-base font-medium tracking-[0.2em] text-white uppercase">EduPlanner.Pro</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500 max-w-sm leading-relaxed">
              Smarter Institutional Infrastructures. Powered by Gemini Cognitive Optimization. Engineered for Academic Excellence.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-5 text-left">
              <h4 className="text-xs font-medium text-white uppercase tracking-[0.3em]">{isKo ? '탐색' : 'Navigation'}</h4>
              <div className="flex flex-col gap-3.5">
                <button onClick={() => scrollTo('sandbox')} className="text-xs font-medium text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '샌드박스 체험' : 'Interactive Sandbox'}</button>
                <button onClick={() => scrollTo('features')} className="text-xs font-medium text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '기술 사양' : 'Intelligence Tech'}</button>
                <button onClick={() => scrollTo('pricing')} className="text-xs font-medium text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '구독' : 'License model'}</button>
              </div>
            </div>
            
            <div className="space-y-5 text-left">
              <h4 className="text-xs font-medium text-white uppercase tracking-[0.3em]">{isKo ? '법률 파트' : 'Legal Compliance'}</h4>
              <div className="flex flex-col gap-3.5">
                <button onClick={() => openLegal('privacy')} className="text-xs font-medium text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '개인정보 처리원칙' : 'Privacy Protection'}</button>
                <button onClick={() => openLegal('terms')} className="text-xs font-medium text-slate-400 uppercase tracking-widest hover:text-sky-400 text-left transition-colors">{isKo ? '이용 서비스 약정' : 'Terms & Conditions'}</button>
              </div>
            </div>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-xs font-medium uppercase tracking-[0.35em] text-slate-600">
            © {new Date().getFullYear()} EduPlanner Pro. ALL RIGHTS RESERVED. IN COMPLIANCE WITH EDUCATION CORES.
          </div>
          <div className="flex items-center gap-4 text-slate-600 text-xs font-bold">
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
