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
  const [viewMode, setViewMode] = useState<'table' | 'roadmap'>('table');
  
  const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri'];
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

        <div className="flex bg-slate-900 p-1 rounded-2xl shadow-xl">
          <button 
            onClick={() => setViewMode('table')}
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all ${viewMode === 'table' ? 'bg-white text-slate-900' : 'text-white hover:text-indigo-300'}`}
          >
            Master Schedule
          </button>
          <button 
            onClick={() => setViewMode('roadmap')}
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all ${viewMode === 'roadmap' ? 'bg-white text-slate-900' : 'text-white hover:text-indigo-300'}`}
          >
            Quarterly Plan
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] rounded-[0.5rem]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white border-b-2 border-slate-900">
                <th className="border-r-2 border-slate-900 p-5 text-[12px] font-black uppercase text-slate-800 w-24 bg-slate-50">
                  {currentClass?.name || 'Class'}
                </th>
                {days.map(day => (
                  <th key={day} className="border-r-2 last:border-r-0 border-slate-900 p-5 text-[11px] font-black uppercase text-slate-800">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalPeriods }).map((_, pIdx) => (
                <tr key={pIdx} className="border-b-2 border-slate-900 last:border-b-0">
                  <td className="border-r-2 border-slate-900 p-6 text-center font-black text-slate-900 text-2xl bg-slate-50">
                    {pIdx + 1}
                  </td>
                  {Array.from({ length: 5 }).map((_, dIdx) => {
                    const fixed = profile?.fixedClasses.find(f => 
                      f.dayOfWeek === dIdx && 
                      f.period === pIdx && 
                      (f.isSchoolWide || f.classIds?.includes(selectedClassId))
                    );

                    const slot = filteredSlots.find(s => s.day === dIdx && s.period === pIdx);
                    const teacher = teachers.find(t => t.id === slot?.teacherId);
                    
                    if (fixed) {
                      return (
                        <td key={dIdx} className="border-r-2 last:border-r-0 border-slate-900 p-0 relative h-28 min-w-[160px] bg-slate-100">
                          <div className="h-full flex flex-col justify-center items-center text-center px-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Locked Slot</span>
                            <span className="text-[11px] font-black text-slate-900 uppercase leading-tight">{fixed.name}</span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={dIdx} className="border-r-2 last:border-r-0 border-slate-900 p-0 relative h-28 min-w-[160px] bg-white group hover:bg-slate-50/50 transition-colors">
                        {slot ? (
                          <div className="h-full flex flex-col">
                            <div className="flex-1 flex flex-col items-center justify-center p-3 text-center">
                              <span className="text-[11px] font-black leading-tight text-slate-900 uppercase tracking-tight">{slot.subject}</span>
                              {slot.topic && <span className="text-[8px] font-bold text-slate-400 mt-1 italic line-clamp-2">{slot.topic}</span>}
                            </div>
                            <div 
                              className="h-10 flex items-center justify-center border-t-2 border-slate-900 transition-all group-hover:brightness-95"
                              style={{ backgroundColor: teacher?.color || '#cbd5e1' }}
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{teacher?.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#f8fafc_5px,#f8fafc_10px)]"></div>
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
            <div className="bg-white p-20 rounded-[3.5rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900">No Roadmap Generated</h3>
              <p className="text-slate-500 text-sm mt-2 mb-8 max-w-md">The curriculum roadmap calculates exactly how many pages to cover per week based on your textbooks and red days.</p>
              <button 
                onClick={onGenerateRoadmap}
                className="gradient-primary text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-all"
              >
                Generate 12-Week Plan
              </button>
            </div>
          ) : (
            <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-12">
              <header className="border-b border-slate-100 pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Resource Roadmap</span>
                  <h3 className="text-4xl font-black text-slate-900 mt-2">Pacing Breakdown</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">12-Week targets for {currentClass?.name}</p>
                </div>
                <button 
                  onClick={onGenerateRoadmap}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all"
                >
                  Regenerate Plan
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, i) => {
                  const weekNum = i + 1;
                  const weekTargets = qPlan?.weeks.filter(w => w.weekNumber === weekNum) || [];
                  const isHoliday = weekTargets.some(t => t.isHolidayWeek);
                  
                  return (
                    <div key={weekNum} className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden group ${isHoliday ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50/50 border-slate-100 hover:border-indigo-200'}`}>
                      {isHoliday && (
                        <div className="absolute top-0 right-0 p-4">
                          <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-2xl font-black text-slate-900">Week {weekNum}</span>
                        {isHoliday && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-rose-100">Short Week</span>}
                      </div>

                      <div className="space-y-4">
                        {weekTargets.length === 0 ? (
                          <p className="text-[10px] text-slate-300 font-bold uppercase py-4 italic text-center">No pacing data</p>
                        ) : weekTargets.map((target, tIdx) => (
                          <div key={tIdx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{target.subject}</p>
                               <span className="text-[9px] font-black text-slate-400">pp. {target.pages}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs leading-tight">
                              {target.unit}
                            </h4>
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

      <div className="flex items-center justify-center gap-8 pt-8 border-t border-slate-100">
        <div className="flex items-center gap-3">
           <div className="w-4 h-4 rounded-md border-2 border-slate-900 bg-white"></div>
           <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Academic Lesson</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="w-4 h-4 rounded-md border-2 border-slate-900 bg-slate-100"></div>
           <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Fixed/Locked Block</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewer;