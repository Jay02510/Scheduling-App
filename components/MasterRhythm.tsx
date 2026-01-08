
import React from 'react';
import { SchoolProfile, LockedSlot } from '../types';

interface MasterRhythmProps {
  profile: SchoolProfile | null;
}

const MasterRhythm: React.FC<MasterRhythmProps> = ({ profile }) => {
  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;
  const locks = profile?.lockedSlots || [];

  return (
    <div className="space-y-10 animate-fadeIn">
      <header>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Master Rhythm</h2>
        <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Core Institutional Structure</p>
      </header>

      <div className="bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[16px_16px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-8 text-[12px] font-black uppercase w-32">Slot</th>
              {days.map(d => <th key={d} className="border-r-[3px] last:border-r-0 border-slate-900 p-8 text-[12px] font-black uppercase tracking-widest">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => (
              <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 text-4xl bg-slate-50 h-[140px]">{pIdx + 1}</td>
                {Array.from({ length: 5 }).map((_, dIdx) => {
                  const globalLock = locks.find(l => l.dayOfWeek === dIdx && l.period === pIdx && l.isSchoolWide);
                  
                  return (
                    <td key={dIdx} className={`border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] align-middle ${globalLock ? 'bg-slate-900 text-white' : 'bg-white opacity-20'}`}>
                      {globalLock ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center h-full animate-fadeIn">
                          <span className="text-[14px] font-black uppercase tracking-[0.2em]">{globalLock.name}</span>
                        </div>
                      ) : (
                        <div className="h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_11px)] opacity-5"></div>
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
