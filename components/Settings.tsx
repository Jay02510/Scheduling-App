
import React, { useState } from 'react';
import { SchoolProfile, Teacher, SchoolSchedule } from '../types';
import AnalyticsDashboard from './AnalyticsDashboard';

interface SettingsProps {
  user: any;
  profile: SchoolProfile | null;
  teachers: Teacher[];
  schedule: SchoolSchedule | null;
  onReset: () => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, profile, teachers, schedule, onReset, onLogout }) => {
  const [view, setView] = useState<'account' | 'audit'>('account');

  return (
    <div className="space-y-12 animate-fadeIn max-w-full overflow-hidden pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Control Center</h2>
          <p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest mt-1">Manage institutional logic and account</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner gap-1">
          <button onClick={() => setView('account')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'account' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>General</button>
          <button onClick={() => setView('audit')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'audit' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Strategic Audit</button>
        </div>
      </header>

      {view === 'account' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 flex flex-col justify-between">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Administrator</h3>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
                  {user.email?.[0].toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-lg truncate max-w-[200px]">{user.email}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Master Auth Level</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl"
            >
              System Logout
            </button>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border-2 border-rose-50 shadow-sm space-y-8 flex flex-col justify-between">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-4">Danger Zone</h3>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Factory Reset</h3>
              <p className="text-slate-500 text-xs font-medium mt-2 leading-relaxed">
                Wipe all faculty, curriculum, textbooks, and schedules from cloud storage. This is irreversible.
              </p>
            </div>
            <button 
              onClick={onReset} 
              className="w-full py-5 rounded-2xl bg-rose-50 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
            >
              Clear Institutional Data
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm">
          {profile && schedule ? (
            <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} />
          ) : (
            <div className="py-20 text-center text-slate-300 font-black uppercase text-xs">Generate a schedule first to run strategic audit</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
