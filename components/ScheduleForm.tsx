
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
  onNavigate?: (tab: string) => void; // Added for jumping to schedule
}

const ScheduleForm: React.FC<ScheduleFormProps & { onNavigate?: (tab: string) => void }> = ({ 
  onGenerate, profile, setProfile, teachers, setTeachers, classes, setClasses, textbooks, subjects, setSubjects, lockedSlots, setLockedSlots, schedule, onMoveLock, onFillLocks, onNavigate 
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'staff' | 'subjects' | 'global' | 'rhythm'>('classes');
  const [detailView, setDetailView] = useState<{ type: 'teacher' | 'class' | 'lock', id: string } | null>(null);
  
  // Drag/Copy states
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
  const getTeacherName = (id: string) => teachers?.find(t => t.id === id)?.name || 'Unassigned';
  const getClassColor = (id: string) => classes?.find(c => c.id === id)?.color || '#cbd5e1';
  const getClassName = (id: string) => classes?.find(c => c.id === id)?.name || 'Unknown Group';

  const handleAddNewTeacher = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTeachers([...teachers, { id: newId, name: 'New Faculty', role: 'subject', subjects: [], maxDailyPeriods: profile?.hours.totalPeriods || 8, breaksNeededPerWeek: 5, color: TEACHER_COLORS[teachers.length % TEACHER_COLORS.length], assignedClasses: [], employmentType: 'Full-Time' }]);
    setDetailView({ type: 'teacher', id: newId });
  };

  const handleAddNewClass = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setClasses([...classes, { id: newId, name: `Group ${classes.length + 1}`, grade: 'G1', homeroomTeacherId: '', assignments: [], color: CLASS_COLORS[classes.length % CLASS_COLORS.length] }]);
    setDetailView({ type: 'class', id: newId });
  };

  const handleAddNewSubject = () => {
    const newId = `sub-${Math.random().toString(36).substr(2, 5)}`;
    setSubjects([...subjects, { id: newId, name: 'New Lesson', frequencyPerWeek: 5, gradeLevels: ['G1'] }]);
  };

  const openLockConfig = (day: number, period: number) => {
    const lockAtSlot = lockedSlots.find(l => l.dayOfWeek === day && l.period === period);
    if (lockAtSlot) setDetailView({ type: 'lock', id: lockAtSlot.id });
    else {
      const newId = Math.random().toString(36).substr(2, 9);
      setLockedSlots([...lockedSlots, { id: newId, name: 'NEW BLOCK', dayOfWeek: day, period: period, classIds: [], isSchoolWide: true }]);
      setDetailView({ type: 'lock', id: newId });
    }
  };

  const updateLock = (id: string, updates: Partial<LockedSlot>) => {
    setLockedSlots(lockedSlots.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  // Interaction handlers...
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

  if (detailView) {
    const item = detailView.type === 'class' ? classes.find(c => c.id === detailView.id) : detailView.type === 'teacher' ? teachers.find(t => t.id === detailView.id) : lockedSlots.find(l => l.id === detailView.id);
    if (!item) return null;
    return (
      <div className="space-y-6 animate-fadeIn">
        <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">← Back to Registry</button>
        <div className="bg-white p-10 rounded-[3rem] border shadow-2xl max-w-2xl mx-auto space-y-8">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">{detailView.type.toUpperCase()} NAME</span>
            <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase" value={item.name} 
              onChange={e => {
                const val = e.target.value;
                if (detailView.type === 'class') setClasses(classes.map(c => c.id === item.id ? {...c, name: val} : c));
                else if (detailView.type === 'teacher') setTeachers(teachers.map(t => t.id === item.id ? {...t, name: val} : t));
                else if (detailView.type === 'lock') updateLock(item.id, { name: val });
              }} />
          </div>
          <button onClick={() => {
            if (detailView.type === 'class') setClasses(classes.filter(c => c.id !== item.id));
            else if (detailView.type === 'teacher') setTeachers(teachers.filter(t => t.id !== item.id));
            else if (detailView.type === 'lock') setLockedSlots(lockedSlots.filter(l => l.id !== item.id));
            setDetailView(null);
          }} className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase">Remove Item</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-16" onMouseUp={onFillEnd}>
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border shadow-sm gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 gradient-primary"></div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Setup Center</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Institutional Configuration</p>
        </div>
        <div className="flex gap-3">
          {schedule && (
            <button onClick={() => onNavigate?.('homerooms')} className="bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">View Portal</button>
          )}
          <button onClick={onGenerate} className="gradient-primary text-white px-8 py-4 rounded-[1.5rem] shadow-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Sync Schedule</button>
        </div>
      </header>

      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit shadow-inner mx-auto md:mx-0 overflow-x-auto max-w-full gap-1">
        {['classes', 'staff', 'subjects', 'global', 'rhythm'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-3 rounded-[1.1rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-50 min-h-[500px]">
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {classes.map(c => (
              <div key={c.id} onClick={() => setDetailView({ type: 'class', id: c.id })} className="p-8 bg-slate-50 rounded-[2rem] cursor-pointer hover:shadow-xl transition-all border-l-[10px]" style={{ borderLeftColor: c.color }}>
                <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">{c.name}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{c.grade}</p>
              </div>
            ))}
            <button onClick={handleAddNewClass} className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-400 transition-all">+ Register Group</button>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            {teachers.map(t => (
              <div key={t.id} onClick={() => setDetailView({ type: 'teacher', id: t.id })} className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center text-center cursor-pointer hover:shadow-xl transition-all group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-black mb-4 group-hover:scale-110 transition-transform shadow-md" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight truncate w-full">{t.name}</h4>
                <p className="text-[8px] font-black text-indigo-500 uppercase mt-1">{t.role}</p>
              </div>
            ))}
            <button onClick={handleAddNewTeacher} className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 transition-all">+ Add Faculty</button>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {subjects.map(s => (
              <div key={s.id} className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
                <input className="bg-white border rounded-xl px-4 py-2 w-full font-black text-slate-900 uppercase text-xs" value={s.name} onChange={e => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, name: e.target.value} : sub))} />
                <div className="grid grid-cols-2 gap-2">
                  {classes.map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-xl border flex flex-col gap-1">
                      <span className="text-[7px] font-black text-slate-400 uppercase">{c.name}</span>
                      <select className="bg-transparent text-[9px] font-bold text-slate-800" value={c.assignments.find(a => a.subjectId === s.id)?.teacherId || ''} onChange={e => {
                        setClasses(classes.map(cl => cl.id === c.id ? {...cl, assignments: [...cl.assignments.filter(a => a.subjectId !== s.id), { subjectId: s.id, teacherId: e.target.value }]} : cl));
                      }}>
                        <option value="">Unassigned</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={handleAddNewSubject} className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 transition-all">+ New Lesson Block</button>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0f172a] p-6 rounded-[2rem] text-white flex justify-between items-center">
              <div><p className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional engagements</p></div>
              <div className="flex gap-4"><span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Swap/Clone/Fill Active</span></div>
            </div>
            <div className="overflow-x-auto bg-slate-50/50 p-4 rounded-[2.5rem] border shadow-inner">
              <table className="w-full table-fixed min-w-[800px] border-separate border-spacing-2">
                <thead><tr><th className="w-16"></th>{['MON','TUE','WED','THU','FRI'].map(d => <th key={d} className="p-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">{d}</th>)}</tr></thead>
                <tbody>{Array.from({length: profile?.hours.totalPeriods || 8}).map((_, pIdx) => (
                  <tr key={pIdx}>
                    <td className="text-[10px] font-black text-slate-300 text-center uppercase h-[110px]">P{pIdx+1}</td>
                    {Array.from({length: 5}).map((_, dIdx) => {
                      const lock = lockedSlots.find(l => l.dayOfWeek === dIdx && l.period === pIdx);
                      const isInFillRange = fillSource && fillTarget && ((dIdx === fillSource.day && pIdx >= Math.min(fillSource.period, fillTarget.period) && pIdx <= Math.max(fillSource.period, fillTarget.period)) || (pIdx === fillSource.period && dIdx >= Math.min(fillSource.day, fillTarget.day) && dIdx <= Math.max(fillSource.day, fillTarget.day)));
                      return (
                        <td key={dIdx} onMouseEnter={() => onFillMove(dIdx, pIdx)} className="h-[110px] relative transition-all">
                          <button onClick={() => openLockConfig(dIdx, pIdx)} draggable={!!lock} onDragStart={() => onLockDragStart(dIdx, pIdx)} onDragOver={(e) => onLockDragOver(e, dIdx, pIdx)} onDrop={(e) => onLockDrop(e, dIdx, pIdx)} className={`group w-full h-full rounded-[1.8rem] border-[2px] flex flex-col items-center justify-center p-3 transition-all relative overflow-hidden ${lock ? 'bg-white border-slate-900 shadow-md' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                            {lock ? (<><span className="text-[11px] font-black text-slate-900 uppercase text-center leading-tight truncate px-1">{lock.name}</span><div onMouseDown={(e) => onFillStart(e, dIdx, pIdx)} className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-md border border-white cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity"></div></>) : <div className="text-slate-200 text-lg font-black">+</div>}
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

        {activeTab === 'rhythm' && profile && (
          <div className="max-w-md mx-auto space-y-8 animate-fadeIn py-10">
            <div className="bg-slate-50 p-6 rounded-[2rem] flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">School Start</span><input type="time" className="bg-white border rounded-xl px-4 py-2 font-black text-indigo-600" value={profile.hours.startTime} onChange={e => setProfile({...profile, hours: {...profile.hours, startTime: e.target.value}})} /></div>
            <div className="bg-slate-50 p-6 rounded-[2rem] flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span><input type="number" className="w-20 bg-white border rounded-xl px-4 py-2 font-black text-indigo-600 text-center" value={profile.hours.periodDuration} onChange={e => setProfile({...profile, hours: {...profile.hours, periodDuration: parseInt(e.target.value) || 45}})} /></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;
