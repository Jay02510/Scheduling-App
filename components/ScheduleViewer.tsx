import React, { useState } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, SubjectConfig } from '../types';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  subjects: SubjectConfig[];
  profile: SchoolProfile | null;
  onGenerateRoadmap: () => void;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, subjects, profile, onGenerateRoadmap }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [viewMode, setViewMode] = useState<'individual' | 'roadmap'>('individual');
  
  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours.totalPeriods || 8;

  const currentClass = classes.find(c => c.id === selectedClassId);
  const classSlots = schedule.weeklySlots.filter(s => s.classId === selectedClassId);

  // Helper to get names from IDs to avoid hallucinations
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setViewMode('individual')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Class Schedules</button>
          <button onClick={() => setViewMode('roadmap')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'roadmap' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Lesson Roadmap</button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto max-w-full pb-2 scrollbar-hide">
          {classes.map(c => (
            <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      {viewMode === 'individual' ? (
        <div className="bg-white border-[3px] border-slate-900 rounded-[1rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-[3px] border-slate-900">
                <th className="border-r-[3px] border-slate-900 p-6 text-[12px] font-black uppercase text-slate-800 w-32">Period</th>
                {days.map(d => <th key={d} className="border-r-[3px] last:border-r-0 border-slate-900 p-6 text-[11px] font-black uppercase text-slate-800">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalPeriods }).map((_, pIdx) => (
                <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                  <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 text-5xl bg-slate-50">{pIdx + 1}</td>
                  {Array.from({ length: 5 }).map((_, dIdx) => {
                    const lock = profile?.fixedClasses.find(f => f.dayOfWeek === dIdx && f.period === pIdx && (f.isSchoolWide || f.classIds.includes(selectedClassId)));
                    const slot = classSlots.find(s => s.day === dIdx && s.period === pIdx);
                    const teacher = teachers.find(t => t.id === slot?.teacherId);

                    if (lock) {
                      return (
                        <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 min-w-[180px] bg-slate-100">
                          <div className="h-full flex items-center justify-center p-4 text-center">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{lock.name}</span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 min-w-[180px] bg-white group hover:bg-slate-50 transition-colors">
                        {slot ? (
                          <div className="h-full flex flex-col">
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                              <span className="text-[13px] font-black text-slate-900 uppercase leading-tight">{getSubjectName(slot.subjectId)}</span>
                            </div>
                            <div className="h-12 flex items-center justify-center border-t-[3px] border-slate-900" style={{ backgroundColor: teacher?.color || '#cbd5e1' }}>
                              <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">{getTeacherName(slot.teacherId)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)]"></div>
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
        <div className="space-y-8">
          {schedule.quarterlyPlan.weeks.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] text-center space-y-4 border border-slate-100">
              <h3 className="text-2xl font-black text-slate-900">Roadmap Pending</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">Generate a pacing roadmap to see page targets across the quarter based on textbooks.</p>
              <button onClick={onGenerateRoadmap} className="bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest mt-4">Generate Roadmap</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 12 }).map((_, i) => {
                const weekNum = i + 1;
                const targets = schedule.quarterlyPlan.weeks.filter(w => w.weekNumber === weekNum);
                return (
                  <div key={weekNum} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <h4 className="text-2xl font-black text-slate-900">Week {weekNum}</h4>
                    <div className="space-y-3">
                      {targets.map((t, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-1">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{t.subject}</p>
                          <p className="font-bold text-slate-800 text-xs">{t.unit}</p>
                          <p className="text-[10px] font-black text-slate-400 mt-2 uppercase">Target: pp. {t.pages}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleViewer;