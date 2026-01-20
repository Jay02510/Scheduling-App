
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip } from 'recharts';
import { SchoolSchedule, SchoolProfile, Teacher } from '../types';
import { analyzeSchedule } from '../services/geminiService';
import React, { useState } from 'react';

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
          <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Guardian Audit Engine</h3>
          <p className="text-slate-500 text-sm mt-2 font-medium text-balance">Review burnout risks, operational stability, and curriculum coverage confidence.</p>
        </div>
        <button onClick={runAudit} className="px-10 py-5 bg-[#0f172a] text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">Perform Institutional Audit</button>
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
        <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[11px]">Guardian is auditing operational health...</p>
      </div>
    );
  }

  const chartData = [
    { subject: 'Faculty Balance', A: diagnostics?.score || 80, fullMark: 100 },
    { subject: 'Stability', A: 95, fullMark: 100 },
    { subject: 'Cognitive Load', A: 85, fullMark: 100 },
    { subject: 'Integrity', A: 100, fullMark: 100 },
    { subject: 'Sustainability', A: 75, fullMark: 100 },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'text-rose-500 bg-rose-50';
      case 'medium': return 'text-amber-500 bg-amber-50';
      default: return 'text-emerald-500 bg-emerald-50';
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Strategic Audit</h2>
          <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest mt-1">Institutional Intelligence Analysis</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-6 py-4 bg-white text-slate-900 border border-slate-200 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Export Report</button>
          <button onClick={runAudit} className="px-6 py-4 bg-[#0f172a] text-indigo-400 border border-indigo-900/50 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-lg">Refresh Audit</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-50" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * (diagnostics?.score || 0)) / 100} className="text-indigo-600 transition-all duration-1000" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{diagnostics?.score}%</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Health Score</span>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Impact:</span>
                <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase ${getImpactColor(diagnostics?.impactLevel)}`}>{diagnostics?.impactLevel || 'Low'}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Confidence:</span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[9px] uppercase">{diagnostics?.coverageConfidence || 'Safe'}</span>
              </div>
            </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Faculty Sustainability Matrix</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(diagnostics?.burnoutRisks || {}).map(([name, risk]: [string, any]) => (
                  <div key={name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-700 uppercase truncate pr-2">{name}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${getRiskColor(risk as string)} shadow-sm`}></div>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 gradient-primary blur-[50px] opacity-20"></div>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Guardian Perspective (Admin Explanation)</h3>
              <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"{diagnostics?.adminExplanation || diagnostics?.summary || 'Audit pending system refresh.'}"</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Load & Balance Matrix</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <Radar name="Guardian Audit" dataKey="A" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Actionable Intelligence</h3>
          <div className="space-y-3">
            {diagnostics?.insights?.map((insight: string, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex gap-5 group hover:border-indigo-100 transition-all">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5"></div>
                <p className="text-[11px] text-slate-600 font-bold leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
