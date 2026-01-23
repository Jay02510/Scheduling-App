
import React from 'react';
import { SchoolProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface MasterRhythmProps {
  profile: SchoolProfile | null;
  language: Language;
}

const MasterRhythm: React.FC<MasterRhythmProps> = ({ profile, language }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;
  const days = language === 'ko' ? ['월', '화', '수', '목', '금'] : ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;
  const locks = profile?.lockedSlots || [];

  return (
    <div className="space-y-10 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{t('daily_rhythm')}</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Core Institutional Structure</p>
        </div>
        <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Global Master Template</span>
        </div>
      </header>

      <div className="bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[20px_20px_0px_rgba(15,23,42,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-8 text-[11px] font-black uppercase w-32 tracking-widest">{t('period')}</th>
              {days.map(d => <th key={d} className="border-r-[3px] last:border-r-0 border-slate-900 p-8 text-[11px] font-black uppercase tracking-widest">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => (
              <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 text-3xl bg-slate-50 h-[140px] flex flex-col items-center justify-center">
                  <span className="leading-none">{pIdx + 1}</span>
                  <span className="text-[9px] text-slate-400 mt-2 font-black uppercase">Slot</span>
                </td>
                {Array.from({ length: 5 }).map((_, dIdx) => {
                  const globalLock = locks.find(l => l.dayOfWeek === dIdx && l.period === pIdx && l.isSchoolWide);
                  
                  return (
                    <td key={dIdx} className={`border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] align-middle transition-all duration-500 ${globalLock ? 'bg-slate-950 text-white' : 'bg-white hover:bg-slate-50/50'}`}>
                      {globalLock ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center h-full animate-fadeIn group">
                          <span className="text-[12px] font-black uppercase tracking-[0.2em] group-hover:scale-105 transition-transform">{globalLock.name}</span>
                          <div className="w-8 h-1 bg-indigo-500 rounded-full mt-3 opacity-50"></div>
                        </div>
                      ) : (
                        <div className="h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#0f172a_10px,#0f172a_11px)] opacity-[0.03]"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterRhythm;
