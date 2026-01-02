import React, { useState } from 'react';
import { SchoolSchedule, Teacher, ClassGroup, SchoolProfile, SubjectConfig } from '../types';

interface TeacherViewProps {
  schedule: SchoolSchedule;
  teachers: Teacher[];
  classes: ClassGroup[];
  subjects: SubjectConfig[];
  profile: SchoolProfile | null;
}

const TeacherView: React.FC<TeacherViewProps> = ({ schedule, teachers, classes, subjects, profile }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri'];
  const totalPeriods = profile?.hours.totalPeriods || 8;

  const filteredSlots = schedule.weeklySlots.filter(s => s.teacherId === selectedTeacherId);
  const teacher = teachers.find(t => t.id === selectedTeacherId);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown Subject';

  return (
    <div className="space-y-10 animate-fadeIn max-w-full overflow-hidden pb-12">
      <div className="flex flex-wrap gap-2 justify-center bg-slate-100 p-1.5 rounded-[2.5rem] w-fit mx-auto shadow-inner border border-slate-200">
        {teachers.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTeacherId(t.id)}
            className={`px-6 py-3 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest transition-all ${selectedTeacherId === t.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] rounded-[0.5rem]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white border-b-2 border-slate-900">
              <th className="border-r-2 border-slate-900 p-5 text-[12px] font-black uppercase text-slate-800 w-24 bg-slate-50">
                {teacher?.name || 'Staff'}
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
                  const classInfo = slot ? classes.find(c => c.id === slot.classId) : null;
                  
                  return (
                    <td key={dIdx} className="border-r-2 last:border-r-0 border-slate-900 p-0 relative h-28 min-w-[160px] bg-white group hover:bg-slate-50/50 transition-colors">
                      {slot ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center p-3 text-center">
                            <span className="text-[11px] font-black leading-tight text-slate-900 uppercase tracking-tight">
                              {getSubjectName(slot.subjectId)}
                            </span>
                            {slot.topic && <span className="text-[8px] font-bold text-slate-400 mt-1 italic line-clamp-2">{slot.topic}</span>}
                          </div>
                          <div 
                            className="h-10 flex items-center justify-center border-t-2 border-slate-900 transition-all"
                            style={{ backgroundColor: teacher?.color || '#cbd5e1' }}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{classInfo?.name || 'No Group'}</span>
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

      <div className="flex flex-col items-center gap-2 pt-6">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Faculty Status: {teacher?.role || 'Unspecified'}</p>
        <div className="w-12 h-1 rounded-full bg-slate-200"></div>
      </div>
    </div>
  );
};

export default TeacherView;