import React, { useState } from 'react';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolProfile, SubjectConfig, SchoolSchedule } from '../types';
import { TEACHER_COLORS, CLASS_COLORS } from '../constants';
import { parseStaffList } from '../services/geminiService';

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
  setLockedSlots: React.Dispatch<React.SetStateAction<LockedSlot[]>>;
  subjects: SubjectConfig[];
  setSubjects: (subjects: SubjectConfig[]) => void;
  schedule: SchoolSchedule | null;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  onGenerate, profile, setProfile, teachers, setTeachers, classes, setClasses, textbooks, setTextbooks, lockedSlots, setLockedSlots, subjects, setSubjects, schedule 
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'classes' | 'subjects' | 'locks'>('staff');
  const [detailView, setDetailView] = useState<{ type: 'teacher' | 'class', id: string } | null>(null);
  const [smartPasteText, setSmartPasteText] = useState('');
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);

  const [assignmentSub, setAssignmentSub] = useState('');
  const [assignmentTea, setAssignmentTea] = useState('');
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  const [newLockName, setNewLockName] = useState('Recess');
  const [newLockDay, setNewLockDay] = useState(0);
  const [newLockPeriod, setNewLockPeriod] = useState(2);
  const [showLockCreator, setShowLockCreator] = useState(false);

  const calculateTeacherWeeklyLoad = (teacherId: string) => {
    let total = 0;
    classes.forEach(c => {
      c.assignments.forEach(a => {
        if (a.teacherId === teacherId) {
          const sub = subjects.find(s => s.id === a.subjectId);
          if (sub) total += sub.frequencyPerWeek;
        }
      });
    });
    return total;
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown Subject';

  const handlePairAssignment = (classId: string) => {
    if (!assignmentSub || !assignmentTea) return;
    setClasses(classes.map(c => {
      if (c.id === classId) {
        const otherAssignments = c.assignments.filter(a => a.subjectId !== assignmentSub);
        return {
          ...c,
          assignments: [...otherAssignments, { subjectId: assignmentSub, teacherId: assignmentTea }]
        };
      }
      return c;
    }));
    setAssignmentSub('');
    setAssignmentTea('');
    setShowAddAssignment(false);
  };

  const handleAddGlobalLock = () => {
    const newLock: LockedSlot = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLockName,
      dayOfWeek: newLockDay,
      period: newLockPeriod,
      classIds: [],
      isSchoolWide: true,
      color: '#6366f1'
    };
    setLockedSlots([...lockedSlots, newLock]);
    setShowLockCreator(false);
  };

  const handleSmartPaste = async () => {
    if (!smartPasteText.trim()) return;
    setIsProcessingPaste(true);
    try {
      const parsed = await parseStaffList(smartPasteText);
      const newTeachers: Teacher[] = parsed.map((p, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: p.name || 'New Teacher',
        role: (p.role as 'homeroom' | 'specialist' | 'subject' | 'korean') || 'subject',
        subjects: [],
        maxDailyPeriods: 8,
        breaksNeededPerWeek: 5,
        assignedClasses: [],
        employmentType: 'Full-Time',
        color: TEACHER_COLORS[(teachers.length + index) % TEACHER_COLORS.length]
      }));
      setTeachers([...teachers, ...newTeachers]);
      setSmartPasteText('');
    } catch (error) {
      console.error("Paste failed:", error);
      alert("Failed to parse the staff list.");
    } finally {
      setIsProcessingPaste(false);
    }
  };

  const addNewTeacher = () => {
    const newTeacher: Teacher = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: 'New Teacher', 
      role: 'subject', 
      subjects: [], 
      maxDailyPeriods: 8, 
      breaksNeededPerWeek: 5, 
      assignedClasses: [],
      employmentType: 'Full-Time',
      color: TEACHER_COLORS[teachers.length % TEACHER_COLORS.length]
    };
    setTeachers([...teachers, newTeacher]);
    setDetailView({ type: 'teacher', id: newTeacher.id });
  };

  const addNewClass = () => {
    const newClass: ClassGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Class ${classes.length + 1}`,
      grade: 'Grade 1',
      homeroomTeacherId: '',
      assignments: [],
      color: CLASS_COLORS[classes.length % CLASS_COLORS.length]
    };
    setClasses([...classes, newClass]);
    setDetailView({ type: 'class', id: newClass.id });
  };

  const addNewSubject = () => {
    const subId = Math.random().toString(36).substr(2, 9);
    setSubjects([...subjects, {
      id: subId,
      name: 'New Subject',
      frequencyPerWeek: 5,
      gradeLevels: ['Grade 1']
    }]);
  };

  if (detailView) {
    if (detailView.type === 'teacher') {
      const teacher = teachers.find(t => t.id === detailView.id);
      if (!teacher) { setDetailView(null); return null; }
      const load = calculateTeacherWeeklyLoad(teacher.id);
      const teacherSlots = schedule?.weeklySlots.filter(s => s.teacherId === teacher.id) || [];

      return (
        <div className="space-y-8 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
            ← Back to Faculty List
          </button>
          
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12 items-start">
            <div className="w-full md:w-1/3 space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl" style={{ backgroundColor: teacher.color }}>
                  {teacher.name[0]}
                </div>
                <div>
                  <input className="w-full bg-transparent border-0 p-0 font-black text-3xl text-slate-900 focus:ring-0" value={teacher.name} onChange={e => setTeachers(teachers.map(t => t.id === teacher.id ? {...t, name: e.target.value} : t))} />
                  <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest block mt-2 w-fit">{teacher.role}</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Load</span>
                    <span className="text-[10px] font-black text-indigo-600">{load} Periods</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (load/25)*100)}%` }}></div>
                  </div>
                </div>
                <button onClick={() => { if(confirm("Delete teacher?")) { setTeachers(teachers.filter(t => t.id !== teacher.id)); setDetailView(null); }}} className="w-full py-3 bg-rose-50 text-rose-500 rounded-xl text-[9px] font-black uppercase">Delete Staff Member</button>
              </div>
            </div>

            <div className="flex-1 w-full space-y-6 overflow-x-auto">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Timetable</h4>
               <div className="grid grid-cols-5 gap-2 min-w-[500px]">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase py-2">{d}</div>)}
                 {Array.from({length: 5}).map((_, d) => (
                   <div key={d} className="space-y-1">
                     {Array.from({length: profile?.hours.totalPeriods || 8}).map((_, p) => {
                        const slot = teacherSlots.find(s => s.day === d && s.period === p);
                        const isLunch = p === profile?.hours.lunchAfterPeriod;
                        return (
                          <div key={p} className={`h-14 rounded-xl flex flex-col items-center justify-center p-1 border ${slot ? 'bg-white border-slate-200 shadow-sm' : isLunch ? 'bg-slate-100 border-transparent' : 'bg-slate-50 border-transparent opacity-40'}`}>
                            {slot ? (
                              <>
                                <span className="text-[8px] font-black text-slate-900 truncate w-full text-center uppercase">{getSubjectName(slot.subjectId)}</span>
                                <span className="text-[6px] font-bold text-slate-400 uppercase">{classes.find(c => c.id === slot.classId)?.name}</span>
                              </>
                            ) : isLunch ? <span className="text-[6px] font-black text-slate-300 uppercase">Lunch</span> : null}
                          </div>
                        );
                     })}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      );
    } else {
      const cls = classes.find(c => c.id === detailView.id);
      if (!cls) { setDetailView(null); return null; }
      const classSlots = schedule?.weeklySlots.filter(s => s.classId === cls.id) || [];

      return (
        <div className="space-y-8 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
            ← Back to Class Registry
          </button>
          
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12 items-start">
            <div className="w-full md:w-1/3 space-y-8">
               <div className="space-y-4">
                  <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl" style={{ backgroundColor: cls.color }}>
                    <svg className="w-8 h-8 text-slate-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                  </div>
                  <div>
                    <input className="w-full bg-transparent border-0 p-0 font-black text-3xl text-slate-900 focus:ring-0 uppercase" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} />
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{cls.grade}</p>
                  </div>
               </div>
               <div className="space-y-6">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Course Load</h5>
                 <div className="space-y-3">
                    {cls.assignments.map(a => (
                      <div key={a.subjectId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group relative">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-900 uppercase">{getSubjectName(a.subjectId)}</span>
                          <span className="text-[8px] font-bold text-slate-400">{teachers.find(t => t.id === a.teacherId)?.name}</span>
                        </div>
                        <button onClick={() => setClasses(classes.map(c => c.id === cls.id ? {...c, assignments: c.assignments.filter(as => as.subjectId !== a.subjectId)} : c))} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                 </div>
                 {showAddAssignment ? (
                    <div className="p-5 bg-[#0f172a] rounded-[2rem] space-y-4 animate-fadeIn">
                       <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none" value={assignmentSub} onChange={e => setAssignmentSub(e.target.value)}>
                         <option value="" className="text-slate-900">Choose Subject</option>
                         {subjects.map(s => <option key={s.id} value={s.id} className="text-slate-900">{s.name}</option>)}
                       </select>
                       <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none" value={assignmentTea} onChange={e => setAssignmentTea(e.target.value)}>
                         <option value="" className="text-slate-900">Choose Teacher</option>
                         {teachers.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name}</option>)}
                       </select>
                       <div className="flex gap-2">
                          <button onClick={() => setShowAddAssignment(false)} className="flex-1 py-3 text-[9px] font-black text-slate-400 uppercase">Cancel</button>
                          <button onClick={() => handlePairAssignment(cls.id)} className="flex-1 py-3 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase">Add</button>
                       </div>
                    </div>
                 ) : <button onClick={() => setShowAddAssignment(true)} className="w-full py-5 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black uppercase text-slate-400">+ Assign Lesson</button>}
               </div>
            </div>
            <div className="flex-1 w-full overflow-x-auto">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Class Schedule</h4>
               <div className="grid grid-cols-5 gap-2 min-w-[500px]">
                 {Array.from({length: 5}).map((_, d) => (
                   <div key={d} className="space-y-1">
                     {Array.from({length: profile?.hours.totalPeriods || 8}).map((_, p) => {
                        const slot = classSlots.find(s => s.day === d && s.period === p);
                        const isLunch = p === profile?.hours.lunchAfterPeriod;
                        return (
                          <div key={p} className={`h-16 rounded-xl flex flex-col items-center justify-center p-2 border ${slot ? 'bg-white border-slate-200' : isLunch ? 'bg-slate-100 opacity-40' : 'bg-slate-50 opacity-20'}`}>
                            {slot && <span className="text-[9px] font-black text-slate-900 text-center uppercase leading-tight">{getSubjectName(slot.subjectId)}</span>}
                          </div>
                        );
                     })}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Setup</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">School Configuration</p>
        </div>
        <button onClick={onGenerate} className="gradient-primary text-white px-10 py-5 rounded-2xl shadow-xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Build Timetable</button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit shadow-inner">
        {(['staff', 'classes', 'subjects', 'locks'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {t === 'locks' ? 'Global Blocks' : t === 'staff' ? 'Faculty' : t}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[500px]">
        {activeTab === 'staff' && (
          <div className="space-y-10">
            <div className="bg-[#0f172a] p-8 rounded-[2rem] shadow-2xl">
               <h4 className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-4">Faculty Import</h4>
               <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white font-medium min-h-[120px] outline-none" placeholder="Paste names..." value={smartPasteText} onChange={e => setSmartPasteText(e.target.value)} />
               <button onClick={() => { handleSmartPaste(); }} disabled={isProcessingPaste} className="mt-6 px-8 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-50">
                 {isProcessingPaste ? 'Parsing...' : 'Import'}
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map(t => (
                <div key={t.id} onClick={() => setDetailView({ type: 'teacher', id: t.id })} className="p-8 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-slate-200 transition-all group cursor-pointer">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                    <h4 className="font-black text-slate-900 text-lg">{t.name}</h4>
                  </div>
                </div>
              ))}
              <button onClick={addNewTeacher} className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-100">+ New Teacher</button>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(c => (
              <div key={c.id} onClick={() => setDetailView({ type: 'class', id: c.id })} className="bg-slate-50 p-8 rounded-[2.5rem] hover:shadow-xl transition-all cursor-pointer">
                <h4 className="font-black text-slate-900 text-xl uppercase text-center">{c.name}</h4>
              </div>
            ))}
            <button onClick={addNewClass} className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase">+ New Class</button>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(s => (
              <div key={s.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col gap-4">
                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold outline-none" value={s.name} onChange={e => setSubjects(subjects.map(ps => ps.id === s.id ? {...ps, name: e.target.value} : ps))} />
                <div className="flex items-center justify-between px-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Frequency:</span>
                  <input type="number" className="w-12 bg-transparent text-right font-black text-indigo-600 outline-none" value={s.frequencyPerWeek} onChange={e => setSubjects(subjects.map(ps => ps.id === s.id ? {...ps, frequencyPerWeek: parseInt(e.target.value) || 0} : ps))} />
                </div>
              </div>
            ))}
            <button onClick={addNewSubject} className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase">+ New Subject</button>
          </div>
        )}

        {activeTab === 'locks' && (
          <div className="space-y-10">
             <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex justify-between items-center">
                <p className="text-indigo-900 font-black text-[11px] uppercase tracking-widest">Institutional Locks</p>
                <button onClick={() => setShowLockCreator(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">+ Add Block</button>
             </div>
             {showLockCreator && (
                <div className="p-8 bg-slate-900 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-3 gap-6">
                   <input className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-black text-[11px]" value={newLockName} onChange={e => setNewLockName(e.target.value)} />
                   <select className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-black text-[11px]" value={newLockDay} onChange={e => setNewLockDay(parseInt(e.target.value))}>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday'].map((d, i) => <option key={d} value={i} className="text-slate-900">{d}</option>)}
                   </select>
                   <div className="flex gap-2">
                      <button onClick={() => setShowLockCreator(false)} className="flex-1 text-slate-400 text-[9px] font-black uppercase">Cancel</button>
                      <button onClick={handleAddGlobalLock} className="flex-1 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase">Save</button>
                   </div>
                </div>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedSlots.map(l => (
                    <div key={l.id} className="p-6 bg-slate-50 rounded-[2rem] flex items-center justify-between group">
                        <span className="text-[11px] font-black uppercase text-slate-900">{l.name} - Period {l.period + 1}</span>
                        <button onClick={() => setLockedSlots(lockedSlots.filter(ls => ls.id !== l.id))} className="text-rose-200 hover:text-rose-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;