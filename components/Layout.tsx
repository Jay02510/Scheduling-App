
import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import LegalModal from './LegalModal';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenFeedback: () => void;
  isPremium?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, language, setLanguage, onOpenFeedback, isPremium }) => {
  const [legalView, setLegalView] = useState<{ isOpen: boolean, type: 'privacy' | 'terms' | 'compliance' }>({
    isOpen: false,
    type: 'privacy'
  });

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  const openLegal = (type: 'privacy' | 'terms' | 'compliance') => {
    setLegalView({ isOpen: true, type });
  };

  const tabs = [
    { id: 'home', label: t('dashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'setup', label: t('setup'), icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
    { id: 'homerooms', label: t('homerooms'), icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'curriculum', label: t('curriculum'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'faculty', label: t('faculty'), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'settings', label: t('settings'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-x-hidden font-inter">
      <nav className="w-full md:w-64 bg-[#0f172a] text-white p-5 flex flex-col md:min-h-screen md:sticky md:top-0 flex-shrink-0 z-20 no-print">
        <div className="mb-10 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl gradient-primary flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-sm font-black tracking-widest truncate uppercase">EduPlanner</h1>
          </div>
          
          <div className="flex bg-slate-800 p-0.5 rounded-lg text-[8px] font-black no-print">
             <button onClick={() => setLanguage('ko')} className={`px-2 py-1 rounded-md transition-all ${language === 'ko' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>KR</button>
             <button onClick={() => setLanguage('en')} className={`px-2 py-1 rounded-md transition-all ${language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>EN</button>
          </div>
        </div>

        {isPremium ? (
          <div className="mb-6 px-5 py-2.5 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center gap-2">
             <div className="w-2 h-2 rounded-full bg-sky-400"></div>
             <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">PRO ACCESS ACTIVE</span>
          </div>
        ) : (
          <div className="mb-6 px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-400"></div>
             <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">FREE STARTER MODE</span>
          </div>
        )}
        
        <div className="space-y-1 flex-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 relative group ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 gradient-primary rounded-2xl -z-0 shadow-lg shadow-indigo-500/10"></div>
                )}
                <svg className={`w-4 h-4 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} />
                </svg>
                <span className="relative z-10 truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
          <button
            onClick={onOpenFeedback}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-indigo-400 hover:text-white hover:bg-indigo-600/10 transition-all group border border-indigo-500/10"
          >
            <div className="relative">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            </div>
            <span>Give Feedback</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto h-screen max-w-full bg-slate-50 scroll-smooth">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>

      <LegalModal 
        isOpen={legalView.isOpen} 
        onClose={() => setLegalView({ ...legalView, isOpen: false })} 
        language={language}
        type={legalView.type}
      />
    </div>
  );
};

export default Layout;
