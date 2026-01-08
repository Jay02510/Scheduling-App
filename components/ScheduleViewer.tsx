
import React, { useState, useEffect } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, SubjectConfig, ScheduleSlot, Textbook } from '../types';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  subjects: SubjectConfig[];
  textbooks: Textbook[];
  profile: SchoolProfile | null;
  onGenerateRoadmap: () => void;
  onUpdateSlot?: (slot: ScheduleSlot) => void;
  onNavigate?: (tab: string) => void;
  initialClassId?: string;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, subjects, textbooks, profile, onGenerateRoadmap, onUpdateSlot, onNavigate, initialClassId }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [editingSlot, setEditingSlot] = useState<{ day: number, period: number } | null>(null);

  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId);
    } else if (!selectedClassId && classes && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, initialClassId]);

  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  if (!currentClass) return null;

  const classSlots = (schedule?.weeklySlots || []).filter(s => s.classId === currentClass.id);
  const classTextbooks = textbooks.filter(t => t.classId === currentClass.id);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  const handleApplyChange = (subjectId: string) => {
    if (!editingSlot || !onUpdateSlot || !currentClass) return;
    const assignment = currentClass.assignments.find(a => a.subjectId === subjectId);
    onUpdateSlot({
      id: Math.random().toString(36).substr(2, 9),
      day: editingSlot.day,
      period: editingSlot.period,
      classId: currentClass.id,
      subjectId,
      teacherId: assignment?.teacherId || '',
      isManualOverride: true
    });
    setEditingSlot(null);
  };

  return (
    <div className="space-y-12 animate-fadeIn max-w-full">
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-12 w-full max-w-md shadow-2xl animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Modify Lesson</h3>
            <div className="space-y-4">
              <button onClick={() => handleApplyChange('')} className="w-full py-5 rounded-2xl bg-slate-100 text-slate-500 font-black text-[11px] uppercase mb-4 hover:bg-slate-200">Clear Slot</button>
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {currentClass.assignments.map(a => (
                  <button key={a.subjectId} onClick={() => handleApplyChange(a.subjectId)} className="w-full py-5 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black text-[12px] uppercase flex items-center justify-between px-6 hover:border-slate-900 transition-all">
                    <span>{getSubjectName(a.subjectId)}</span>
                    <span className="text-[10px] text-slate-400">{getTeacherName(a.teacherId)}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setEditingSlot(null)} className="mt-8 w-full text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] py-4">Close Menu</button>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Homeroom Portal</h2>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Schedule & Class Resources</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
          {classes.map(c => (
            <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-xl translate-y-[-2px]' : 'bg-white text-slate-400 border border-slate-100'}`}>{c.name}</button>
          ))}
        </div>
      </header>

      <div className="bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[16px_16px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[1100px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-8 text-[12px] font-black uppercase w-32">Slot</th>
              {days.map(d => <th key={d} className="border-r-[3px] last:border-r-0 border-slate-900 p-8 text-[12px] font-black uppercase tracking-widest">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => (
              <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 text-4xl bg-slate-50 h-[140px]">{pIdx + 1}</td>
                {Array.from({ length: 5 }).map((_, dIdx) => {
                  const lock = (profile?.lockedSlots || []).find(f => f.dayOfWeek === dIdx && f.period === pIdx && f.isSchoolWide);
                  const slot = classSlots.find(s => s.day === dIdx && s.period === pIdx);
                  const teacher = teachers.find(t => t.id === slot?.teacherId);

                  if (lock) return (
                    <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] bg-slate-100 align-middle">
                      <div className="h-full flex items-center justify-center opacity-40 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_11px)]">
                        <span className="text-[11px] font-black uppercase text-slate-900 bg-white px-5 py-3 rounded-2xl shadow-xl border-2 border-slate-900 tracking-[0.2em]">{lock.name}</span>
                      </div>
                    </td>
                  );

                  return (
                    <td key={dIdx} onClick={() => setEditingSlot({ day: dIdx, period: pIdx })} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] bg-white group hover:bg-slate-50 transition-colors cursor-pointer relative align-top">
                      {slot ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                            <span className="text-[16px] font-black text-slate-900 uppercase leading-tight line-clamp-2 group-hover:scale-105 transition-transform duration-300">{getSubjectName(slot.subjectId)}</span>
                          </div>
                          <div className="h-12 flex items-center justify-center border-t-[3px] border-slate-900 shrink-0" style={{ backgroundColor: teacher?.color || '#cbd5e1' }}>
                            <span className="text-[11px] font-black uppercase text-slate-900 truncate px-6 tracking-tight">{teacher?.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)] opacity-5"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-6">
        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Assigned Class Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classTextbooks.length > 0 ? classTextbooks.map(book => (
            <div key={book.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shrink-0">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div className="overflow-hidden">
                <h4 className="font-black text-slate-900 text-lg leading-tight uppercase truncate">{book.title}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{book.subject} • Unit {Math.floor((book.currentPage || 0) / 10) + 1}</p>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
              <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest">No Textbooks assigned to this homeroom yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ScheduleViewer;
