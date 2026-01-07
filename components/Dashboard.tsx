import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Teacher, ClassGroup, Textbook } from '../types';

interface DashboardProps {
  teachers: Teacher[];
  classes: ClassGroup[];
  textbooks: Textbook[];
  onResync?: () => void;
  onJump?: (id: string, type: 'teacher' | 'class') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ teachers = [], classes = [], textbooks = [], onResync, onJump }) => {
  const stats = [
    { name: 'Staff', value: teachers.length, color: '#6366f1', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'Classes', value: classes.length, color: '#a855f7', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Books', value: textbooks.length, color: '#3b82f6', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Readiness', value: teachers.length > 0 && classes.length > 0 ? 94 : 0, unit: '%', color: '#2dd4bf', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  return (
    <div className="space-y-12 animate-fadeIn max-w-full">
      <header className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">School Hub</h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Live Operational Metrics</p>
        </div>
        <div className="hidden md:flex gap-4">
           <button onClick={onResync} className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">Setup Center</button>
           <span className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">System Live</span>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 mb-6 border border-slate-50 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke={stat.color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={stat.icon} />
              </svg>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.name}</p>
            <p className="text-4xl font-black mt-2 tracking-tighter text-slate-900">
              {stat.value}{stat.unit}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Classroom Hub */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 px-2">Classroom Hub</h3>
                 <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {classes.map(c => (
                       <button key={c.id} onClick={() => onJump?.(c.id, 'class')} className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl shadow-inner" style={{ backgroundColor: c.color }}></div>
                             <span className="font-black text-slate-800 uppercase text-xs">{c.name}</span>
                          </div>
                          <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                       </button>
                    ))}
                 </div>
              </div>

              {/* Faculty Registry */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 px-2">Faculty Registry</h3>
                 <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {teachers.map(t => (
                       <button key={t.id} onClick={() => onJump?.(t.id, 'teacher')} className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                             <div className="text-left">
                                <p className="font-black text-slate-800 uppercase text-xs">{t.name}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.role}</p>
                             </div>
                          </div>
                          <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="xl:col-span-4 space-y-8">
          <div className="bg-[#0f172a] p-12 rounded-[4rem] shadow-2xl text-white relative overflow-hidden group min-h-[300px] flex flex-col justify-between">
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 gradient-primary blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8">AI Efficiency</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <span className="text-sm font-bold text-slate-400">Timetable Score</span>
                  <span className="text-lg font-black text-emerald-400">92%</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <span className="text-sm font-bold text-slate-400">Staff Rest Factor</span>
                  <span className="text-lg font-black text-white">Optimal</span>
                </div>
              </div>
            </div>
            <button onClick={onResync} className="w-full mt-10 py-5 bg-white text-slate-900 rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl">Tune Setup</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;