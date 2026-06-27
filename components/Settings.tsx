
import React, { useState } from 'react';
import { SchoolProfile, Teacher, SchoolSchedule, Language } from '../types';
import AnalyticsDashboard from './AnalyticsDashboard';
import BetaCodeModal from './BetaCodeModal';

interface SettingsProps {
  user: any;
  profile: SchoolProfile | null;
  teachers: Teacher[];
  schedule: SchoolSchedule | null;
  isPremium: boolean;
  onReset: () => void;
  onLogout: () => void;
  language: Language;
}

const Settings: React.FC<SettingsProps> = ({ user, profile, teachers, schedule, isPremium, onReset, onLogout, language }) => {
  const [view, setView] = useState<'account' | 'audit'>('account');
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);

  const isKo = language === 'ko';

  return (
    <div className="space-y-12 animate-fadeIn max-w-full overflow-hidden pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Control Center</h2>
          <p className="text-slate-400 font-medium text-xs tracking-wide mt-1">Manage institutional logic and account</p>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
          <button onClick={() => setView('account')} className={`px-5 py-2.5 rounded-xl text-xs font-medium normal-case transition-colors ${view === 'account' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>General</button>
          <button onClick={() => setView('audit')} className={`px-5 py-2.5 rounded-xl text-xs font-medium normal-case transition-colors ${view === 'audit' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Strategic Audit</button>
        </div>
      </header>

      {view === 'account' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 shadow-sm space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-medium tracking-[0.04em] text-slate-400 mb-6">Administrator</h3>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/20">
                    {user.email?.[0].toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg truncate max-w-[200px]">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-xs font-medium text-slate-400">Auth Level:</p>
                       <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${isPremium ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{isPremium ? 'Institutional' : 'Standard'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {!isPremium && (
                <div className="p-6 bg-slate-950/40 rounded-[1.5rem] border border-slate-800">
                  <p className="text-xs font-medium text-slate-200 tracking-tight mb-3">Upgrade to Institutional Tier</p>
                  <button 
                    onClick={() => setIsBetaModalOpen(true)}
                    className="w-full py-3 bg-sky-500/10 border border-dashed border-sky-500/40 text-sky-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-500/20 transition-colors"
                  >
                    Redeem Beta Invite Code
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={onLogout} 
              className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs normal-case transition-colors shadow-xl"
            >
              System Logout
            </button>
          </div>

          <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-rose-500/20 shadow-sm space-y-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-medium text-rose-400 mb-4">Danger Zone</h3>
              <h3 className="text-xl font-black text-white tracking-tight">Factory Reset</h3>
              <p className="text-slate-400 text-xs font-medium mt-2 leading-relaxed">
                Wipe all faculty, curriculum, textbooks, and schedules from cloud storage. This is irreversible.
              </p>
            </div>
            <button 
              onClick={onReset} 
              className="w-full py-5 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-medium normal-case border border-rose-500/20 transition-colors shadow-sm"
            >
              Clear Institutional Data
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 p-10 rounded-[3.5rem] border border-slate-800 shadow-sm">
          {profile && schedule ? (
            <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} />
          ) : (
            <div className="py-20 text-center text-slate-500 font-black uppercase text-xs">Generate a schedule first to run strategic audit</div>
          )}
        </div>
      )}

      <BetaCodeModal 
        isOpen={isBetaModalOpen} 
        onClose={() => setIsBetaModalOpen(false)} 
        userId={user.uid} 
        language={language} 
        onSuccess={() => window.location.reload()} 
      />
    </div>
  );
};

export default Settings;
