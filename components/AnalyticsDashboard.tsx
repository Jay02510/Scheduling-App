
import React, { useState } from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip } from 'recharts';
import { SchoolSchedule, SchoolProfile, Teacher } from '../types';
import { analyzeSchedule } from '../services/geminiService';

interface AnalyticsDashboardProps {
  schedule: SchoolSchedule;
  profile: SchoolProfile;
  teachers: Teacher[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ schedule, profile, teachers }) => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    setHasRequested(true);
    try {
      const result = await analyzeSchedule(schedule, profile, teachers);
      setDiagnostics(result);
    } catch (e) {
      console.error("Audit failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (!hasRequested) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-fadeIn">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-500 shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <div className="text-center max-w-md">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Audit Engine</h3>
          <p className="text-slate-500 text-sm mt-2 font-medium">Quantify institutional efficiency and identify burnout risks before they manifest.</p>
        </div>
        <button onClick={runAudit} className="px-10 py-5 bg-[#0f172a] text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">Execute Diagnostic</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-[6px] border-slate-100 rounded-full"></div>
          <div className="w-20 h-20 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[11px]">Calculating Metrics...</p>
      </div>
    );
  }

  const chartData = [
    { subject: 'Load', A: diagnostics?.loadScore || diagnostics?.score || 80, fullMark: 100 },
    { subject: 'Rules', A: diagnostics?.rulesScore || 90, fullMark: 100 },
    { subject: 'Usage', A: diagnostics?.usageScore || 75, fullMark: 100 },
    { subject: 'Goal', A: diagnostics?.goalScore || 85, fullMark: 100 },
    { subject: 'Flow', A: diagnostics?.flowScore || 70, fullMark: 100 },
  ];

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">AI Diagnostic</h2>
          <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest mt-1">Operational analysis results</p>
        </div>
        <button onClick={runAudit} className="flex items-center gap-3 bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Re-Analyze System</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="104" cy="104" r="96" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-50" />
              <circle cx="104" cy="104" r="96" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={603} strokeDashoffset={603 - (603 * (diagnostics?.score || 0)) / 100} className="text-indigo-600 transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">{diagnostics?.score}%</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Efficiency</span>
            </div>
          </div>
          <p className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
            {diagnostics?.burnoutRisks?.length || 0} Risk Factors Detected
          </p>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Balance Matrix</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                <Radar name="System" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Engine Insights</h3>
          <div className="space-y-3">
            {diagnostics?.insights?.map((insight: string, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex gap-5 group hover:border-indigo-100 transition-all">
                <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic">"{insight}"</p>
              </div>
            ))}
            {diagnostics?.burnoutRisks?.map((risk: string, idx: number) => (
              <div key={idx} className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 shadow-sm flex gap-5 group transition-all">
                <p className="text-[11px] text-rose-600 font-black uppercase tracking-tight">Warning: {risk}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
