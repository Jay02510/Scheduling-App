
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

  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;

  if (!teachers || teachers.length === 0) return null;

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  const filteredSlots = (schedule?.weeklySlots || []).filter(s => s.teacherId === currentTeacher.id);

  const getSubjectName = (id: string) => subjects?.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-fadeIn max-w-full pb-12">
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl">
           <div className="flex flex-col items-center mb-10">
             <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-6" style={{ backgroundColor: currentTeacher.color }}>{currentTeacher.name[0]}</div>
             <h4 className="text-xl font-black uppercase text-center">{currentTeacher.name}</h4>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{currentTeacher.role}</p>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {teachers.map(t => (
              <button 
                key={t.id} 
                onClick={() => setSelectedTeacherId(t.id)} 
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedTeacherId === t.id 
                  ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' 
                  : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></div>
                <span className="truncate">{t.name}</span>
              </button>
            ))}
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
                  
                  const lock = (profile?.lockedSlots || []).find(f => 
                    f.dayOfWeek === dIdx && 
                    f.period === pIdx && 
                    (f.isSchoolWide || (classInfo && f.classIds?.includes(classInfo.id)))
                  );

                  if (lock) return (
                    <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] bg-slate-50/50 align-middle relative">
                      <div className="absolute inset-0 border-2 border-dashed border-slate-200 m-2 rounded-2xl"></div>
                      <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-[12px] font-black uppercase tracking-tight text-slate-500">{lock.name}</span>
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
