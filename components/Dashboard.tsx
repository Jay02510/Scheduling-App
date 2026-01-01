
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
    { name: 'Health', value: 100, unit: '%', color: '#2dd4bf', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  return (
    <div className="space-y-10 animate-fadeIn max-w-full overflow-hidden">
      <header className="px-1">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Overview</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">School at a glance</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:border-indigo-100 group">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-slate-50 mb-4 border border-slate-50 group-hover:scale-110 transition-transform">
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
        <div className="xl:col-span-8 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">System Totals</h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.05)', padding: '12px' }} />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={45}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Actions</h3>
            <button 
              onClick={onResync}
              className="w-full p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center gap-5 transition-all hover:bg-indigo-100 group shadow-sm active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl gradient-primary flex-shrink-0 flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
                 <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <div className="text-left">
                <p className="font-black text-slate-900 text-base leading-tight">Edit Setup</p>
                <p className="text-xs text-slate-500 font-bold mt-1">Teachers & classes</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
