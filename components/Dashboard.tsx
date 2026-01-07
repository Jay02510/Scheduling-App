import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Teacher, ClassGroup, Textbook } from '../types';

interface DashboardProps {
  teachers: Teacher[];
  classes: ClassGroup[];
  textbooks: Textbook[];
  onResync?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ teachers = [], classes = [], textbooks = [], onResync }) => {
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
           <button onClick={onResync} className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Setup Center</button>
           <span className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">System Ready</span>
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
        <div className="xl:col-span-8 bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Institutional Balance</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[9px] font-black text-slate-500 uppercase">Allocated</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"></div><span className="text-[9px] font-black text-slate-500 uppercase">Total Capacity</span></div>
            </div>
          </div>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} dy={15} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', padding: '16px' }} />
                <Bar dataKey="value" radius={[16, 16, 16, 16]} barSize={60}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-8">
          <div className="bg-[#0f172a] p-12 rounded-[4rem] shadow-2xl text-white relative overflow-hidden group min-h-[300px] flex flex-col justify-between">
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 gradient-primary blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8">AI Audit Summary</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <span className="text-sm font-bold text-slate-400">Conflict Score</span>
                  <span className="text-lg font-black text-emerald-400">0 Critical</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <span className="text-sm font-bold text-slate-400">Teacher Rest</span>
                  <span className="text-lg font-black text-white">Optimal</span>
                </div>
              </div>
            </div>
            <button onClick={onResync} className="w-full mt-10 py-5 bg-white text-slate-900 rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl">Tune System Parameters</button>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[200px]">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">System Sync</h3>
             <div className="flex items-center gap-6">
                <div className="flex-1 space-y-2">
                   <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[100%] bg-emerald-500 rounded-full animate-pulse"></div>
                   </div>
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-slate-400">
                      <span>Cloud Storage</span>
                      <span className="text-emerald-600">Encrypted & Synced</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;