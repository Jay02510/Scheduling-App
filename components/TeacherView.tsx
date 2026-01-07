
import React, { useState, useEffect } from 'react';
import { SchoolSchedule, Teacher, ClassGroup, SchoolProfile, SubjectConfig } from '../types';

interface TeacherViewProps {
  schedule: SchoolSchedule;
  teachers: Teacher[];
  classes: ClassGroup[];
  subjects: SubjectConfig[];
  profile: SchoolProfile | null;
}

const TeacherView: React.FC<TeacherViewProps> = ({ schedule, teachers, classes, subjects, profile }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  useEffect(() => {
    if (!selectedTeacherId && teachers && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;

  if (!teachers || teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
          <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-500 mb-8 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">No Staff Registered</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mb-8 leading-loose">Staff schedules will appear here once teachers are added and lessons are assigned in the Setup tab.</p>
      </div>
    );
  }

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  const filteredSlots = (schedule?.weeklySlots || []).filter(s => s.teacherId === currentTeacher.id);

  // Calculate Wellness Stats
  const totalLessons = filteredSlots.length;
  const breakTarget = currentTeacher.breaksNeededPerWeek || 5;
  const totalPossibleSlots = 5 * totalPeriods;
  const actualBreaks = totalPossibleSlots - totalLessons - (profile?.lockedSlots?.filter(l => l.isSchoolWide).length || 0);
  const wellnessPercent = Math.min(100, (actualBreaks / breakTarget) * 100);

  const getSubjectName = (id: string) => (subjects || []).find(s => s.id === id)?.name || 'Unknown Subject';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-fadeIn max-w-full pb-12">
      {/* Wellness Sidebar */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-[#0f172a] p-8 rounded-[2.5rem] text-white shadow-xl">
          <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Staff Wellness</h3>
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span>Weekly Breaks</span>
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
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">Weekly Load</p>
              <p className="text-2xl font-black">{totalLessons} Periods</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 bg-slate-100 p-2 rounded-[2rem]">
          {teachers.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTeacherId(t.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTeacherId === t.id ? 'bg-white text-slate-900 shadow-sm translate-x-1' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></div>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="xl:col-span-3 bg-white border-[3px] border-slate-900 rounded-[1.5rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-6 text-[12px] font-black uppercase text-slate-800 w-24">
                P
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
                <td className="border-r-[3px] border-slate-900 p-6 text-center font-black text-slate-900 text-3xl bg-slate-50">
                  {pIdx + 1}
                </td>
                {Array.from({ length: 5 }).map((_, dIdx) => {
                  const lock = (profile?.lockedSlots || []).find(f => f.dayOfWeek === dIdx && f.period === pIdx && f.isSchoolWide);
                  const slot = filteredSlots.find(s => s.day === dIdx && s.period === pIdx);
                  const classInfo = slot ? (classes || []).find(c => c.id === slot.classId) : null;
                  
                  if (lock) return (
                    <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-28 bg-slate-100">
                      <div className="h-full flex items-center justify-center opacity-40 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_11px)]">
                        <span className="text-[9px] font-black uppercase text-slate-500 bg-white px-2 py-1 rounded-md">{lock.name}</span>
                      </div>
                    </td>
                  );

                  return (
                    <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 relative h-28 min-w-[140px] bg-white group hover:bg-slate-50/50 transition-colors">
                      {slot ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center p-3 text-center">
                            <span className="text-[11px] font-black leading-tight text-slate-900 uppercase tracking-tight">
                              {getSubjectName(slot.subjectId)}
                            </span>
                          </div>
                          <div 
                            className="h-10 flex items-center justify-center border-t-[3px] border-slate-900"
                            style={{ backgroundColor: currentTeacher?.color || '#cbd5e1' }}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{classInfo?.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-5">
                          <span className="text-[9px] font-black uppercase">REST</span>
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
