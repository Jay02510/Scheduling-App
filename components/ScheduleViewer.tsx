
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
  onMoveSlot?: (source: { day: number, period: number }, target: { day: number, period: number }, classId: string, isCopy: boolean) => void;
  onFillSlots?: (source: { day: number, period: number }, range: { startDay: number, endDay: number, startPeriod: number, endPeriod: number }, classId: string) => void;
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

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, subjects, textbooks, lockedSlots, profile, onGenerateRoadmap, onUpdateSlot, onMoveSlot, onFillSlots, onNavigate, onJump, initialClassId }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [editingSlot, setEditingSlot] = useState<{ day: number, period: number } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ day: number, period: number } | null>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ day: number, period: number } | null>(null);
  const [fillSource, setFillSource] = useState<{ day: number, period: number } | null>(null);
  const [fillTarget, setFillTarget] = useState<{ day: number, period: number } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => setIsAltPressed(e.altKey);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    if (initialClassId) setSelectedClassId(initialClassId);
    else if (!selectedClassId && classes?.length > 0) setSelectedClassId(classes[0].id);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
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

  const handleDragStart = (day: number, period: number) => setDraggedItem({ day, period });

  const handleDragOver = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    const isLocked = (lockedSlots || []).some(f => 
      f.dayOfWeek === day && f.period === period && (f.isSchoolWide || (f.classIds && f.classIds.includes(currentClass.id)))
    );
    if (!isLocked) setDropTarget({ day, period });
  };

  const handleDrop = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    if (draggedItem && onMoveSlot) {
      onMoveSlot(draggedItem, { day, period }, currentClass.id, isAltPressed);
    }
    setDraggedItem(null);
    setDropTarget(null);
  };

  const onFillStart = (e: React.MouseEvent, day: number, period: number) => {
    e.stopPropagation(); e.preventDefault();
    setFillSource({ day, period });
    setFillTarget({ day, period });
  };

  const onFillMove = (day: number, period: number) => { if (fillSource) setFillTarget({ day, period }); };

  const onFillEnd = () => {
    if (fillSource && fillTarget && onFillSlots) {
      const diffDay = Math.abs(fillTarget.day - fillSource.day);
      const diffPeriod = Math.abs(fillTarget.period - fillSource.period);
      let range;
      if (diffDay >= diffPeriod) {
        range = { startDay: Math.min(fillSource.day, fillTarget.day), endDay: Math.max(fillSource.day, fillTarget.day), startPeriod: fillSource.period, endPeriod: fillSource.period };
      } else {
        range = { startDay: fillSource.day, endDay: fillSource.day, startPeriod: Math.min(fillSource.period, fillTarget.period), endPeriod: Math.max(fillSource.period, fillTarget.period) };
      }
      onFillSlots(fillSource, range, currentClass.id);
    }
    setFillSource(null); setFillTarget(null);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-full" onMouseUp={onFillEnd}>
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 no-print">
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
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Homeroom Portal</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Class Rhythm & Resources</p>
        </div>
        <div className="flex items-center gap-4 no-print">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export PDF
          </button>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
            {classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="bg-white border-[2px] border-slate-900 rounded-[2.5rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.03)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b-[2px] border-slate-900">
              <th className="border-r-[2px] border-slate-900 p-4 text-[10px] font-black uppercase w-40">Period</th>
              {days.map(d => <th key={d} className="border-r-[2px] last:border-r-0 border-slate-900 p-4 text-[10px] font-black uppercase tracking-widest">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => {
              const pStart = formatTime(startTime, pIdx * duration);
              const pEnd = formatTime(startTime, (pIdx + 1) * duration);
              return (
                <tr key={pIdx} className="border-b-[2px] border-slate-900 last:border-b-0">
                  <td className="border-r-[2px] border-slate-900 p-4 text-center font-black text-slate-900 bg-slate-50 h-[110px]">
                    <div className="text-2xl tracking-tighter leading-none mb-1">{pIdx + 1}</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{pStart} — {pEnd}</div>
                  </td>
                  {Array.from({ length: 5 }).map((_, dIdx) => {
                    const lock = (lockedSlots || []).find(f => f.dayOfWeek === dIdx && f.period === pIdx && (f.isSchoolWide || f.classIds.includes(currentClass.id)));
                    const slot = classSlots.find(s => s.day === dIdx && s.period === pIdx);
                    const teacher = teachers.find(t => t.id === slot?.teacherId);
                    const isTarget = dropTarget?.day === dIdx && dropTarget?.period === pIdx;
                    const isDragging = draggedItem?.day === dIdx && draggedItem?.period === pIdx;
                    const isInFillRange = fillSource && fillTarget && (
                      (dIdx === fillSource.day && pIdx >= Math.min(fillSource.period, fillTarget.period) && pIdx <= Math.max(fillSource.period, fillTarget.period)) ||
                      (pIdx === fillSource.period && dIdx >= Math.min(fillSource.day, fillTarget.day) && dIdx <= Math.max(fillSource.day, fillTarget.day))
                    );

                    if (lock) return (
                      <td key={dIdx} className="border-r-[2px] last:border-r-0 border-slate-900 p-0 h-[110px] align-middle relative overflow-hidden bg-vivid-blocked">
                        <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                          <span className="text-[11px] font-black uppercase tracking-tight text-slate-500 leading-none">{lock.name}</span>
                        </div>
                      </td>
                    );

                    return (
                      <td key={dIdx} onMouseEnter={() => onFillMove(dIdx, pIdx)} onDragOver={(e) => handleDragOver(e, dIdx, pIdx)} onDrop={(e) => handleDrop(e, dIdx, pIdx)}
                        className={`border-r-[2px] last:border-r-0 border-slate-900 p-0 h-[110px] transition-all relative align-top ${isTarget ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset z-10' : isInFillRange ? 'bg-blue-50/50 ring-2 ring-blue-500 ring-inset z-20' : 'bg-white group hover:bg-slate-50'}`}>
                        {slot ? (
                          <div className={`h-full flex flex-col relative ${isDragging ? 'opacity-30 scale-95' : ''} ${isAltPressed ? 'cursor-copy' : 'cursor-grab active:cursor-grabbing'}`} draggable="true" onDragStart={() => handleDragStart(dIdx, pIdx)}>
                            <button onClick={() => setEditingSlot({ day: dIdx, period: pIdx })} className="flex-1 flex flex-col items-center justify-center p-4 text-center overflow-hidden pointer-events-none">
                              <span className="text-[13px] font-black text-slate-900 uppercase leading-tight line-clamp-2 tracking-tight">{getSubjectName(slot.subjectId)}</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if(onJump) onJump(slot.teacherId, 'teacher'); }} className="h-8 flex items-center justify-center border-t-[2px] border-slate-900 shrink-0 hover:brightness-95 transition-all pointer-events-auto" style={{ backgroundColor: teacher?.color || '#cbd5e1' }}>
                              <span className="text-[9px] font-black uppercase text-slate-900 truncate px-4 tracking-tighter">{teacher?.name}</span>
                            </button>
                            <div onMouseDown={(e) => onFillStart(e, dIdx, pIdx)} className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-30 hover:scale-125 transition-transform no-print" title="Replicate"></div>
                          </div>
                        ) : (
                          <div onClick={() => setEditingSlot({ day: dIdx, period: pIdx })} className={`h-full cursor-pointer ${isInFillRange ? 'bg-blue-400/20' : 'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)] opacity-[0.03]'}`}></div>
                        )}
                        {isInFillRange && <div className="absolute inset-0 border-2 border-dashed border-blue-500 animate-pulse-soft pointer-events-none no-print"></div>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center gap-6 no-print">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">SWAP • ALT+COPY • FILL HANDLE</p>
      </div>
    </div>
  );
};

export default ScheduleViewer;
