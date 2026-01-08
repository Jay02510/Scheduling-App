
import React, { useState, useEffect } from 'react';
import { SchoolSchedule, Teacher, ClassGroup, SchoolProfile, SubjectConfig, LockedSlot } from '../types';

interface TeacherViewProps {
  schedule: SchoolSchedule;
  teachers: Teacher[];
  classes: ClassGroup[];
  subjects: SubjectConfig[];
  lockedSlots: LockedSlot[];
  profile: SchoolProfile | null;
  initialTeacherId?: string;
}

const TeacherView: React.FC<TeacherViewProps> = ({ schedule, teachers, classes, subjects, lockedSlots, profile, initialTeacherId }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  useEffect(() => {
    if (initialTeacherId) {
      setSelectedTeacherId(initialTeacherId);
    } else if (!selectedTeacherId && teachers && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, initialTeacherId]);

  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;

  if (!teachers || teachers.length === 0) return null;

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  const filteredSlots = (schedule?.weeklySlots || []).filter(s => s.teacherId === currentTeacher.id);

  const getSubjectName = (id: string) => subjects?.find(s => s.id === id)?.name || 'Unknown';

  // Identify all classes assigned to this teacher across all subjects
  const assignedClasses = classes.filter(c => 
    c.homeroomTeacherId === currentTeacher.id || 
    (c.assignments || []).some(a => a.teacherId === currentTeacher.id)
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-fadeIn max-w-full pb-12">
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl flex flex-col h-full min-h-[600px]">
           <div className="flex flex-col items-center mb-10 shrink-0">
             <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-6 ring-4 ring-white/10" style={{ backgroundColor: currentTeacher.color }}>{currentTeacher.name[0]}</div>
             <h4 className="text-xl font-black uppercase text-center tracking-tight truncate w-full px-4">{currentTeacher.name}</h4>
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 opacity-70">{currentTeacher.role}</p>
          </div>

          <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
            <div className="shrink-0">
               <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Load Registry</h5>
               <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {teachers.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setSelectedTeacherId(t.id)} 
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedTeacherId === t.id 
                      ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' 
                      : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }}></div>
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col pt-6 border-t border-white/5">
               <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 shrink-0">Faculty Portfolio</h5>
               <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
                 {assignedClasses.length > 0 ? assignedClasses.map(c => (
                   <div key={c.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase">{c.name}</span>
                   </div>
                 )) : (
                   <p className="text-[9px] text-slate-500 font-bold uppercase py-4 text-center">No Active Classes</p>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="xl:col-span-3 bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-6 text-[12px] font-black uppercase w-24">P</th>
              {days.map(day => <th key={day} className="border-r-[3px] last:border-r-0 border-slate-900 p-6 text-[11px] font-black uppercase tracking-widest">{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => (
              <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 text-4xl bg-slate-50 h-[140px]">{pIdx + 1}</td>
                {Array.from({ length: 5 }).map((_, dIdx) => {
                  const slot = filteredSlots.find(s => s.day === dIdx && s.period === pIdx);
                  const classInfo = slot ? (classes || []).find(c => c.id === slot.classId) : null;
                  
                  const lock = (lockedSlots || []).find(f => 
                    f.dayOfWeek === dIdx && 
                    f.period === pIdx && 
                    (f.isSchoolWide || (classInfo && f.classIds?.includes(classInfo.id)))
                  );

                  if (lock) return (
                    <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] bg-vivid-blocked align-middle relative overflow-hidden">
                      <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-[12px] font-black uppercase tracking-tight text-white leading-none drop-shadow-lg">{lock.name}</span>
                      </div>
                    </td>
                  );

                  return (
                    <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] bg-white group hover:bg-slate-50/50 transition-colors align-top">
                      {slot ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                            <span className="text-[14px] font-black leading-tight text-slate-900 uppercase tracking-tight line-clamp-2 group-hover:scale-105 transition-transform duration-300">{getSubjectName(slot.subjectId)}</span>
                          </div>
                          <div className="h-12 flex items-center justify-center border-t-[3px] border-slate-900 shrink-0" style={{ backgroundColor: currentTeacher?.color || '#cbd5e1' }}>
                            <span className="text-[11px] font-black uppercase text-slate-900 truncate px-4 tracking-tighter">{classInfo?.name}</span>
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
