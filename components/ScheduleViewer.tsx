import React, { useState } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, ScheduleSlot, MonthlyPlan } from '../types';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  profile: SchoolProfile | null;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, profile }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [viewMode, setViewMode] = useState<'table' | 'roadmap'>('table');
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  
  const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri'];
  const totalPeriods = profile?.hours.totalPeriods || 8;

  const filteredSlots = schedule.weeklySlots.filter(s => s.classId === selectedClassId);
  const currentClass = classes.find(c => c.id === selectedClassId);
  const currentMonth = schedule.yearlyPlan?.[activeMonthIdx];

  // Get relevant events for current month
  const monthEvents = profile?.specialEvents.filter(ev => {
    const evMonth = new Date(ev.date).toLocaleString('default', { month: 'long' });
    return evMonth === currentMonth?.month;
  }) || [];

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
            Weekly Master
          </button>
          <button 
            onClick={() => setViewMode('roadmap')}
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all ${viewMode === 'roadmap' ? 'bg-white text-slate-900' : 'text-white hover:text-indigo-300'}`}
          >
            Monthly Roadmap
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
                    const slot = filteredSlots.find(s => s.day === dIdx && s.period === pIdx);
                    const teacher = teachers.find(t => t.id === slot?.teacherId);
                    
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
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 animate-fadeInUp">
          {/* Month Selector Sidebar */}
          <div className="w-full md:w-56 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pr-2 custom-scrollbar flex-shrink-0">
            {schedule.yearlyPlan?.map((plan, idx) => (
              <button
                key={plan.month}
                onClick={() => setActiveMonthIdx(idx)}
                className={`flex-shrink-0 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${activeMonthIdx === idx ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                {plan.month}
              </button>
            ))}
          </div>

          {/* Monthly Roadmap Content */}
          <div className="flex-1 bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 overflow-hidden">
            <header className="border-b border-slate-100 pb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-3xl font-black text-slate-900">{currentMonth?.month} Roadmap</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Curriculum Targets for {currentClass?.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {monthEvents.map(ev => (
                  <span key={ev.id} className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border ${ev.type === 'holiday' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-amber-50 border-amber-100 text-amber-500'}`}>
                    {ev.name} ({new Date(ev.date).toLocaleDateString('en-US', { day: 'numeric' })})
                  </span>
                ))}
              </div>
            </header>

            <div className="grid grid-cols-1 gap-12">
              {[1, 2, 3, 4].map(weekNum => {
                const weekTargets = currentMonth?.weeks.filter(w => w.weekNumber === weekNum) || [];
                return (
                  <div key={weekNum} className="space-y-6 relative">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">
                        W{weekNum}
                      </div>
                      <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {weekTargets.length === 0 ? (
                        <p className="text-[10px] text-slate-300 font-bold uppercase py-4">Pacing adjusted for calendar events</p>
                      ) : weekTargets.map((target, tIdx) => (
                        <div key={tIdx} className="p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all group">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{target.subject}</p>
                          <h4 className="font-black text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
                            {target.unit}
                          </h4>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Target:</span>
                            <span className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-[9px] font-black text-slate-700">
                              pp. {target.pages}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 pt-4">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 border border-slate-900 bg-white"></div>
           <span className="text-[8px] font-black uppercase text-slate-400">Standard Lesson</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 border border-slate-900 bg-slate-50"></div>
           <span className="text-[8px] font-black uppercase text-slate-400">Institutional Break</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewer;