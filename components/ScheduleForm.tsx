import React, { useState } from 'react';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolProfile, SubjectConfig, SchoolSchedule } from '../types';
import { TEACHER_COLORS, CLASS_COLORS } from '../constants';
import { parseStaffList, suggestAssignments } from '../services/geminiService';

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

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';

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
    const newSub: SubjectConfig = {
      id: subId,
      name: 'New Subject',
      frequencyPerWeek: 5,
      gradeLevels: ['Grade 1']
    };
    setSubjects([...subjects, newSub]);
  };

  const handleSmartPaste = async () => {
    if (!smartPasteText.trim()) return;
    setIsProcessingPaste(true);
    try {
      const parsed = await parseStaffList(smartPasteText);
      const newTeachers: Teacher[] = parsed.map((p, idx) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: p.name || 'Unknown',
        role: p.role as any || 'subject',
        subjects: [],
        maxDailyPeriods: 8,
        breaksNeededPerWeek: 5,
        assignedClasses: [],
        employmentType: 'Full-Time',
        color: TEACHER_COLORS[(teachers.length + idx) % TEACHER_COLORS.length]
      }));
      setTeachers([...teachers, ...newTeachers]);
      setSmartPasteText('');
    } catch (e) {
      alert("Failed to parse list.");
    } finally {
      setIsProcessingPaste(false);
    }
  };

  if (detailView) {
    if (detailView.type === 'teacher') {
      const teacher = teachers.find(t => t.id === detailView.id);
      if (!teacher) { setDetailView(null); return null; }
      const load = calculateTeacherWeeklyLoad(teacher.id);
      const teacherSlots = schedule?.weeklySlots.filter(s => s.teacherId === teacher.id) || [];

      return (
        <div className="space-y-8 animate-fadeIn">
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            Back to Faculty List
          </button>
          
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12 items-start">
            <div className="w-full md:w-1/3 space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl" style={{ backgroundColor: teacher.color }}>
                  {teacher.name[0]}
                </div>
                <div>
                  <input className="w-full bg-transparent border-0 p-0 font-black text-3xl text-slate-900 focus:ring-0" value={teacher.name} onChange={e => setTeachers(teachers.map(t => t.id === teacher.id ? {...t, name: e.target.value} : t))} />
                  <div className="flex gap-2 mt-2">
                    <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{teacher.role}</span>
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{teacher.employmentType}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Weekly Workload</span>
                    <span className="text-[10px] font-black text-indigo-600">{load} Periods</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (load/25)*100)}%` }}></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Role Permissions</span>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black outline-none cursor-pointer"
                    value={teacher.role}
                    onChange={e => setTeachers(teachers.map(t => t.id === teacher.id ? {...t, role: e.target.value as any} : t))}
                  >
                    <option value="homeroom">Homeroom Teacher</option>
                    <option value="specialist">Specialist</option>
                    <option value="subject">Subject Teacher</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Timetable</h4>
               <div className="grid grid-cols-5 gap-2">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                   <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase py-2">{d}</div>
                 ))}
                 {Array.from({length: 5}).map((_, d) => (
                   <div key={d} className="space-y-1">
                     {Array.from({length: 8}).map((_, p) => {
                        const slot = teacherSlots.find(s => s.day === d && s.period === p);
                        return (
                          <div key={p} className={`h-12 rounded-xl flex flex-col items-center justify-center p-1 border ${slot ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-40'}`}>
                            {slot && (
                              <>
                                <span className="text-[8px] font-black text-slate-900 truncate w-full text-center uppercase">{getSubjectName(slot.subjectId)}</span>
                                <span className="text-[6px] font-bold text-slate-400 uppercase">{classes.find(c => c.id === slot.classId)?.name}</span>
                              </>
                            )}
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
          <button onClick={() => setDetailView(null)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            Back to Class Registry
          </button>
          
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12 items-start">
            <div className="w-full md:w-1/3 space-y-8">
               <div className="space-y-4">
                  <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl" style={{ backgroundColor: cls.color }}>
                    <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                  </div>
                  <div>
                    <input className="w-full bg-transparent border-0 p-0 font-black text-3xl text-slate-900 focus:ring-0 uppercase" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} />
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{cls.grade} Group</p>
                  </div>
               </div>

               <div className="space-y-6">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Faculty Assignments</h5>
                 <div className="space-y-3">
                    {cls.assignments.map(a => (
                      <div key={a.subjectId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-[10px] font-black text-slate-900 uppercase">{getSubjectName(a.subjectId)}</span>
                        <span className="text-[9px] font-bold text-slate-500">{teachers.find(t => t.id === a.teacherId)?.name}</span>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            <div className="flex-1 w-full space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Group Weekly View</h4>
               <div className="grid grid-cols-5 gap-2">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                   <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase py-2">{d}</div>
                 ))}
                 {Array.from({length: 5}).map((_, d) => (
                   <div key={d} className="space-y-1">
                     {Array.from({length: 8}).map((_, p) => {
                        const slot = classSlots.find(s => s.day === d && s.period === p);
                        const teacher = teachers.find(t => t.id === slot?.teacherId);
                        return (
                          <div key={p} className={`h-16 rounded-xl flex flex-col items-center justify-center p-2 border ${slot ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-40'}`}>
                            {slot && (
                              <>
                                <span className="text-[9px] font-black text-slate-900 text-center uppercase leading-tight line-clamp-2">{getSubjectName(slot.subjectId)}</span>
                                <div className="mt-auto h-1 w-full rounded-full" style={{ backgroundColor: teacher?.color || '#eee' }}></div>
                              </>
                            )}
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">School Setup</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Manage Faculty & Curriculum</p>
        </div>
        <button onClick={onGenerate} className="w-full md:w-auto gradient-primary text-white px-10 py-5 rounded-2xl shadow-xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Build Timetable
        </button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit shadow-inner overflow-x-auto max-w-full">
        {(['staff', 'classes', 'subjects', 'locks'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            {t === 'locks' ? 'Locked Times' : t}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[500px]">
        {activeTab === 'staff' && (
          <div className="space-y-10">
            <div className="bg-[#0f172a] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
               <h4 className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Smart Faculty Import</h4>
               <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white font-medium min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                placeholder="Paste names (e.g., Mrs. Anderson, Dr. Strange...)"
                value={smartPasteText}
                onChange={e => setSmartPasteText(e.target.value)}
               />
               <button onClick={handleSmartPaste} disabled={isProcessingPaste} className="mt-6 px-8 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-50">
                 {isProcessingPaste ? 'Parsing...' : 'Import Faculty'}
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setDetailView({ type: 'teacher', id: t.id })}
                  className="p-8 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all space-y-6 relative group cursor-pointer"
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); setTeachers(teachers.filter(pt => pt.id !== t.id)); }} 
                    className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-[1.5rem] flex-shrink-0 flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: t.color }}>
                      <span className="text-2xl font-black">{t.name ? t.name[0] : '?'}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">{t.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addNewTeacher} className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] hover:border-indigo-100 hover:text-indigo-400 transition-all">
                + New Teacher
              </button>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setDetailView({ type: 'class', id: c.id })}
                  className="bg-slate-50 p-8 rounded-[2.5rem] border border-transparent hover:border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all space-y-6 relative group cursor-pointer"
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); setClasses(classes.filter(pc => pc.id !== c.id)); }} 
                    className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-[1.5rem] shadow-lg flex items-center justify-center" style={{ backgroundColor: c.color }}>
                      <svg className="w-8 h-8 text-slate-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">{c.name}</h4>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{c.grade}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addNewClass} className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] hover:border-indigo-100 hover:text-indigo-400 transition-all">
                + New Class
              </button>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(s => (
                <div key={s.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col gap-4 relative group">
                  <button onClick={() => setSubjects(subjects.filter(ps => ps.id !== s.id))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold outline-none" value={s.name} onChange={e => setSubjects(subjects.map(ps => ps.id === s.id ? {...ps, name: e.target.value} : ps))} />
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Frequency:</span>
                    <input type="number" className="w-12 bg-transparent text-right font-black text-indigo-600" value={s.frequencyPerWeek} onChange={e => setSubjects(subjects.map(ps => ps.id === s.id ? {...ps, frequencyPerWeek: parseInt(e.target.value) || 0} : ps))} />
                  </div>
                </div>
              ))}
              <button onClick={addNewSubject} className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] hover:border-indigo-100 hover:text-indigo-400 transition-all">
                + New Subject
              </button>
            </div>
          </div>
        )}

        {activeTab === 'locks' && (
          <div className="space-y-10">
             <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 text-center">
                <p className="text-indigo-900 font-black text-[11px] uppercase tracking-widest mb-2">School Lunch & Assembly Controls</p>
                <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-tight">Configure school-wide locked periods.</p>
             </div>
             <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Locked Slot Management</p>
                <button onClick={() => setLockedSlots([])} className="mt-4 text-[9px] font-black uppercase text-indigo-500 underline">Reset All Global Locks</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;