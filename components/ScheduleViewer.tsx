
import React, { useState } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, FixedClass } from '../types';
import { DAYS_PER_WEEK } from '../constants';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  profile: SchoolProfile | null;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, profile }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri'];
  const totalPeriods = profile?.hours.totalPeriods || 8;

  const filteredSlots = schedule.weeklySlots.filter(s => s.classId === selectedClassId);
  const currentClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-10 animate-fadeIn max-w-full overflow-hidden pb-12">
      <div className="flex bg-slate-100 p-1.5 rounded-[2.5rem] w-fit mx-auto shadow-inner border border-slate-200 overflow-x-auto max-w-full scrollbar-hide">
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

      <div className="flex items-center justify-center gap-6 pt-4">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 border border-slate-900 bg-white"></div>
           <span className="text-[8px] font-black uppercase text-slate-400">Open Session</span>
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
