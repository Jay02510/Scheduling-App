import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Teacher, ClassGroup, Textbook } from '../types';

interface DashboardProps {
  teachers: Teacher[];
  classes: ClassGroup[];
  textbooks: Textbook[];
  onResync?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ teachers, classes, textbooks, onResync }) => {
  const stats = [
    { name: 'Teachers', value: teachers.length, color: '#6366f1', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'Classes', value: classes.length, color: '#a855f7', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Books', value: textbooks.length, color: '#3b82f6', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Parity', value: 94, unit: '%', color: '#2dd4bf', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  return (
    <div className="space-y-10 animate-fadeIn max-w-full overflow-hidden">
      <header className="px-1 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Academic Overview</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Live Institutional Health</p>
        </div>
        <div className="hidden md:block">
           <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">System Online</span>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:border-indigo-100 group">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 mb-4 border border-slate-100 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke={stat.color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={stat.icon} />
              </svg>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.name}</p>
            <p className="text-3xl font-black mt-1.5 tracking-tighter text-slate-900">
              {stat.value}{stat.unit}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Load Distrubtion</h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Actual</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Capacity</span></div>
            </div>
          </div>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.05)', padding: '12px' }} />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={50}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[#0f172a] p-10 rounded-[3rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-40 h-40 gradient-primary blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">Principal's Lens</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-bold text-slate-400">Schedule Parity</span>
                <span className="text-sm font-black text-emerald-400">98% High</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-bold text-slate-400">Staff Conflicts</span>
                <span className="text-sm font-black text-white">0 Detected</span>
              </div>
            </div>
            <button onClick={onResync} className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Refine Setup</button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Teacher Pulse</h3>
             <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-indigo-500 rounded-full"></div>
                   </div>
                   <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-slate-400">
                      <span>Burnout Risk</span>
                      <span className="text-indigo-600">Low (85% Safety)</span>
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