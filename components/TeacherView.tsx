
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

const formatTime = (timeStr: string, minutesToAdd: number) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const TeacherView: React.FC<TeacherViewProps> = ({ schedule, teachers, classes, subjects, lockedSlots, profile, initialTeacherId }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  useEffect(() => {
    if (initialTeacherId) setSelectedTeacherId(initialTeacherId);
    else if (!selectedTeacherId && teachers && teachers.length > 0) setSelectedTeacherId(teachers[0].id);
  }, [teachers, initialTeacherId]);

  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;
  const startTime = profile?.hours?.startTime || '08:30';
  const duration = profile?.hours?.periodDuration || 45;

  if (!teachers || teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 animate-fadeIn">
        <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-500 mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h3 className="text-xl font-black text-white">Faculty Registry Empty</h3>
        <p className="text-slate-400 text-xs font-bold uppercase mt-1">Initialize staff in the Setup Center first.</p>
      </div>
    );
  }

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  const filteredSlots = (schedule?.weeklySlots || []).filter(s => s.teacherId === currentTeacher.id);
  const getSubjectName = (id: string) => subjects?.find(s => s.id === id)?.name || 'Unknown';
  const assignedClasses = (classes || []).filter(c => c.homeroomTeacherId === currentTeacher.id || (c.assignments || []).some(a => a.teacherId === currentTeacher.id));

  const handleExportPDF = () => {
    const originalTitle = document.title;
    document.title = `Faculty_Schedule_${currentTeacher.name}_${new Date().toLocaleDateString()}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-fadeIn max-w-full pb-12">
      <div className="xl:col-span-1 space-y-6 no-print">
        <div className="bg-[#0f172a] p-8 rounded-[2rem] text-white border border-slate-800 shadow-[6px_6px_0px_rgba(0,0,0,0.4)] flex flex-col h-full min-h-[500px]">
           <div className="flex flex-col items-center mb-8 shrink-0">
             <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center text-slate-900 text-2xl font-black shadow-lg border-2 border-slate-900 mb-4" style={{ backgroundColor: currentTeacher.color }}>{currentTeacher.name[0]}</div>
             <h4 className="text-lg font-black uppercase text-center tracking-tight truncate w-full px-2">{currentTeacher.name}</h4>
             <p className="text-xs font-black text-sky-400 uppercase tracking-widest mt-1 opacity-70">{currentTeacher.role}</p>
          </div>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Faculty List</h5>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {teachers.map(t => (
                <button key={t.id} onClick={() => setSelectedTeacherId(t.id)} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-colors ${selectedTeacherId === t.id ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }}></div>
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
               <button 
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 border border-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-400 transition-colors shadow-md"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 Export PDF
               </button>
               <div>
                  <h5 className="text-xs font-black text-sky-400 tracking-[0.04em] mb-3">Portfolio</h5>
                  <div className="flex flex-wrap gap-2">
                    {assignedClasses.map(c => (
                      <div key={c.id} className="px-3 py-1.5 bg-slate-800/60 rounded-lg text-xs font-bold text-slate-300 uppercase border border-slate-700">{c.name}</div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="xl:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,0.4)] max-w-full overflow-x-auto">
        <div className="hidden print:block p-8 border-b border-slate-800">
           <div className="flex justify-between items-end">
             <div>
                 <h1 className="text-3xl font-black uppercase tracking-tighter">{currentTeacher.name}</h1>
                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Weekly Instructional Schedule • {currentTeacher.role}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-black tracking-widest text-sky-400">Faculty Resource Matrix</p>
                 <p className="text-xs font-bold text-slate-400 uppercase">{new Date().toLocaleDateString()}</p>
              </div>
           </div>
        </div>
        
        <table className="w-full border-collapse table-fixed min-w-[800px]">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800">
              <th className="border-r border-slate-800 p-4 text-xs font-black uppercase w-28 text-slate-300">Period</th>
              {days.map(day => <th key={day} className="border-r last:border-r-0 border-slate-800 p-4 text-xs font-black uppercase tracking-widest text-slate-300">{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => {
              const pStart = formatTime(startTime, pIdx * duration);
              const pEnd = formatTime(startTime, (pIdx + 1) * duration);
              return (
                <tr key={pIdx} className="border-b border-slate-800 last:border-b-0">
                  <td className="border-r border-slate-800 p-4 text-center font-black text-slate-300 bg-slate-900/60 h-[110px]">
                    <div className="text-xl tracking-tighter leading-none mb-1 text-white">{pIdx + 1}</div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{pStart} — {pEnd}</div>
                  </td>
                  {Array.from({ length: 5 }).map((_, dIdx) => {
                    const slot = filteredSlots.find(s => s.day === dIdx && s.period === pIdx);
                    const classInfo = slot ? (classes || []).find(c => c.id === slot.classId) : null;
                    const lock = (lockedSlots || []).find(f => f.dayOfWeek === dIdx && f.period === pIdx && (f.isSchoolWide || (classInfo && f.classIds?.includes(classInfo.id))));

                    if (lock) return (
                      <td key={dIdx} className="border-r border-slate-800 last:border-r-0 border-slate-800 p-0 h-[110px] bg-slate-950 align-middle relative overflow-hidden">
                        <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                          <span className="text-xs font-black uppercase tracking-tight text-slate-400 leading-none">{lock.name}</span>
                        </div>
                      </td>
                    );

                    return (
                      <td key={dIdx} className="border-r border-slate-800 last:border-r-0 border-slate-800 p-0 h-[110px] bg-slate-900/20 group hover:bg-slate-800/40 transition-colors align-top">
                        {slot ? (
                          <div className="h-full flex flex-col">
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                              <span className="text-xs font-semibold leading-tight text-white tracking-tight line-clamp-2">{getSubjectName(slot.subjectId)}</span>
                            </div>
                            <div className="h-8 flex items-center justify-center border-t border-slate-800 shrink-0" style={{ backgroundColor: classInfo?.color || '#cbd5e1' }}>
                              <span className="text-xs font-black uppercase text-slate-900 truncate px-4 tracking-tighter">{classInfo?.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center bg-sky-500/5 group-hover:bg-sky-500/10 transition-colors m-1 rounded-xl">
                            <svg className="w-3 h-3 text-sky-400 mb-1 no-print" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="text-xs font-black text-sky-400 uppercase tracking-widest">Rest</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherView;
