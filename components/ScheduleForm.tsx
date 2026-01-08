
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
  onNavigate?: (tab: string) => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  onGenerate, profile, setProfile, teachers, setTeachers, classes, setClasses, textbooks, subjects, setSubjects, lockedSlots, setLockedSlots, schedule, onMoveLock, onFillLocks, onNavigate 
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
  const getTeacherName = (id: string) => teachers?.find(t => t.id === id)?.name || 'Unassigned';
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
      id: newId, name: `Group ${classes.length + 1}`, grade: 'G1', 
      homeroomTeacherId: '', assignments: [], 
      color: CLASS_COLORS[classes.length % CLASS_COLORS.length] 
    }]);
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
      setLockedSlots([...lockedSlots, { id: newId, name: 'NEW BLOCK', dayOfWeek: day, period: period, classIds: [], isSchoolWide: true }]);
      setDetailView({ type: 'lock', id: newId });
    }
  };

  const updateLock = (id: string, updates: Partial<LockedSlot>) => {
    setLockedSlots(lockedSlots.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  // Drag/Fill Handlers
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

  // Profile Detail Views
  if (detailView) {
    if (detailView.type === 'teacher') {
      const t = teachers.find(tea => tea.id === detailView.id);
      if (!t) return null;
      return (
        <div className="space-y-6 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">← Back to Staffing</button>
          <div className="bg-white p-10 rounded-[3rem] border shadow-2xl max-w-2xl mx-auto space-y-10">
            <div className="flex items-center gap-8 border-b pb-8">
              <div className="w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-white text-3xl font-black shadow-lg" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Full Name</span>
                <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full" value={t.name} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, name: e.target.value} : tea))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Role</span>
                <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 text-[11px] uppercase tracking-widest" value={t.role} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, role: e.target.value as any} : tea))}>
                  <option value="homeroom">Homeroom Lead</option>
                  <option value="specialist">Specialist</option>
                  <option value="subject">Subject Teacher</option>
                  <option value="korean">Korean Teacher</option>
                </select>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Max Daily Periods</span>
                <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-indigo-600 text-lg" value={t.maxDailyPeriods} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, maxDailyPeriods: parseInt(e.target.value) || 8} : tea))} />
              </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Contract Constraints</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Guaranteed Weekly Rest Slots</span>
                <input type="number" className="w-16 bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-black text-indigo-400 text-center" value={t.breaksNeededPerWeek} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, breaksNeededPerWeek: parseInt(e.target.value) || 5} : tea))} />
              </div>
            </div>

            <button onClick={() => { setTeachers(teachers.filter(tea => tea.id !== t.id)); setDetailView(null); }} className="w-full py-5 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-rose-100">Deactivate Faculty File</button>
          </div>
        </div>
      );
    }

    if (detailView.type === 'class') {
      const cls = classes.find(c => c.id === detailView.id);
      if (!cls) return null;
      return (
        <div className="space-y-6 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">← Back to Classes</button>
          <div className="bg-white p-10 rounded-[3rem] border shadow-2xl max-w-2xl mx-auto space-y-10">
            <div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Group Name</span>
              <input className="text-4xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase tracking-tighter" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} />
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Active Assignments</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {cls.assignments.length > 0 ? cls.assignments.map(a => (
                  <div key={a.subjectId} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-tight">{getSubjectName(a.subjectId)}</span>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest px-4 py-1.5 bg-indigo-50 rounded-lg">{getTeacherName(a.teacherId)}</span>
                  </div>
                )) : <div className="py-10 text-center text-[10px] font-black text-slate-300 uppercase italic">No active assignments</div>}
              </div>
            </div>

            <button onClick={() => { setClasses(classes.filter(c => c.id !== cls.id)); setDetailView(null); }} className="w-full py-5 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Delete Class Group</button>
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
              <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase" value={lock.name} onChange={e => updateLock(lock.id, { name: e.target.value })} />
            </div>
            <label className="flex items-center justify-between p-6 bg-slate-900 rounded-[1.8rem] cursor-pointer text-white">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block">Institutional Event</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Blocks every class group at this time</span>
              </div>
              <input type="checkbox" checked={lock.isSchoolWide} onChange={e => updateLock(lock.id, { isSchoolWide: e.target.checked })} className="w-6 h-6 rounded-lg text-indigo-500" />
            </label>
            {!lock.isSchoolWide && (
               <div className="space-y-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Impacted Classes</span>
                 <div className="flex flex-wrap gap-2">
                   {classes.map(c => (
                     <button key={c.id} onClick={() => {
                       const current = lock.classIds || [];
                       updateLock(lock.id, { classIds: current.includes(c.id) ? current.filter(id => id !== c.id) : [...current, c.id] });
                     }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${lock.classIds?.includes(c.id) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{c.name}</button>
                   ))}
                 </div>
               </div>
            )}
            <div className="flex gap-4 pt-4">
              <button onClick={() => { setLockedSlots(lockedSlots.filter(l => l.id !== lock.id)); setDetailView(null); }} className="flex-1 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase">Discard</button>
              <button onClick={() => setDetailView(null)} className="flex-[2] py-4 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase">Save Configuration</button>
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
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Setup Center</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Institutional Configuration</p>
        </div>
        <div className="flex gap-3">
          {schedule && (
            <button onClick={() => onNavigate?.('homerooms')} className="bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">View Live Schedule</button>
          )}
          <button onClick={onGenerate} className="gradient-primary text-white px-8 py-4 rounded-[1.5rem] shadow-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Sync Infrastructure</button>
        </div>
      </header>

      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit shadow-inner mx-auto md:mx-0 overflow-x-auto max-w-full gap-1">
        {[
          { id: 'classes', label: 'Classes' },
          { id: 'staff', label: 'Faculty' },
          { id: 'subjects', label: 'Subjects' },
          { id: 'global', label: 'Master Engagements' },
          { id: 'rhythm', label: 'Daily Rhythm' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-6 py-3 rounded-[1.1rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>{t.label}</button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-50 min-h-[500px]">
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {classes.map(c => (
              <div key={c.id} onClick={() => setDetailView({ type: 'class', id: c.id })} className="p-8 bg-slate-50 rounded-[2rem] cursor-pointer hover:shadow-xl transition-all border-l-[10px] group" style={{ borderLeftColor: c.color }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">{c.name}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Homeroom Lead: {getTeacherName(c.homeroomTeacherId)}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
            <button onClick={handleAddNewClass} className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-400 transition-all">+ Register Group</button>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            {teachers.map(t => (
              <div key={t.id} onClick={() => setDetailView({ type: 'teacher', id: t.id })} className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center text-center cursor-pointer hover:shadow-xl transition-all group border border-transparent hover:border-slate-100">
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
                <div className="flex items-center justify-between gap-4">
                  <input className="bg-white border rounded-xl px-4 py-2 w-full font-black text-slate-900 uppercase text-xs" value={s.name} onChange={e => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, name: e.target.value} : sub))} />
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border">
                    <button onClick={() => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, frequencyPerWeek: Math.max(1, sub.frequencyPerWeek-1)} : sub))} className="font-black text-slate-300 hover:text-indigo-600">-</button>
                    <span className="text-xs font-black text-indigo-600 w-4 text-center">{s.frequencyPerWeek}</span>
                    <button onClick={() => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, frequencyPerWeek: sub.frequencyPerWeek+1} : sub))} className="font-black text-slate-300 hover:text-indigo-600">+</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {classes.map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-xl border flex flex-col gap-1">
                      <span className="text-[7px] font-black text-slate-400 uppercase">{c.name}</span>
                      <select className="bg-transparent text-[9px] font-bold text-slate-800 outline-none" value={c.assignments.find(a => a.subjectId === s.id)?.teacherId || ''} onChange={e => {
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
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Engagements</p>
                <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1">Global & Selective Infrastructure Blocks</p>
              </div>
              <div className="flex gap-4">
                <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase tracking-widest">Swap/Clone/Fill Active</span>
              </div>
            </div>
            <div className="overflow-x-auto bg-slate-50/50 p-4 rounded-[2.5rem] border shadow-inner">
              <table className="w-full table-fixed min-w-[850px] border-separate border-spacing-2">
                <thead><tr><th className="w-16"></th>{['MON','TUE','WED','THU','FRI'].map(d => <th key={d} className="p-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</th>)}</tr></thead>
                <tbody>{Array.from({length: profile?.hours.totalPeriods || 8}).map((_, pIdx) => (
                  <tr key={pIdx}>
                    <td className="text-[11px] font-black text-slate-300 text-center uppercase h-[110px]">P{pIdx+1}</td>
                    {Array.from({length: 5}).map((_, dIdx) => {
                      const lock = lockedSlots.find(l => l.dayOfWeek === dIdx && l.period === pIdx);
                      const isInFillRange = fillSource && fillTarget && ((dIdx === fillSource.day && pIdx >= Math.min(fillSource.period, fillTarget.period) && pIdx <= Math.max(fillSource.period, fillTarget.period)) || (pIdx === fillSource.period && dIdx >= Math.min(fillSource.day, fillTarget.day) && dIdx <= Math.max(fillSource.day, fillTarget.day)));
                      
                      return (
                        <td key={dIdx} onMouseEnter={() => onFillMove(dIdx, pIdx)} className="h-[110px] relative transition-all">
                          <button onClick={() => openLockConfig(dIdx, pIdx)} draggable={!!lock} onDragStart={() => onLockDragStart(dIdx, pIdx)} onDragOver={(e) => onLockDragOver(e, dIdx, pIdx)} onDrop={(e) => onLockDrop(e, dIdx, pIdx)} className={`group w-full h-full rounded-[1.8rem] border-[2px] flex flex-col items-center justify-center p-3 transition-all relative overflow-hidden ${lock ? 'bg-white border-slate-900 shadow-md z-10' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm'}`}>
                            {lock ? (
                              <>
                                <span className="text-[12px] font-black text-slate-900 uppercase text-center leading-tight truncate px-1 tracking-tighter">{lock.name}</span>
                                {lock.isSchoolWide ? (
                                  <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mt-1 opacity-60">Global Block</span>
                                ) : (
                                  <div className="flex flex-wrap justify-center gap-0.5 mt-1.5 px-2">
                                    {(lock.classIds || []).map(cid => (
                                      <div key={cid} className="px-1.5 py-0.5 rounded-[4px] text-[6px] font-black text-white uppercase shadow-sm" style={{ backgroundColor: getClassColor(cid) }}>{getClassName(cid)}</div>
                                    ))}
                                  </div>
                                )}
                                <div onMouseDown={(e) => onFillStart(e, dIdx, pIdx)} className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-indigo-600 rounded-md border border-white cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              </>
                            ) : <div className="text-slate-200 text-xl font-black">+</div>}
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
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">School Start Time</span><input type="time" className="bg-white border rounded-xl px-4 py-3 font-black text-indigo-600 shadow-sm outline-none" value={profile.hours.startTime} onChange={e => setProfile({...profile, hours: {...profile.hours, startTime: e.target.value}})} /></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lesson Duration</span><div className="flex items-center gap-2"><input type="number" className="w-20 bg-white border rounded-xl px-4 py-3 font-black text-indigo-600 text-center shadow-sm outline-none" value={profile.hours.periodDuration} onChange={e => setProfile({...profile, hours: {...profile.hours, periodDuration: parseInt(e.target.value) || 45}})} /><span className="text-[8px] font-black text-slate-400 uppercase">Min</span></div></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Daily Slots</span><div className="flex items-center gap-2"><input type="number" className="w-20 bg-white border rounded-xl px-4 py-3 font-black text-indigo-600 text-center shadow-sm outline-none" value={profile.hours.totalPeriods} onChange={e => setProfile({...profile, hours: {...profile.hours, totalPeriods: parseInt(e.target.value) || 8}})} /><span className="text-[8px] font-black text-slate-400 uppercase">Slots</span></div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;
