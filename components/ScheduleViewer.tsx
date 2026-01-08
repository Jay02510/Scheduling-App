
import React, { useState, useEffect } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, SubjectConfig, ScheduleSlot, Textbook, LockedSlot } from '../types';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  subjects: SubjectConfig[];
  textbooks: Textbook[];
  lockedSlots: LockedSlot[];
  profile: SchoolProfile | null;
  onGenerateRoadmap: () => void;
  onUpdateSlot?: (slot: ScheduleSlot) => void;
  onMoveSlot?: (source: { day: number, period: number }, target: { day: number, period: number }, classId: string) => void;
  onNavigate?: (tab: string) => void;
  onJump?: (id: string, type: 'teacher' | 'class') => void;
  initialClassId?: string;
}

const formatTime = (timeStr: string, minutesToAdd: number) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, subjects, textbooks, lockedSlots, profile, onGenerateRoadmap, onUpdateSlot, onMoveSlot, onNavigate, onJump, initialClassId }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [editingSlot, setEditingSlot] = useState<{ day: number, period: number } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ day: number, period: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: number, period: number } | null>(null);

  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId);
    } else if (!selectedClassId && classes && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, initialClassId]);

  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;
  const startTime = profile?.hours?.startTime || '08:30';
  const duration = profile?.hours?.periodDuration || 45;

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  if (!currentClass) return null;

  const classSlots = (schedule?.weeklySlots || []).filter(s => s.classId === currentClass.id);
  const getSubjectName = (id: string) => subjects?.find(s => s.id === id)?.name || 'Unknown';
  
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

  const handleDragStart = (day: number, period: number) => {
    setDraggedItem({ day, period });
  };

  const handleDragOver = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    const isLocked = (lockedSlots || []).some(f => 
      f.dayOfWeek === day && f.period === period && (f.isSchoolWide || (f.classIds && f.classIds.includes(currentClass.id)))
    );
    if (!isLocked) {
      setDropTarget({ day, period });
    }
  };

  const handleDrop = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    if (draggedItem && onMoveSlot) {
      onMoveSlot(draggedItem, { day, period }, currentClass.id);
    }
    setDraggedItem(null);
    setDropTarget(null);
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
                    <span className="text-[10px] text-slate-400">{teachers.find(t => t.id === a.teacherId)?.name}</span>
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
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em] mt-2">Class Rhythm & Resources</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full bg-slate-100 p-2 rounded-[2rem] border border-slate-200">
          {classes.map(c => (
            <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-6 py-3 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{c.name}</button>
          ))}
        </div>
      </header>

      <div className="bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[16px_16px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[1100px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-8 text-[12px] font-black uppercase w-48">Period</th>
              {days.map(d => <th key={d} className="border-r-[3px] last:border-r-0 border-slate-900 p-8 text-[12px] font-black uppercase tracking-widest">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => {
              const pStart = formatTime(startTime, pIdx * duration);
              const pEnd = formatTime(startTime, (pIdx + 1) * duration);
              
              return (
                <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                  <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 bg-slate-50 h-[140px]">
                    <div className="text-3xl tracking-tighter leading-none mb-2">{pIdx + 1}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{pStart} — {pEnd}</div>
                  </td>
                  {Array.from({ length: 5 }).map((_, dIdx) => {
                    const lock = (lockedSlots || []).find(f => 
                      f.dayOfWeek === dIdx && 
                      f.period === pIdx && 
                      (f.isSchoolWide || (f.classIds && f.classIds.includes(currentClass.id)))
                    );
                    const slot = classSlots.find(s => s.day === dIdx && s.period === pIdx);
                    const teacher = teachers.find(t => t.id === slot?.teacherId);
                    const isTarget = dropTarget?.day === dIdx && dropTarget?.period === pIdx;
                    const isDragging = draggedItem?.day === dIdx && draggedItem?.period === pIdx;

                    if (lock) return (
                      <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] align-middle relative overflow-hidden bg-vivid-blocked">
                        <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                          <span className="text-[14px] font-black uppercase tracking-[0.2em] text-white leading-none drop-shadow-lg">{lock.name}</span>
                        </div>
                      </td>
                    );

                    return (
                      <td 
                        key={dIdx} 
                        className={`border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[140px] transition-all relative align-top ${isTarget ? 'bg-indigo-50 ring-4 ring-indigo-500 ring-inset z-10' : 'bg-white group hover:bg-slate-50'}`}
                        onDragOver={(e) => handleDragOver(e, dIdx, pIdx)}
                        onDrop={(e) => handleDrop(e, dIdx, pIdx)}
                      >
                        {slot ? (
                          <div 
                            className={`h-full flex flex-col cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-30 scale-95' : ''}`}
                            draggable="true"
                            onDragStart={() => handleDragStart(dIdx, pIdx)}
                          >
                            <button onClick={() => setEditingSlot({ day: dIdx, period: pIdx })} className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden focus:outline-none pointer-events-none">
                              <span className="text-[16px] font-black text-slate-900 uppercase leading-tight line-clamp-2">{getSubjectName(slot.subjectId)}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); if(onJump) onJump(slot.teacherId, 'teacher'); }}
                              className="h-12 flex items-center justify-center border-t-[3px] border-slate-900 shrink-0 hover:brightness-90 transition-all pointer-events-auto" 
                              style={{ backgroundColor: teacher?.color || '#cbd5e1' }}
                            >
                              <span className="text-[11px] font-black uppercase text-slate-900 truncate px-6 tracking-tight">{teacher?.name}</span>
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => setEditingSlot({ day: dIdx, period: pIdx })} 
                            className="h-full cursor-pointer bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)] opacity-5"
                          ></div>
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
      <div className="flex justify-center">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">DRAG LESSONS TO REARRANGE SCHEDULE</p>
      </div>
    </div>
  );
};

export default ScheduleViewer;
