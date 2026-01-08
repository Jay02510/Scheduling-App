
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
  
  // Drag/Copy states
  const [draggedLock, setDraggedLock] = useState<{ day: number, period: number } | null>(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ day: number, period: number } | null>(null);
  
  // Fill states
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
    setTeachers([...teachers, { 
      id: newId, name: 'New Faculty', role: 'subject', subjects: [], 
      maxDailyPeriods: profile?.hours.totalPeriods || 8, breaksNeededPerWeek: 5, 
      color: TEACHER_COLORS[teachers.length % TEACHER_COLORS.length], 
      assignedClasses: [], employmentType: 'Full-Time' 
    }]);
    setDetailView({ type: 'teacher', id: newId });
  };

  const handleAddNewClass = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setClasses([...classes, { 
      id: newId, name: `Class ${classes.length + 1}`, grade: 'G1', 
      homeroomTeacherId: '', assignments: [], 
      color: CLASS_COLORS[classes.length % CLASS_COLORS.length] 
    }]);
    setDetailView({ type: 'class', id: newId });
  };

  const handleAddNewSubject = () => {
    const newId = `sub-${Math.random().toString(36).substr(2, 5)}`;
    setSubjects([...subjects, { id: newId, name: 'New Subject', frequencyPerWeek: 5, gradeLevels: ['G1'] }]);
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

  // Drag Handlers
  const onLockDragStart = (day: number, period: number) => setDraggedLock({ day, period });
  const onLockDragOver = (e: React.DragEvent, day: number, period: number) => { e.preventDefault(); setDropTarget({ day, period }); };
  const onLockDrop = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    if (draggedLock && onMoveLock) onMoveLock(draggedLock, { day, period }, isAltPressed);
    setDraggedLock(null); setDropTarget(null);
  };

  // Fill Handlers
  const onFillStart = (e: React.MouseEvent, day: number, period: number) => {
    e.stopPropagation(); e.preventDefault(); setFillSource({ day, period }); setFillTarget({ day, period });
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

  // Sub-views for detail editing
  if (detailView) {
    if (detailView.type === 'class') {
      const cls = classes.find(c => c.id === detailView.id);
      if (!cls) return null;
      return (
        <div className="space-y-6 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">← Back to Setup</button>
          <div className="bg-white p-10 rounded-[3rem] border shadow-2xl max-w-2xl mx-auto space-y-8">
            <div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Class Title</span>
              <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} />
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Lessons & Faculty</h4>
              <div className="space-y-2">
                {(cls.assignments || []).map(a => (
                  <div key={a.subjectId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-black uppercase text-slate-700">{getSubjectName(a.subjectId)}</span>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase px-3 py-1 bg-indigo-50 rounded-lg">{getTeacherName(a.teacherId)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (detailView.type === 'teacher') {
      const t = teachers.find(tea => tea.id === detailView.id);
      if (!t) return null;
      return (
        <div className="space-y-6 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">← Back to Setup</button>
          <div className="bg-white p-10 rounded-[3rem] border shadow-2xl max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Faculty Member</span>
                <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full" value={t.name} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, name: e.target.value} : tea))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-3xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Daily Max Periods</span>
                <input type="number" className="w-full bg-transparent border-0 font-black text-2xl text-slate-900 p-0 focus:ring-0" value={t.maxDailyPeriods} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, maxDailyPeriods: parseInt(e.target.value) || 8} : tea))} />
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Weekly Rest Needs</span>
                <input type="number" className="w-full bg-transparent border-0 font-black text-2xl text-slate-900 p-0 focus:ring-0" value={t.breaksNeededPerWeek} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, breaksNeededPerWeek: parseInt(e.target.value) || 5} : tea))} />
              </div>
            </div>
            <button onClick={() => { setTeachers(teachers.filter(tea => tea.id !== t.id)); setDetailView(null); }} className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Remove Faculty Member</button>
          </div>
        </div>
      );
    }

    if (detailView.type === 'lock') {
      const lock = lockedSlots.find(l => l.id === detailView.id);
      if (!lock) return null;
      return (
        <div className="space-y-6 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">← Back to Grid</button>
          <div className="bg-white p-10 rounded-[3rem] border shadow-2xl max-w-xl mx-auto space-y-8">
            <div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Engagement Title</span>
              <input className="text-4xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase" value={lock.name} onChange={e => updateLock(lock.id, { name: e.target.value })} />
            </div>
            <label className="flex items-center justify-between p-6 bg-slate-900 rounded-[1.5rem] cursor-pointer text-white">
              <span className="text-[10px] font-black uppercase tracking-widest">School-Wide Block</span>
              <input type="checkbox" checked={lock.isSchoolWide} onChange={e => updateLock(lock.id, { isSchoolWide: e.target.checked })} className="w-6 h-6 rounded-lg text-indigo-500" />
            </label>
            <div className="flex gap-4">
              <button onClick={() => { setLockedSlots(lockedSlots.filter(l => l.id !== lock.id)); setDetailView(null); }} className="flex-1 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase">Discard</button>
              <button onClick={() => setDetailView(null)} className="flex-[2] py-4 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase">Confirm</button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-16" onMouseUp={onFillEnd}>
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border shadow-sm gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 gradient-primary"></div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Institution Setup</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Configuring System Parameters</p>
        </div>
        <button onClick={onGenerate} className="gradient-primary text-white px-8 py-4 rounded-[1.5rem] shadow-xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Optimize Schedule</button>
      </header>

      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit shadow-inner mx-auto md:mx-0 overflow-x-auto max-w-full gap-1">
        {[
          { id: 'classes', label: 'Classes' },
          { id: 'staff', label: 'Faculty' },
          { id: 'subjects', label: 'Subjects' },
          { id: 'global', label: 'Master Engagements' },
          { id: 'rhythm', label: 'Daily Rhythm' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-6 py-3 rounded-[1.1rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'}`}>{t.label}</button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-50 min-h-[500px]">
        {activeTab === 'rhythm' && profile && (
          <div className="max-w-xl mx-auto space-y-10 animate-fadeIn">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-[2rem]">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">School Start</span>
                <input type="time" className="w-full bg-transparent border-0 font-black text-2xl text-slate-900 p-0 outline-none" value={profile.hours.startTime} onChange={e => setProfile({...profile, hours: {...profile.hours, startTime: e.target.value}})} />
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem]">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Period Duration</span>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-full bg-transparent border-0 font-black text-2xl text-indigo-600 p-0 outline-none" value={profile.hours.periodDuration} onChange={e => setProfile({...profile, hours: {...profile.hours, periodDuration: parseInt(e.target.value) || 45}})} />
                  <span className="text-[10px] font-black text-slate-400">MIN</span>
                </div>
              </div>
              <div className="col-span-2 bg-slate-900 p-6 rounded-[2rem] text-white">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">Daily Slots Count</span>
                <div className="flex gap-2">
                  {Array.from({length: 10}).map((_, i) => (
                    <button key={i} onClick={() => setProfile({...profile, hours: {...profile.hours, totalPeriods: i + 1}})} className={`flex-1 h-12 rounded-xl font-black text-sm transition-all ${profile.hours.totalPeriods === i + 1 ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{i + 1}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {classes.map(c => (
              <div key={c.id} onClick={() => setDetailView({ type: 'class', id: c.id })} className="p-8 bg-slate-50 rounded-[2rem] cursor-pointer hover:shadow-xl transition-all border-l-[10px]" style={{ borderLeftColor: c.color }}>
                <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">{c.name}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{c.grade}</p>
              </div>
            ))}
            <button onClick={handleAddNewClass} className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-400 transition-all">+ Register Group</button>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            {teachers.map(t => (
              <div key={t.id} onClick={() => setDetailView({ type: 'teacher', id: t.id })} className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center text-center cursor-pointer hover:shadow-xl transition-all group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-4 group-hover:scale-110 transition-transform shadow-md" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight truncate w-full">{t.name}</h4>
                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">{t.role}</p>
              </div>
            ))}
            <button onClick={handleAddNewTeacher} className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 transition-all">+ Add Faculty</button>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fadeIn">
            {subjects.map(s => (
              <div key={s.id} className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6">
                <div className="flex justify-between items-center gap-4">
                  <input className="bg-white border px-4 py-2 rounded-xl flex-1 font-black text-slate-900 uppercase text-xs" value={s.name} onChange={e => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, name: e.target.value} : sub))} />
                  <div className="flex items-center bg-white border rounded-xl px-3 py-1.5 gap-3">
                    <button onClick={() => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, frequencyPerWeek: Math.max(1, sub.frequencyPerWeek - 1)} : sub))} className="font-black text-slate-400 hover:text-indigo-600">-</button>
                    <span className="text-xs font-black text-indigo-600 w-4 text-center">{s.frequencyPerWeek}</span>
                    <button onClick={() => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, frequencyPerWeek: sub.frequencyPerWeek + 1} : sub))} className="font-black text-slate-400 hover:text-indigo-600">+</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {classes.map(c => {
                    const assign = (c.assignments || []).find(a => a.subjectId === s.id);
                    return (
                      <div key={c.id} className="bg-white p-3 rounded-xl border flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{c.name}</span>
                        <select className="bg-transparent text-[10px] font-bold text-slate-800 outline-none" value={assign?.teacherId || ''} onChange={e => {
                          setClasses(classes.map(cl => {
                            if (cl.id !== c.id) return cl;
                            const filter = (cl.assignments || []).filter(a => a.subjectId !== s.id);
                            return { ...cl, assignments: e.target.value ? [...filter, { subjectId: s.id, teacherId: e.target.value }] : filter };
                          }));
                        }}>
                          <option value="">Unassigned</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <button onClick={handleAddNewSubject} className="p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 transition-all">+ New Subject Type</button>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-[#0f172a] p-6 rounded-[2rem] text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Engagements</p>
                <p className="text-slate-400 text-[8px] font-medium mt-1 uppercase">Swap, Clone, or Fill institutional blocks</p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">ALT + DRAG = CLONE</span>
                 <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">BLUE HANDLE = FILL</span>
              </div>
            </div>

            <div className="overflow-x-auto bg-slate-50/50 p-6 rounded-[2.5rem] border shadow-inner">
              <table className="w-full table-fixed min-w-[900px] border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th className="w-16"></th>
                    {['MON','TUE','WED','THU','FRI'].map(d => <th key={d} className="p-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length: profile?.hours.totalPeriods || 8}).map((_, pIdx) => (
                    <tr key={pIdx}>
                      <td className="text-[11px] font-black text-slate-300 text-center uppercase h-[110px]">P{pIdx+1}</td>
                      {Array.from({length: 5}).map((_, dIdx) => {
                        const lock = lockedSlots.find(l => l.dayOfWeek === dIdx && l.period === pIdx);
                        const isTarget = dropTarget?.day === dIdx && dropTarget?.period === pIdx;
                        const isDragging = draggedLock?.day === dIdx && draggedLock?.period === pIdx;
                        const isInFillRange = fillSource && fillTarget && (
                          (dIdx === fillSource.day && pIdx >= Math.min(fillSource.period, fillTarget.period) && pIdx <= Math.max(fillSource.period, fillTarget.period)) ||
                          (pIdx === fillSource.period && dIdx >= Math.min(fillSource.day, fillTarget.day) && dIdx <= Math.max(fillSource.day, fillTarget.day))
                        );

                        return (
                          <td key={dIdx} onMouseEnter={() => onFillMove(dIdx, pIdx)} className="h-[110px] transition-all relative">
                            <button 
                              onClick={() => openLockConfig(dIdx, pIdx)}
                              draggable={!!lock}
                              onDragStart={() => onLockDragStart(dIdx, pIdx)}
                              onDragOver={(e) => onLockDragOver(e, dIdx, pIdx)}
                              onDrop={(e) => onLockDrop(e, dIdx, pIdx)}
                              className={`group w-full h-full rounded-[1.8rem] border-[2px] flex flex-col items-center justify-center p-4 transition-all relative overflow-hidden ${
                                lock 
                                ? `bg-white border-slate-900 shadow-md ${isDragging ? 'opacity-30' : isAltPressed ? 'cursor-copy' : 'cursor-grab active:cursor-grabbing hover:scale-[1.02]'}` 
                                : `bg-white border-slate-100 text-slate-300 ${isTarget || isInFillRange ? 'border-indigo-500 ring-4 ring-indigo-50' : 'hover:border-indigo-100 hover:scale-[1.01]'}`
                              }`}
                            >
                              {lock ? (
                                <>
                                  <span className="text-[12px] font-black text-slate-900 uppercase text-center leading-tight truncate px-2">{lock.name}</span>
                                  <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mt-1 opacity-60">{lock.isSchoolWide ? 'Global' : 'Selective'}</span>
                                  <div onMouseDown={(e) => onFillStart(e, dIdx, pIdx)} className="absolute bottom-1 right-1 w-3 h-3 bg-indigo-600 rounded-md border border-white cursor-crosshair z-30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </>
                              ) : (
                                <div className="opacity-20 flex flex-col items-center gap-1">
                                  <div className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black">+</div>
                                </div>
                              )}
                              {isInFillRange && <div className="absolute inset-0 border-2 border-dashed border-indigo-500 animate-pulse-soft pointer-events-none"></div>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;
