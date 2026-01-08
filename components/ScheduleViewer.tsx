import React, { useState, useEffect } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, SubjectConfig, ScheduleSlot } from '../types';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  subjects: SubjectConfig[];
  profile: SchoolProfile | null;
  onGenerateRoadmap: () => void;
  onUpdateSlot?: (slot: ScheduleSlot) => void;
  onNavigate?: (tab: string) => void;
  initialClassId?: string;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, subjects, profile, onGenerateRoadmap, onUpdateSlot, onNavigate, initialClassId }) => {
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

  if (!classes || classes.length === 0) {
    return (
      <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl mb-6 flex items-center justify-center text-slate-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Setup Required: No classes registered.</p>
      </div>
    );
  }

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classSlots = (schedule?.weeklySlots || []).filter(s => s.classId === currentClass.id);

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
    <div className="space-y-8 animate-fadeIn max-w-full">
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase">Edit Lesson</h3>
            <div className="space-y-3">
              <button onClick={() => handleApplyChange('')} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase mb-4 hover:bg-slate-100">Clear Period</button>
              {currentClass.assignments.map(a => (
                <button key={a.subjectId} onClick={() => handleApplyChange(a.subjectId)} className="w-full py-5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-900 font-black text-[11px] uppercase flex items-center justify-between px-6 hover:border-indigo-500 hover:shadow-lg transition-all">
                  <span>{getSubjectName(a.subjectId)}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{getTeacherName(a.teacherId)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setEditingSlot(null)} className="mt-8 w-full text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Close Menu</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-x-auto gap-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {classes.map(c => (
            <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-lg translate-y-[-2px]' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border-[3px] border-slate-900 rounded-[2.5rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[1100px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-6 text-[12px] font-black uppercase w-28">Period</th>
              {days.map(d => <th key={d} className="border-r-[3px] last:border-r-0 border-slate-900 p-6 text-[11px] font-black uppercase tracking-widest w-[200px]">{d}</th>)}
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
                        <span className="text-[10px] font-black uppercase text-slate-900 bg-white px-4 py-2 rounded-xl shadow-lg border-2 border-slate-900 tracking-[0.2em]">{lock.name}</span>
                      </div>
                    </td>
                  );

                  return (
                    <td key={dIdx} onClick={() => setEditingSlot({ day: dIdx, period: pIdx })} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] bg-white group hover:bg-slate-50 transition-colors cursor-pointer relative align-top">
                      {slot ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                            <span className="text-[15px] font-black text-slate-900 uppercase leading-tight line-clamp-2 group-hover:scale-105 transition-transform duration-300">{getSubjectName(slot.subjectId)}</span>
                          </div>
                          <div className="h-12 flex items-center justify-center border-t-[3px] border-slate-900 shrink-0" style={{ backgroundColor: teacher?.color || '#cbd5e1' }}>
                            <span className="text-[10px] font-black uppercase text-slate-900 truncate px-4 tracking-tight">{teacher?.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)]"></div>
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

export default ScheduleViewer;