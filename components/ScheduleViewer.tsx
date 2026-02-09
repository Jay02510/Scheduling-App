
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, SubjectConfig, ScheduleSlot, Textbook, LockedSlot, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import React, { useState, useEffect, useMemo } from 'react';

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
  onRegenerate?: () => void;
  initialClassId?: string;
  language: Language;
}

const formatTime = (timeStr: string, minutesToAdd: number) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, subjects, textbooks, lockedSlots, profile, onGenerateRoadmap, onUpdateSlot, onMoveSlot, onFillSlots, onNavigate, onJump, onRegenerate, initialClassId, language }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [draggedItem, setDraggedItem] = useState<{ day: number, period: number } | null>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ day: number, period: number } | null>(null);
  const [errorToast, setErrorToast] = useState<{ msg: string, id: number } | null>(null);

  const t = (key: string) => TRANSLATIONS[language][key] || key;

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

  const days = language === 'ko' ? ['월', '화', '수', '목', '금'] : ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours?.totalPeriods || 8;
  const startTime = profile?.hours?.startTime || '08:30';
  const duration = profile?.hours?.periodDuration || 45;

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  const classSlots = useMemo(() => 
    (schedule?.weeklySlots || []).filter(s => s.classId === currentClass?.id),
    [schedule?.weeklySlots, currentClass?.id]
  );

  const teacherBusyMap = useMemo(() => {
    const map: Record<string, { className: string, classId: string }> = {}; 
    (schedule?.weeklySlots || []).forEach(s => {
      if (s.classId !== currentClass?.id) {
        map[`${s.teacherId}:${s.day}:${s.period}`] = { 
          className: classes.find(c => c.id === s.classId)?.name || 'Other Class',
          classId: s.classId
        };
      }
    });
    return map;
  }, [schedule, currentClass, classes]);

  const getSubjectName = (id: string) => subjects?.find(s => s.id === id)?.name || 'Unknown';

  const showClashError = (msg: string) => {
    setErrorToast({ msg, id: Date.now() });
    setTimeout(() => setErrorToast(null), 3500);
  };

  const handleDragStart = (day: number, period: number) => setDraggedItem({ day, period });

  const checkClash = (day: number, period: number, tId: string | null) => {
    if (!tId) return null;
    
    // 1. Locked Slots (School-wide or Class-specific)
    const lock = (lockedSlots || []).find(f => 
      f.dayOfWeek === day && f.period === period && (f.isSchoolWide || (f.classIds && f.classIds.includes(currentClass.id)))
    );
    if (lock) return `Locked Slot: ${lock.name}`;

    // 2. Teacher Conflict (Busy in another class)
    const busyInfo = teacherBusyMap[`${tId}:${day}:${period}`];
    if (busyInfo) return `Teacher busy in ${busyInfo.className}`;

    // 3. Subject Distribution Audit (Pedagogical limits)
    const slotToMove = classSlots.find(s => s.day === draggedItem?.day && s.period === draggedItem?.period);
    if (slotToMove) {
      const existingInDay = classSlots.find(s => s.day === day && s.subjectId === slotToMove.subjectId && s.period !== period);
      if (existingInDay) {
        const sub = subjects.find(s => s.id === slotToMove.subjectId);
        if ((sub?.frequencyPerWeek || 0) <= 5) return `Pedagogical Conflict: ${sub?.name} exists today`;
      }
    }

    return null;
  };

  const handleDragOver = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    setDropTarget({ day, period });
  };

  const handleDrop = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    if (draggedItem) {
      const draggedSlot = classSlots.find(s => s.day === draggedItem.day && s.period === draggedItem.period);
      const tId = draggedSlot?.teacherId || null;
      const clashMsg = checkClash(day, period, tId);
      
      if (clashMsg) {
        showClashError(clashMsg);
      } else if (onMoveSlot) {
        onMoveSlot(draggedItem, { day, period }, currentClass.id, isAltPressed);
      }
    }
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleExportPDF = () => {
    const originalTitle = document.title;
    document.title = `Class_Schedule_${currentClass.name}_${new Date().toLocaleDateString()}`;
    window.print();
    document.title = originalTitle;
  };

  const draggedSlotData = draggedItem ? classSlots.find(s => s.day === draggedItem.day && s.period === draggedItem.period) : null;
  const draggingTeacherId = draggedSlotData?.teacherId || null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-full pb-32 relative" id="homeroom-schedule">
      {/* Real-time Detailed Conflict Alert */}
      {errorToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-4 bg-[#0f172a] text-white px-8 py-4 rounded-[1.8rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-rose-500/50 animate-bounce-short">
          <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Logic Violation</span>
            <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">{errorToast.msg}</span>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{t('homeroom_portal')}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">{t('institution_grid')} • {currentClass.name}</span>
            <div className="px-3 py-1 bg-indigo-50 text-indigo-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm group relative cursor-help">
               Real-time Conflict Checking Active
               <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-slate-900 text-white rounded-2xl text-[9px] font-bold uppercase tracking-widest leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
                 The Guardian engine monitors every move. Try dragging a slot onto a lunch break to see it in action.
               </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportPDF}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t('export_pdf')}
          </button>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
            {classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Demo Tip Card */}
      <div className="bg-white border-[3px] border-indigo-500 rounded-[2.5rem] p-6 no-print flex flex-col md:flex-row items-center gap-6 shadow-xl">
         <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0m-6 3V11m0 5.5v-1a1.5 1.5 0 013 0v1" /></svg>
         </div>
         <div className="flex-1">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">Interactive Learning</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Try dragging any slot below to a new period. Hold <span className="text-indigo-600">ALT/Option</span> while dragging to CLONE instead of MOVE.</p>
         </div>
      </div>

      <div className="bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th className="border-r-[3px] border-slate-900 p-6 text-[10px] font-black uppercase w-44">{t('period')}</th>
              {days.map(d => <th key={d} className="border-r-[3px] last:border-r-0 border-slate-900 p-6 text-[10px] font-black uppercase tracking-widest">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalPeriods }).map((_, pIdx) => {
              const pStart = formatTime(startTime, pIdx * duration);
              const pEnd = formatTime(startTime, (pIdx + 1) * duration);
              return (
                <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                  <td className="border-r-[3px] border-slate-900 p-6 text-center font-black text-slate-900 bg-slate-50/50 h-[120px]">
                    <div className="text-3xl tracking-tighter leading-none mb-1">{pIdx + 1}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{pStart} — {pEnd}</div>
                  </td>
                  {Array.from({ length: 5 }).map((_, dIdx) => {
                    const lock = (lockedSlots || []).find(f => f.dayOfWeek === dIdx && f.period === pIdx && (f.isSchoolWide || f.classIds.includes(currentClass.id)));
                    const slot = classSlots.find(s => s.day === dIdx && s.period === pIdx);
                    const teacher = teachers.find(t => t.id === slot?.teacherId);
                    
                    const isTarget = dropTarget?.day === dIdx && dropTarget?.period === pIdx;
                    const isDraggingOrig = draggedItem?.day === dIdx && draggedItem?.period === pIdx;
                    
                    const clashMsg = draggedItem ? checkClash(dIdx, pIdx, draggingTeacherId) : null;
                    const isSafeSlot = draggingTeacherId && !clashMsg && !lock && !slot;

                    if (lock) return (
                      <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[120px] align-middle relative overflow-hidden bg-slate-950">
                        <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                          <span className="text-[10px] font-black uppercase tracking-tight text-white leading-none">{lock.name}</span>
                          <span className="text-[7px] font-black text-slate-500 uppercase mt-1 tracking-widest">Locked Slot</span>
                        </div>
                      </td>
                    );

                    return (
                      <td key={dIdx} 
                        onDragOver={(e) => handleDragOver(e, dIdx, pIdx)} 
                        onDrop={(e) => handleDrop(e, dIdx, pIdx)}
                        className={`border-r-[3px] last:border-r-0 border-slate-900 p-0 h-[120px] transition-all relative align-top ${
                          isTarget && clashMsg ? 'bg-rose-50 ring-4 ring-rose-500 ring-inset z-50' : 
                          isTarget && !clashMsg ? 'bg-indigo-50 ring-4 ring-indigo-500 ring-inset z-50' : 
                          isSafeSlot ? 'bg-emerald-50/30 ring-2 ring-emerald-200 ring-inset' : 
                          'bg-white group hover:bg-slate-50'
                        }`}>
                        {slot ? (
                          <div className={`h-full flex flex-col relative transition-all cursor-grab active:cursor-grabbing ${isDraggingOrig ? 'opacity-20 scale-95 blur-[1px]' : ''} ${isTarget && !clashMsg ? 'scale-90 rotate-1' : ''}`} draggable="true" onDragStart={() => handleDragStart(dIdx, pIdx)}>
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center overflow-hidden pointer-events-none">
                              <span className={`text-[13px] font-black uppercase leading-[1.1] line-clamp-2 tracking-tighter text-slate-900`}>{getSubjectName(slot.subjectId)}</span>
                              {isTarget && !clashMsg && <span className="text-[8px] font-black text-indigo-600 uppercase mt-1">Ready to Swap</span>}
                            </div>
                            <div className="h-8 flex items-center justify-center border-t-[3px] border-slate-900 shrink-0 pointer-events-auto" style={{ backgroundColor: teacher?.color || '#cbd5e1' }}>
                              <span className="text-[9px] font-black uppercase text-slate-900 truncate px-4 tracking-tighter">{teacher?.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className={`h-full flex items-center justify-center relative ${isSafeSlot ? 'bg-emerald-50/10' : 'bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,#000_6px,#000_7px)] opacity-[0.02]'}`}>
                             {isTarget && clashMsg && (
                               <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500/20 p-2 text-center backdrop-blur-[2px]">
                                  <svg className="w-5 h-5 text-rose-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                  <span className="text-[8px] font-black text-rose-800 uppercase tracking-tighter leading-none px-2">{clashMsg}</span>
                               </div>
                             )}
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

export default ScheduleViewer;
