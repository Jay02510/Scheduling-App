import React, { useState } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, ScheduleSlot } from '../types';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  profile: SchoolProfile | null;
  onGenerateRoadmap: () => void;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, profile, onGenerateRoadmap }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [viewMode, setViewMode] = useState<'master' | 'roadmap'>('master');
  
  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours.totalPeriods || 8;

  const filteredSlots = schedule.weeklySlots.filter(s => s.classId === selectedClassId);
  const currentClass = classes.find(c => c.id === selectedClassId);
  const qPlan = schedule.quarterlyPlan;
  const hasRoadmap = qPlan && qPlan.weeks && qPlan.weeks.length > 0;

  return (
    <div className="space-y-10 animate-fadeIn max-w-full overflow-hidden pb-12">
      <div className="flex flex-col items-center gap-6">
        <div className="flex bg-slate-100 p-1.5 rounded-[2.5rem] w-fit shadow-inner border border-slate-200 overflow-x-auto max-w-full scrollbar-hide">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`px-8 py-3.5 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex bg-[#0f172a] p-1.5 rounded-[1.25rem] shadow-xl">
          <button 
            onClick={() => setViewMode('master')}
            className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'master' ? 'bg-white text-slate-900 shadow-lg' : 'text-white hover:text-indigo-300'}`}
          >
            Master Schedule
          </button>
          <button 
            onClick={() => setViewMode('roadmap')}
            className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'roadmap' ? 'bg-white text-slate-900 shadow-lg' : 'text-white hover:text-indigo-300'}`}
          >
            Quarterly Plan
          </button>
        </div>
      </div>

      {viewMode === 'master' ? (
        <div className="bg-white border-[3px] border-slate-900 overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] rounded-[0.75rem]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white border-b-[3px] border-slate-900">
                <th className="border-r-[3px] border-slate-900 p-6 text-[12px] font-black uppercase text-slate-800 w-32 bg-slate-50">
                  {currentClass?.name || 'Group'}
                </th>
                {days.map(day => (
                  <th key={day} className="border-r-[3px] last:border-r-0 border-slate-900 p-6 text-[11px] font-black uppercase text-slate-800">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalPeriods }).map((_, pIdx) => (
                <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                  <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 text-5xl bg-slate-50">
                    {pIdx + 1}
                  </td>
                  {Array.from({ length: 5 }).map((_, dIdx) => {
                    const fixed = profile?.fixedClasses.find(f => 
                      f.dayOfWeek === dIdx && 
                      f.period === pIdx && 
                      (f.isSchoolWide || f.classIds?.includes(selectedClassId))
                    );

                    const isLunch = pIdx === profile?.hours.lunchAfterPeriod;
                    const slot = filteredSlots.find(s => s.day === dIdx && s.period === pIdx);
                    const teacher = teachers.find(t => t.id === slot?.teacherId);
                    
                    if (isLunch) {
                      return (
                        <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 min-w-[180px] bg-slate-100/50">
                           <div className="h-full flex items-center justify-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Lunch</span>
                           </div>
                        </td>
                      );
                    }

                    if (fixed) {
                      return (
                        <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 relative h-36 min-w-[180px] bg-slate-50">
                          <div className="h-full flex flex-col justify-center items-center text-center px-4">
                            <span className="text-[14px] font-black text-slate-900 uppercase leading-tight tracking-[0.05em]">{fixed.name}</span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 relative h-36 min-w-[180px] bg-white group hover:bg-slate-50/50 transition-colors">
                        {slot ? (
                          <div className="h-full flex flex-col">
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                              <span className="text-[12px] font-black leading-tight text-slate-900 uppercase tracking-tight">{slot.subject}</span>
                            </div>
                            <div 
                              className="h-14 flex items-center justify-center border-t-[3px] border-slate-900 transition-all group-hover:brightness-95"
                              style={{ backgroundColor: teacher?.color || '#cbd5e1' }}
                            >
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">{teacher?.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#f8fafc_5px,#f8fafc_10px)] opacity-30"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-10 animate-fadeInUp">
          {!hasRoadmap ? (
            <div className="bg-white p-20 rounded-[3.5rem] border border-slate-100 text-center flex flex-col items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Monthly Lesson Planner</h3>
              <p className="text-slate-500 text-sm mt-2 mb-8 max-w-md">Distribute curriculum page targets based on textbooks and red days.</p>
              <button onClick={onGenerateRoadmap} className="gradient-primary text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-all">Generate Monthly Roadmap</button>
            </div>
          ) : (
            <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-12">
              <header className="border-b border-slate-100 pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">Curriculum Pacing</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Target Pages for {currentClass?.name}</p>
                </div>
                <button onClick={onGenerateRoadmap} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Recalculate</button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 12 }).map((_, i) => {
                  const weekNum = i + 1;
                  const weekTargets = qPlan?.weeks.filter(w => w.weekNumber === weekNum) || [];
                  const isHoliday = weekTargets.some(t => t.isHolidayWeek);
                  
                  return (
                    <div key={weekNum} className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden ${isHoliday ? 'bg-rose-50 border-rose-100 shadow-rose-100/20' : 'bg-slate-50 border-slate-100 shadow-slate-100/20 shadow-xl'}`}>
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-2xl font-black text-slate-900">Week {weekNum}</span>
                        {isHoliday && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Holiday</span>}
                      </div>

                      <div className="space-y-4">
                        {weekTargets.map((target, tIdx) => (
                          <div key={tIdx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                             <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{target.subject}</p>
                                <span className="text-[9px] font-black text-slate-400">pp. {target.pages}</span>
                             </div>
                             <h4 className="font-bold text-slate-800 text-xs leading-tight">{target.unit}</h4>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleViewer;