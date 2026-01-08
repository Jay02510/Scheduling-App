
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
  
  // Interactions
  const [draggedLock, setDraggedLock] = useState<{ day: number, period: number } | null>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ day: number, period: number } | null>(null);
  
  // Fill interaction
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
  const getTeacherName = (id: string) => teachers?.find(t => t.id === id)?.name || 'Unknown Faculty';
  const getClassColor = (id: string) => classes?.find(c => c.id === id)?.color || '#cbd5e1';
  const getClassName = (id: string) => classes?.find(c => c.id === id)?.name || 'Unknown Group';

  const handleAddNewTeacher = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTeachers([...teachers, { id: newId, name: 'New Faculty Member', role: 'subject', subjects: [], maxDailyPeriods: profile?.hours.totalPeriods || 8, breaksNeededPerWeek: 5, color: TEACHER_COLORS[teachers.length % TEACHER_COLORS.length], assignedClasses: [], employmentType: 'Full-Time' }]);
    setDetailView({ type: 'teacher', id: newId });
  };

  const handleAddNewClass = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setClasses([...classes, { id: newId, name: `Class ${classes.length + 1}`, grade: 'G1', homeroomTeacherId: '', assignments: [], color: CLASS_COLORS[classes.length % CLASS_COLORS.length] }]);
    setDetailView({ type: 'class', id: newId });
  };

  const handleAddNewSubject = () => {
    const newId = `sub-${Math.random().toString(36).substr(2, 5)}`;
    setSubjects([...subjects, { id: newId, name: 'New Lesson Block', frequencyPerWeek: 5, gradeLevels: ['G1'] }]);
  };

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
  const onLockDragOver = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    setDropTarget({ day, period });
  };
  const onLockDrop = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    if (draggedLock && onMoveLock) onMoveLock(draggedLock, { day, period }, isAltPressed);
    setDraggedLock(null);
    setDropTarget(null);
  };

  const onFillStart = (e: React.MouseEvent, day: number, period: number) => {
    e.stopPropagation(); e.preventDefault();
    setFillSource({ day, period });
    setFillTarget({ day, period });
  };
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

  if (detailView?.type === 'class') {
    const cls = classes.find(c => c.id === detailView.id);
    if (!cls) return null;
    return (
      <div className="space-y-8 animate-fadeIn">
        <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>Back to Setup</button>
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl max-w-2xl mx-auto space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none" style={{ backgroundColor: cls.color, filter: 'blur(60px)', borderRadius: '100%' }}></div>
          <div><span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Class Configuration</span><input className="text-4xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} /></div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-3">Lessons & Teachers</h4>
            <div className="space-y-3">{(cls.assignments || []).map(a => (<div key={a.subjectId} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all"><span className="text-xs font-black uppercase text-slate-700">{getSubjectName(a.subjectId)}</span><span className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-lg">{getTeacherName(a.teacherId)}</span></div>))}</div>
          </div>
        </div>
      </div>
    );
  }

  if (detailView?.type === 'lock') {
    const lock = lockedSlots.find(l => l.id === detailView.id);
    if (!lock) return null;
    return (
      <div className="space-y-8 animate-fadeIn">
        <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>Back to Grid</button>
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl max-w-2xl mx-auto space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-slate-900 opacity-[0.03] rounded-full -mr-20 -mt-20"></div>
          <div><span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Immovable Engagement Name</span><input className="text-5xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase tracking-tighter" value={lock.name} onChange={e => updateLock(lock.id, { name: e.target.value })} autoFocus /></div>
          <div className="space-y-4"><label className="flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] cursor-pointer group transition-all hover:scale-[1.01] shadow-xl"><span className="text-xs font-black uppercase tracking-widest text-white">Institution-Wide?</span><input type="checkbox" checked={lock.isSchoolWide} onChange={e => updateLock(lock.id, { isSchoolWide: e.target.checked })} className="w-6 h-6 rounded-lg border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500" /></label>
             {!lock.isSchoolWide && (<div className="space-y-5 pt-8 animate-fadeIn"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Assigned Class Groups</span><div className="grid grid-cols-2 gap-3">{classes.map(c => (<label key={c.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${lock.classIds.includes(c.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}><input type="checkbox" checked={lock.classIds.includes(c.id)} onChange={e => { const newIds = e.target.checked ? [...lock.classIds, c.id] : lock.classIds.filter(id => id !== c.id); updateLock(lock.id, { classIds: newIds }); }} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" /><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c.color }}></div><span className="text-[11px] font-black uppercase text-slate-900 tracking-tight">{c.name}</span></div></label>))}</div></div>)}
          </div>
          <div className="flex gap-4 pt-6"><button onClick={() => { setLockedSlots(lockedSlots.filter(l => l.id !== lock.id)); setDetailView(null); }} className="flex-1 py-5 text-rose-500 font-black text-[10px] uppercase tracking-widest bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors">Discard Block</button><button onClick={() => setDetailView(null)} className="flex-[2] py-5 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-black transition-all hover:scale-[1.02]">Confirm Engagement</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fadeIn pb-24" onMouseUp={onFillEnd}>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm gap-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 gradient-primary"></div>
        <div className="relative z-10"><h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Institution Setup</h2><p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.4em] mt-3">Architect the School Lifecycle</p></div>
        <button onClick={onGenerate} className="gradient-primary text-white px-14 py-7 rounded-[2.5rem] shadow-2xl font-black text-[13px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all group">Generate Schedule<svg className="w-4 h-4 inline-block ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></button>
      </div>
      <div className="flex bg-slate-200/50 p-2 rounded-[2.8rem] w-fit shadow-inner mx-auto md:mx-0 overflow-x-auto max-w-full">
        {[{ id: 'classes', label: 'Classes' }, { id: 'staff', label: 'Faculty' }, { id: 'subjects', label: 'Subjects' }, { id: 'global', label: 'Master Engagements' }, { id: 'rhythm', label: 'Daily Rhythm' }].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'}`}>{t.label}</button>))}
      </div>
      <div className="bg-white p-4 md:p-12 rounded-[4.5rem] shadow-2xl border border-slate-50 min-h-[600px] relative">
        {activeTab === 'global' && (
          <div className="space-y-12 animate-fadeIn p-4">
            <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 gradient-primary opacity-10 blur-[80px] -mr-20 -mt-20"></div>
              <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] leading-relaxed relative z-10">Institutional Engagements Architecture</p>
              <p className="text-slate-400 text-[10px] font-medium mt-2 max-w-2xl relative z-10">Drag to Swap • Alt+Drag to Clone • Blue handle to fill.</p>
            </div>
            <div className="overflow-x-auto bg-slate-50/50 p-8 rounded-[4rem] border border-slate-100 shadow-inner">
              <table className="w-full table-fixed min-w-[900px] border-separate border-spacing-3">
                <thead><tr><th className="w-20"></th>{['MON','TUE','WED','THU','FRI'].map(d => (<th key={d} className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{d}</th>))}</tr></thead>
                <tbody>{Array.from({length: profile?.hours.totalPeriods || 8}).map((_, pIdx) => (
                  <tr key={pIdx}>
                    <td className="text-[12px] font-black text-slate-300 text-center uppercase h-[140px] pr-4">P{pIdx+1}</td>
                    {Array.from({length: 5}).map((_, dIdx) => {
                      const lock = lockedSlots.find(l => l.dayOfWeek === dIdx && l.period === pIdx);
                      const isTarget = dropTarget?.day === dIdx && dropTarget?.period === pIdx;
                      const isDragging = draggedLock?.day === dIdx && draggedLock?.period === pIdx;
                      const isInFillRange = fillSource && fillTarget && ((dIdx === fillSource.day && pIdx >= Math.min(fillSource.period, fillTarget.period) && pIdx <= Math.max(fillSource.period, fillTarget.period)) || (pIdx === fillSource.period && dIdx >= Math.min(fillSource.day, fillTarget.day) && dIdx <= Math.max(fillSource.day, fillTarget.day)));
                      return (
                        <td key={dIdx} onMouseEnter={() => onFillMove(dIdx, pIdx)} className={`h-[140px] transition-all relative ${isTarget ? 'scale-105 z-20' : ''}`}>
                          <button onClick={() => openLockConfig(dIdx, pIdx)} draggable={!!lock} onDragStart={() => onLockDragStart(dIdx, pIdx)} onDragOver={(e) => onLockDragOver(e, dIdx, pIdx)} onDrop={(e) => onLockDrop(e, dIdx, pIdx)} className={`group w-full h-full rounded-[2.5rem] border-[4px] flex flex-col items-center justify-center p-6 transition-all relative overflow-hidden ${lock ? `bg-white border-slate-900 shadow-2xl z-10 ${isDragging ? 'opacity-30 scale-95' : isAltPressed ? 'cursor-copy' : 'cursor-grab active:cursor-grabbing hover:scale-[1.03]'}` : `bg-white border-slate-100 text-slate-300 ${isTarget || isInFillRange ? 'border-indigo-500 ring-4 ring-indigo-100' : 'hover:border-indigo-200 hover:shadow-xl hover:scale-[1.02]'}`}`}>
                            {lock ? (<><div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-20"></div><span className="text-[15px] font-black uppercase text-center tracking-tighter leading-none text-slate-900 group-hover:scale-110 transition-transform pointer-events-none">{lock.name}</span>
                              {lock.isSchoolWide ? (<div className="mt-4 px-3 py-1 bg-slate-900 rounded-full pointer-events-none"><span className="text-[8px] font-black text-white uppercase tracking-widest">Global Hold</span></div>) : (<div className="flex flex-wrap justify-center gap-1.5 mt-5 pointer-events-none">{lock.classIds?.map(cid => (<div key={cid} className="px-2 py-1 rounded-full text-[7px] font-black text-white uppercase shadow-sm" style={{ backgroundColor: getClassColor(cid) }}>{getClassName(cid)}</div>))}{(!lock.classIds || lock.classIds.length === 0) && (<span className="text-[8px] font-black text-rose-400 uppercase tracking-widest animate-pulse">Assign Group</span>)}</div>)}
                              <div onMouseDown={(e) => onFillStart(e, dIdx, pIdx)} className="absolute bottom-2 right-2 w-4 h-4 bg-indigo-600 rounded-lg border-2 border-white cursor-crosshair z-30 opacity-0 group-hover:opacity-100 transition-opacity"></div></>) : 
                              (<div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none"><div className="w-8 h-8 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all"><svg className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg></div><span className="text-[9px] font-black uppercase tracking-[0.2em]">Add Block</span></div>)}
                            {isInFillRange && <div className="absolute inset-0 border-4 border-dashed border-indigo-500 animate-pulse-soft pointer-events-none"></div>}
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
        {/* Render other tabs... */}
      </div>
    </div>
  );
};

export default ScheduleForm;
