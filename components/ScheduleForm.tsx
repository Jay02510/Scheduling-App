
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
  const [activeTab, setActiveTab] = useState<'classes' | 'staff' | 'subjects' | 'global' | 'rhythm' | 'tuning'>('classes');
  const [detailView, setDetailView] = useState<{ type: 'teacher' | 'class' | 'lock', id: string } | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  
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

  const handleAddNewSubjectGlobal = () => {
    const newId = `sub-${Math.random().toString(36).substr(2, 5)}`;
    setSubjects([...subjects, { id: newId, name: 'New Lesson Block', frequencyPerWeek: 5, gradeLevels: ['G1'] }]);
    setExpandedSubjectId(newId);
  };

  const addSubjectToClassDetail = (classId: string) => {
    if (!newSubjectName.trim()) return;
    const name = newSubjectName.trim();

    let existingSubject = subjects.find(s => s.name.toLowerCase() === name.toLowerCase());
    let subjectId = existingSubject?.id;

    if (!existingSubject) {
      subjectId = `sub-${Math.random().toString(36).substr(2, 5)}`;
      const newSub = { id: subjectId, name, frequencyPerWeek: 5, gradeLevels: ['G1'] };
      setSubjects([...subjects, newSub]);
    }

    setClasses(classes.map(c => {
      if (c.id === classId) {
        if (c.assignments.find(a => a.subjectId === subjectId)) return c;
        return { ...c, assignments: [...c.assignments, { subjectId: subjectId!, teacherId: '' }] };
      }
      return c;
    }));
    setNewSubjectName('');
  };

  const updateSubjectFrequency = (subjectId: string, delta: number) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return { ...s, frequencyPerWeek: Math.max(1, s.frequencyPerWeek + delta) };
      }
      return s;
    }));
  };

  const openLockConfig = (day: number, period: number) => {
    const lockAtSpecificSlot = lockedSlots.find(l => l.dayOfWeek === day && l.period === period);

    if (lockAtSpecificSlot) setDetailView({ type: 'lock', id: lockAtSpecificSlot.id });
    else {
      const newId = Math.random().toString(36).substr(2, 9);
      setLockedSlots([...lockedSlots, { id: newId, name: 'NEW BLOCK', dayOfWeek: day, period: period, classIds: [], isSchoolWide: true }]);
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

  if (detailView) {
    if (detailView.type === 'teacher') {
      const t = teachers.find(tea => tea.id === detailView.id);
      if (!t) return null;
      return (
        <div className="space-y-6 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors">← Back to Staffing</button>
          <div className="bg-white p-10 rounded-[3rem] border shadow-2xl max-w-2xl mx-auto space-y-10">
            <div className="flex items-center gap-8 border-b pb-8">
              <div className="w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-white text-3xl font-black shadow-lg" style={{ backgroundColor: t.color }}>{t.name[0] || 'T'}</div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Full Name</span>
                <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full" value={t.name} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, name: e.target.value} : tea))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Role</span>
                <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 text-[11px] uppercase tracking-widest outline-none" value={t.role} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, role: e.target.value as any} : tea))}>
                  <option value="homeroom">Homeroom Lead</option>
                  <option value="specialist">Specialist</option>
                  <option value="subject">Subject Teacher</option>
                  <option value="korean">Korean Teacher</option>
                </select>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Max Daily Periods</span>
                <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-indigo-600 text-lg outline-none" value={t.maxDailyPeriods} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, maxDailyPeriods: parseInt(e.target.value) || 8} : tea))} />
              </div>
            </div>
            <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Contract Constraints</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Guaranteed Weekly Rest Slots</span>
                <input type="number" className="w-16 bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-black text-indigo-400 text-center outline-none" value={t.breaksNeededPerWeek} onChange={e => setTeachers(teachers.map(tea => tea.id === t.id ? {...tea, breaksNeededPerWeek: parseInt(e.target.value) || 5} : tea))} />
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
          <div className="bg-white p-10 rounded-[3rem] border shadow-2xl max-w-4xl mx-auto space-y-10">
            <div className="flex justify-between items-center border-b pb-8">
               <div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2">Group Name</span>
                  <input className="text-4xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase tracking-tighter" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} />
               </div>
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Teacher:</span>
                  <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none" value={cls.homeroomTeacherId} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, homeroomTeacherId: e.target.value} : c))}>
                    <option value="">Vacant</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex-1 flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Subject Name (e.g. Science, Art)..." 
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-6 py-3 font-bold text-xs outline-none focus:border-indigo-500"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubjectToClassDetail(cls.id)}
                  />
                  <button 
                    onClick={() => addSubjectToClassDetail(cls.id)} 
                    className="px-8 py-3 bg-[#0f172a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    + Add Subject
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {cls.assignments.length > 0 ? cls.assignments.map(a => {
                  const subject = subjects.find(s => s.id === a.subjectId);
                  return (
                    <div key={a.subjectId} className="p-6 bg-white rounded-[1.8rem] border border-slate-100 shadow-sm space-y-4 hover:border-indigo-100 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-slate-900 tracking-tight">{subject?.name || 'Unknown'}</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Freq:</span>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateSubjectFrequency(a.subjectId, -1); }}
                                className="w-4 h-4 flex items-center justify-center font-black text-slate-400 hover:text-indigo-600 transition-colors"
                              >-</button>
                              <span className="text-[10px] font-black text-indigo-600 w-3 text-center">{subject?.frequencyPerWeek || 5}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateSubjectFrequency(a.subjectId, 1); }}
                                className="w-4 h-4 flex items-center justify-center font-black text-slate-400 hover:text-indigo-600 transition-colors"
                              >+</button>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">per week</span>
                          </div>
                        </div>
                        <button onClick={() => {
                          setClasses(classes.map(c => c.id === cls.id ? { ...c, assignments: c.assignments.filter(as => as.subjectId !== a.subjectId) } : c));
                        }} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="space-y-1.5">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Mapping Staff</span>
                         <select className="w-full bg-slate-50 border border-transparent rounded-xl px-4 py-2 font-black text-indigo-500 text-[10px] uppercase outline-none hover:border-indigo-200 transition-all" value={a.teacherId} onChange={e => {
                           setClasses(classes.map(c => c.id === cls.id ? { ...c, assignments: c.assignments.map(as => as.subjectId === a.subjectId ? { ...as, teacherId: e.target.value } : as) } : c));
                         }}>
                           <option value="">Unassigned</option>
                           {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <p className="text-[10px] font-black text-slate-300 uppercase italic">Start by adding subjects to this group's curriculum</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => { setClasses(classes.filter(c => c.id !== cls.id)); setDetailView(null); }} className="w-full py-5 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100">Delete Institutional Group</button>
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
          { id: 'rhythm', label: 'Daily Rhythm' },
          { id: 'tuning', label: 'AI Tuning' }
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id as any); setDetailView(null); }} className={`px-6 py-3 rounded-[1.1rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>{t.label}</button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-50 min-h-[500px]">
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {classes.map(c => (
              <div key={c.id} onClick={() => setDetailView({ type: 'class', id: c.id })} className="p-8 bg-slate-50 rounded-[2rem] cursor-pointer hover:shadow-xl transition-all border-l-[10px] group border-transparent hover:border-slate-100" style={{ borderLeftColor: c.color }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">{c.name}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Lead: {getTeacherName(c.homeroomTeacherId)}</p>
                    <div className="mt-4 flex gap-2">
                       <span className="text-[7px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest">{(c.assignments || []).length} Subject Blocks</span>
                    </div>
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-black mb-4 group-hover:scale-110 transition-transform shadow-md" style={{ backgroundColor: t.color }}>{t.name[0] || 'T'}</div>
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight truncate w-full">{t.name}</h4>
                <p className="text-[8px] font-black text-indigo-500 uppercase mt-1">{t.role}</p>
              </div>
            ))}
            <button onClick={handleAddNewTeacher} className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 transition-all">+ Add Faculty</button>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {subjects.map(s => {
              const isExpanded = expandedSubjectId === s.id;
              return (
                <div key={s.id} className="p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all overflow-hidden flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <input className="bg-white border rounded-xl px-4 py-2.5 w-full font-black text-slate-900 uppercase text-xs outline-none focus:border-indigo-200 transition-all" value={s.name} onChange={e => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, name: e.target.value} : sub))} />
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border">
                      <button onClick={() => updateSubjectFrequency(s.id, -1)} className="font-black text-slate-300 hover:text-indigo-600 transition-colors">-</button>
                      <span className="text-xs font-black text-indigo-600 w-4 text-center">{s.frequencyPerWeek}</span>
                      <button onClick={() => updateSubjectFrequency(s.id, 1)} className="font-black text-slate-300 hover:text-indigo-600 transition-colors">+</button>
                    </div>
                    <button onClick={() => setSubjects(subjects.filter(sub => sub.id !== s.id))} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setExpandedSubjectId(isExpanded ? null : s.id)} 
                    className={`w-full py-3.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isExpanded ? 'bg-[#0f172a] border-[#0f172a] text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                  >
                    <span>{isExpanded ? 'Collapse Faculty Mapping' : 'Manage Staff Assignments'}</span>
                    <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fadeIn">
                      {classes.map(c => {
                        const assignment = (c.assignments || []).find(a => a.subjectId === s.id);
                        return (
                          <div key={c.id} className={`bg-white p-4 rounded-[1.2rem] border flex flex-col gap-2 transition-all ${assignment ? 'border-indigo-100 shadow-sm' : 'border-slate-50 opacity-60 hover:opacity-100'}`}>
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }}></div>
                               <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{c.name}</span>
                            </div>
                            <select className="w-full bg-slate-50 border border-transparent rounded-lg px-3 py-1.5 font-bold text-slate-900 text-[10px] outline-none hover:border-slate-200 transition-all" value={assignment?.teacherId || ''} onChange={e => {
                              const newAssignment = { subjectId: s.id, teacherId: e.target.value };
                              setClasses(classes.map(cl => {
                                if (cl.id !== c.id) return cl;
                                const currentAssignments = cl.assignments || [];
                                const filtered = currentAssignments.filter(a => a.subjectId !== s.id);
                                return { ...cl, assignments: [...filtered, newAssignment] };
                              }));
                            }}>
                              <option value="">Vacant</option>
                              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={handleAddNewSubjectGlobal} className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-300 transition-all">+ New Global Lesson Block</button>
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

        {activeTab === 'tuning' && profile && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn py-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Special Considerations</h3>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Guide the Optimization Engine with specific human constraints</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <textarea 
                  className="w-full min-h-[200px] bg-transparent border-0 p-0 focus:ring-0 text-sm font-bold text-slate-700 leading-relaxed placeholder:text-slate-300 custom-scrollbar resize-none outline-none"
                  placeholder="Example: Teacher Evan leaves after lunch and can only teach morning blocks. Class 1A needs Mathematics consistently in the first 2 periods. Homeroom teachers should have their planning time on Wednesday afternoons..."
                  value={profile.specialInstructions || ''}
                  onChange={e => setProfile({...profile, specialInstructions: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-2">Pro Tip: Personnel</p>
                  <p className="text-[10px] text-indigo-900/60 font-medium italic">Mention specific teacher names and their time preferences or availability limits.</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2">Pro Tip: Subjects</p>
                  <p className="text-[10px] text-emerald-900/60 font-medium italic">Specify if certain high-focus subjects like 'Math' or 'English' must happen in the mornings.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;
