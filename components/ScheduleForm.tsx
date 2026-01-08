
import React, { useState, useEffect } from 'react';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolProfile, SubjectConfig, SchoolSchedule } from '../types';
import { TEACHER_COLORS, CLASS_COLORS } from '../constants';

interface ScheduleFormProps {
  onGenerate: () => void;
  profile: SchoolProfile | null;
  setProfile: (profile: SchoolProfile) => void;
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
  classes: ClassGroup[];
  setClasses: (classes: ClassGroup[]) => void;
  textbooks: Textbook[];
  setTextbooks: (books: Textbook[]) => void;
  lockedSlots: LockedSlot[];
  setLockedSlots: (slots: LockedSlot[]) => void;
  subjects: SubjectConfig[];
  setSubjects: (subjects: SubjectConfig[]) => void;
  schedule: SchoolSchedule | null;
  onMoveLock?: (source: { day: number, period: number }, target: { day: number, period: number }, isCopy: boolean) => void;
  onFillLocks?: (source: { day: number, period: number }, range: { startDay: number, endDay: number, startPeriod: number, endPeriod: number }) => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  onGenerate, profile, setProfile, teachers, setTeachers, classes, setClasses, textbooks, subjects, setSubjects, lockedSlots, setLockedSlots, schedule, onMoveLock, onFillLocks 
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'staff' | 'subjects' | 'global' | 'rhythm'>('classes');
  const [detailView, setDetailView] = useState<{ type: 'teacher' | 'class' | 'lock', id: string } | null>(null);
  const [draggedLock, setDraggedLock] = useState<{ day: number, period: number } | null>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ day: number, period: number } | null>(null);
  const [fillSource, setFillSource] = useState<{ day: number, period: number } | null>(null);
  const [fillTarget, setFillTarget] = useState<{ day: number, period: number } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => setIsAltPressed(e.altKey);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, []);

  const getSubjectName = (id: string) => subjects?.find(s => s.id === id)?.name || 'Unknown Subject';
  const getClassColor = (id: string) => classes?.find(c => c.id === id)?.color || '#cbd5e1';
  const getClassName = (id: string) => classes?.find(c => c.id === id)?.name || 'Unknown Group';

  const openLockConfig = (day: number, period: number) => {
    const lockAtSlot = lockedSlots.find(l => l.dayOfWeek === day && l.period === period);
    if (lockAtSlot) setDetailView({ type: 'lock', id: lockAtSlot.id });
    else {
      const newId = Math.random().toString(36).substr(2, 9);
      setLockedSlots([...lockedSlots, { id: newId, name: 'GYM', dayOfWeek: day, period: period, classIds: [], isSchoolWide: false }]);
      setDetailView({ type: 'lock', id: newId });
    }
  };

  const updateLock = (id: string, updates: Partial<LockedSlot>) => {
    setLockedSlots(lockedSlots.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const onLockDragStart = (day: number, period: number) => setDraggedLock({ day, period });
  const onLockDragOver = (e: React.DragEvent, day: number, period: number) => { e.preventDefault(); setDropTarget({ day, period }); };
  const onLockDrop = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    if (draggedLock && onMoveLock) onMoveLock(draggedLock, { day, period }, isAltPressed);
    setDraggedLock(null); setDropTarget(null);
  };

  const onFillStart = (e: React.MouseEvent, day: number, period: number) => { e.stopPropagation(); e.preventDefault(); setFillSource({ day, period }); setFillTarget({ day, period }); };
  const onFillMove = (day: number, period: number) => { if (fillSource) setFillTarget({ day, period }); };
  const onFillEnd = () => {
    if (fillSource && fillTarget && onFillLocks) {
      const diffDay = Math.abs(fillTarget.day - fillSource.day);
      const diffPeriod = Math.abs(fillTarget.period - fillSource.period);
      let range;
      if (diffDay >= diffPeriod) range = { startDay: Math.min(fillSource.day, fillTarget.day), endDay: Math.max(fillSource.day, fillTarget.day), startPeriod: fillSource.period, endPeriod: fillSource.period };
      else range = { startDay: fillSource.day, endDay: fillSource.day, startPeriod: Math.min(fillSource.period, fillTarget.period), endPeriod: Math.max(fillSource.period, fillTarget.period) };
      onFillLocks(fillSource, range);
    }
    setFillSource(null); setFillTarget(null);
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24" onMouseUp={onFillEnd}>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 gradient-primary"></div>
        <div className="relative z-10"><h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Institution Setup</h2><p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Architect the Lifecycle</p></div>
        <button onClick={onGenerate} className="gradient-primary text-white px-10 py-5 rounded-[2rem] shadow-xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all group">Generate Schedule</button>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-[1.8rem] w-fit shadow-inner mx-auto md:mx-0 overflow-x-auto max-w-full">
        {[{ id: 'classes', label: 'Classes' }, { id: 'staff', label: 'Faculty' }, { id: 'subjects', label: 'Subjects' }, { id: 'global', label: 'Master Engagements' }, { id: 'rhythm', label: 'Daily Rhythm' }].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-8 py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'}`}>{t.label}</button>))}
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border border-slate-50 min-h-[550px] relative">
        {activeTab === 'global' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-[#0f172a] p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 gradient-primary opacity-10 blur-[60px] -mr-10 -mt-10"></div>
              <p className="text-[11px] font-black text-white uppercase tracking-[0.3em] leading-relaxed relative z-10">Institutional Engagements Architecture</p>
              <p className="text-slate-400 text-[9px] font-medium mt-1.5 max-w-2xl relative z-10">Drag to Swap • Alt+Drag to Clone • Replicate with Handle.</p>
            </div>
            <div className="overflow-x-auto bg-slate-50/50 p-6 rounded-[3rem] border border-slate-100 shadow-inner">
              <table className="w-full table-fixed min-w-[900px] border-separate border-spacing-2">
                <thead><tr><th className="w-16"></th>{['MON','TUE','WED','THU','FRI'].map(d => (<th key={d} className="p-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{d}</th>))}</tr></thead>
                <tbody>{Array.from({length: profile?.hours.totalPeriods || 8}).map((_, pIdx) => (
                  <tr key={pIdx}>
                    <td className="text-[11px] font-black text-slate-300 text-center uppercase h-[110px]">P{pIdx+1}</td>
                    {Array.from({length: 5}).map((_, dIdx) => {
                      const lock = lockedSlots.find(l => l.dayOfWeek === dIdx && l.period === pIdx);
                      const isTarget = dropTarget?.day === dIdx && dropTarget?.period === pIdx;
                      const isDragging = draggedLock?.day === dIdx && draggedLock?.period === pIdx;
                      const isInFillRange = fillSource && fillTarget && ((dIdx === fillSource.day && pIdx >= Math.min(fillSource.period, fillTarget.period) && pIdx <= Math.max(fillSource.period, fillTarget.period)) || (pIdx === fillSource.period && dIdx >= Math.min(fillSource.day, fillTarget.day) && dIdx <= Math.max(fillSource.day, fillTarget.day)));
                      return (
                        <td key={dIdx} onMouseEnter={() => onFillMove(dIdx, pIdx)} className={`h-[110px] transition-all relative ${isTarget ? 'scale-105 z-20' : ''}`}>
                          <button onClick={() => openLockConfig(dIdx, pIdx)} draggable={!!lock} onDragStart={() => onLockDragStart(dIdx, pIdx)} onDragOver={(e) => onLockDragOver(e, dIdx, pIdx)} onDrop={(e) => onLockDrop(e, dIdx, pIdx)} className={`group w-full h-full rounded-[1.8rem] border-[2px] flex flex-col items-center justify-center p-4 transition-all relative overflow-hidden ${lock ? `bg-white border-slate-900 shadow-lg z-10 ${isDragging ? 'opacity-30' : isAltPressed ? 'cursor-copy' : 'cursor-grab active:cursor-grabbing hover:scale-[1.02]'}` : `bg-white border-slate-100 text-slate-300 ${isTarget || isInFillRange ? 'border-indigo-500 ring-4 ring-indigo-50' : 'hover:border-indigo-100 hover:shadow-md hover:scale-[1.01]'}`}`}>
                            {lock ? (<><div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-20"></div><span className="text-[13px] font-black uppercase text-center tracking-tighter leading-none text-slate-900 group-hover:scale-105 transition-transform pointer-events-none">{lock.name}</span>
                              {lock.isSchoolWide ? (<div className="mt-2 px-2.5 py-0.5 bg-slate-900 rounded-lg pointer-events-none"><span className="text-[7px] font-black text-white uppercase tracking-widest">Global</span></div>) : (<div className="flex flex-wrap justify-center gap-1 mt-3 pointer-events-none">{lock.classIds?.map(cid => (<div key={cid} className="px-1.5 py-0.5 rounded-md text-[6px] font-black text-white uppercase shadow-sm" style={{ backgroundColor: getClassColor(cid) }}>{getClassName(cid)}</div>))}</div>)}
                              <div onMouseDown={(e) => onFillStart(e, dIdx, pIdx)} className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-indigo-600 rounded-md border border-white cursor-crosshair z-30 opacity-0 group-hover:opacity-100 transition-opacity"></div></>) : 
                              (<div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity pointer-events-none"><div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 transition-all"><svg className="w-2.5 h-2.5 text-slate-300 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg></div><span className="text-[7px] font-black uppercase tracking-widest">Add</span></div>)}
                            {isInFillRange && <div className="absolute inset-0 border-2 border-dashed border-indigo-500 animate-pulse-soft pointer-events-none"></div>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;
