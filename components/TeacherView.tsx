import React, { useState, useEffect } from 'react';
import { SchoolSchedule, Teacher, ClassGroup, SchoolProfile, SubjectConfig } from '../types';

interface TeacherViewProps {
  schedule: SchoolSchedule;
  teachers: Teacher[];
  classes: ClassGroup[];
  subjects: SubjectConfig[];
  profile: SchoolProfile | null;
  initialTeacherId?: string;
}

const TeacherView: React.FC<TeacherViewProps> = ({ schedule, teachers, classes, subjects, profile, initialTeacherId }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  useEffect(() => {
    if (initialTeacherId) {
      setSelectedTeacherId(initialTeacherId);
    } else if (!selectedTeacherId && teachers && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, initialTeacherId]);

  const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;

  if (!teachers || teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
          <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-500 mb-8 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">Staff Required</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mb-8 leading-loose">Register teachers in the Setup tab to view their personal master schedules.</p>
      </div>
    );
  }

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  const filteredSlots = (schedule?.weeklySlots || []).filter(s => s.teacherId === currentTeacher.id);

  const totalLessons = filteredSlots.length;
  const breakTarget = currentTeacher.breaksNeededPerWeek || 5;
  const totalPossibleSlots = 5 * totalPeriods;
  const actualBreaks = totalPossibleSlots - totalLessons - (profile?.lockedSlots?.filter(l => l.isSchoolWide).length || 0);
  const wellnessPercent = Math.min(100, (actualBreaks / breakTarget) * 100);

  const getSubjectName = (id: string) => (subjects || []).find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-fadeIn max-w-full pb-12">
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
          <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-10 relative z-10">Staff Profile</h3>
          
          <div className="flex flex-col items-center mb-10 relative z-10">
             <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-4 border-4 border-white/5" style={{ backgroundColor: currentTeacher.color }}>{currentTeacher.name[0]}</div>
             <h4 className="text-xl font-black uppercase text-center">{currentTeacher.name}</h4>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{currentTeacher.role}</p>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span>Wellness (Breaks)</span>
                <span className={actualBreaks >= breakTarget ? "text-emerald-400" : "text-rose-400"}>
                  {actualBreaks} / {breakTarget}
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${actualBreaks >= breakTarget ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${wellnessPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">Weekly Load</p>
              <p className="text-2xl font-black">{totalLessons} <span className="text-xs text-slate-500">PERIODS</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-y-auto max-h-[400px] custom-scrollbar">
          {teachers.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTeacherId(t.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTeacherId === t.id ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></div>
              <span className="truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="xl:col-span-3 bg-white border-[3px] border-slate-900 rounded-[2rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-6 text-[12px] font-black uppercase text-slate-800 w-24">P</th>
              {days.map(day => <th key={day} className="border-r-[3px] last:border-r-0 border-slate-900 p-6 text-[11px] font-black uppercase tracking-widest">{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => (
              <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 text-4xl bg-slate-50">{pIdx + 1}</td>
                {Array.from({ length: 5 }).map((_, dIdx) => {
                  const lock = (profile?.lockedSlots || []).find(f => f.dayOfWeek === dIdx && f.period === pIdx && f.isSchoolWide);
                  const slot = filteredSlots.find(s => s.day === dIdx && s.period === pIdx);
                  const classInfo = slot ? (classes || []).find(c => c.id === slot.classId) : null;
                  
                  if (lock) return (
                    <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-32 bg-slate-100">
                      <div className="h-full flex items-center justify-center opacity-40 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_11px)]">
                        <span className="text-[9px] font-black uppercase text-slate-500 bg-white px-2 py-1 rounded-md tracking-widest shadow-sm">{lock.name}</span>
                      </div>
                    </td>
                  );

                  return (
                    <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-32 min-w-[150px] bg-white group hover:bg-slate-50/50 transition-colors">
                      {slot ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                            <span className="text-[12px] font-black leading-tight text-slate-900 uppercase tracking-tight">{getSubjectName(slot.subjectId)}</span>
                          </div>
                          <div className="h-10 flex items-center justify-center border-t-[3px] border-slate-900" style={{ backgroundColor: currentTeacher?.color || '#cbd5e1' }}>
                            <span className="text-[10px] font-black uppercase text-slate-900 truncate px-2">{classInfo?.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-[0.03] select-none">
                          <span className="text-[10px] font-black uppercase tracking-widest">REST</span>
                        </div>
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

export default TeacherView;