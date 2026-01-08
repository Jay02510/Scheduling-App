
import React, { useState } from 'react';
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
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  onGenerate, profile, teachers, setTeachers, classes, setClasses, textbooks, subjects, setSubjects, lockedSlots, setLockedSlots, schedule 
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'staff' | 'subjects' | 'global'>('classes');
  const [detailView, setDetailView] = useState<{ type: 'teacher' | 'class' | 'lock', id: string } | null>(null);
  
  const [assignmentSub, setAssignmentSub] = useState('');
  const [assignmentTea, setAssignmentTea] = useState('');
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  const handleAddNewTeacher = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newT: Teacher = {
      id: newId,
      name: 'New Faculty Member',
      role: 'subject',
      subjects: [],
      maxDailyPeriods: profile?.hours.totalPeriods || 8,
      breaksNeededPerWeek: 5,
      color: TEACHER_COLORS[teachers.length % TEACHER_COLORS.length],
      assignedClasses: [],
      employmentType: 'Full-Time'
    };
    setTeachers([...teachers, newT]);
    setDetailView({ type: 'teacher', id: newId });
  };

  const handleAddNewClass = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newC: ClassGroup = {
      id: newId,
      name: `Class ${classes.length + 1}`,
      grade: 'G1',
      homeroomTeacherId: '',
      assignments: [],
      color: CLASS_COLORS[classes.length % CLASS_COLORS.length]
    };
    setClasses([...classes, newC]);
    setDetailView({ type: 'class', id: newId });
  };

  const handleAddAssignment = (classId: string) => {
    if (!assignmentSub || !assignmentTea) return;
    setClasses(classes.map(c => {
      if (c.id === classId) {
        const filtered = (c.assignments || []).filter(a => a.subjectId !== assignmentSub);
        return {
          ...c,
          assignments: [...filtered, { subjectId: assignmentSub, teacherId: assignmentTea }]
        };
      }
      return c;
    }));
    setShowAddAssignment(false);
  };

  const openLockConfig = (day: number, period: number) => {
    const lockAtSlot = lockedSlots.find(l => l.dayOfWeek === day && l.period === period);
    
    if (lockAtSlot) {
      setDetailView({ type: 'lock', id: lockAtSlot.id });
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      const newLock: LockedSlot = {
        id: newId,
        name: 'GYM / EXTERNAL',
        dayOfWeek: day,
        period: period,
        classIds: [], // Start unchecked per request
        isSchoolWide: false // Start specific per request
      };
      setLockedSlots([...lockedSlots, newLock]);
      setDetailView({ type: 'lock', id: newId });
    }
  };

  const updateLock = (id: string, updates: Partial<LockedSlot>) => {
    setLockedSlots(lockedSlots.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  if (detailView?.type === 'class') {
    const cls = classes.find(c => c.id === detailView.id);
    if (!cls) return null;
    return (
      <div className="space-y-8 animate-fadeIn">
        <button onClick={() => setDetailView(null)} className="text-[10px] font-black uppercase text-slate-400">← Back to Setup</button>
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-10">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Class Name</span>
            <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} />
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-3">Lessons & Teachers</h4>
            <div className="space-y-3">
              {cls.assignments?.map(a => (
                <div key={a.subjectId} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-black uppercase">{getSubjectName(a.subjectId)}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{getTeacherName(a.teacherId)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddAssignment(true)} className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-widest">+ Add Lesson Assignment</button>
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
        <button onClick={() => setDetailView(null)} className="text-[10px] font-black uppercase text-slate-400">← Back to Grid</button>
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-10">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Engagement Name (Immovable)</span>
            <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase" value={lock.name} onChange={e => updateLock(lock.id, { name: e.target.value })} />
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">e.g. GYM, SWIMMING, DANCE, LUNCH</p>
          </div>
          <div className="space-y-4">
             <label className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl cursor-pointer group">
                <span className="text-xs font-black uppercase tracking-tight">Apply to Entire Institution?</span>
                <input type="checkbox" checked={lock.isSchoolWide} onChange={e => updateLock(lock.id, { isSchoolWide: e.target.checked })} className="w-6 h-6 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500" />
             </label>
             {!lock.isSchoolWide && (
               <div className="space-y-4 pt-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Select Affected Classes</span>
                  <div className="grid grid-cols-2 gap-3">
                    {classes.map(c => (
                      <label key={c.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${lock.classIds.includes(c.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                        <input 
                          type="checkbox" 
                          checked={lock.classIds.includes(c.id)} 
                          onChange={e => {
                            const newIds = e.target.checked ? [...lock.classIds, c.id] : lock.classIds.filter(id => id !== c.id);
                            updateLock(lock.id, { classIds: newIds });
                          }} 
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span className="text-[11px] font-black uppercase text-slate-900">{c.name}</span>
                      </label>
                    ))}
                  </div>
               </div>
             )}
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={() => { setLockedSlots(lockedSlots.filter(l => l.id !== lock.id)); setDetailView(null); }} className="flex-1 py-5 text-rose-500 font-black text-[10px] uppercase tracking-widest bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors">Delete Block</button>
            <button onClick={() => setDetailView(null)} className="flex-[2] py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black transition-colors">Apply Engagement</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Institution Setup</h2>
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-1">Configure Parameters & Logic</p>
        </div>
        <button onClick={onGenerate} className="gradient-primary text-white px-12 py-6 rounded-[2rem] shadow-2xl font-black text-[12px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Optimize Engine Rhythms</button>
      </div>

      <div className="flex bg-slate-100 p-2 rounded-[2.5rem] w-fit shadow-inner">
        {[
          { id: 'classes', label: 'Classes' },
          { id: 'staff', label: 'Faculty' },
          { id: 'subjects', label: 'Subjects' },
          { id: 'global', label: 'Locked Blocks' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-10 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 min-h-[500px]">
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map(c => (
              <div key={c.id} onClick={() => setDetailView({ type: 'class', id: c.id })} className="p-10 bg-slate-50 rounded-[3rem] cursor-pointer hover:shadow-2xl transition-all border-b-[12px] group" style={{ borderBottomColor: c.color }}>
                <h4 className="font-black text-slate-900 text-2xl uppercase text-center group-hover:scale-105 transition-transform">{c.name}</h4>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center mt-3">{c.grade}</p>
              </div>
            ))}
            <button onClick={handleAddNewClass} className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-black text-[11px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-400 transition-all">+ Register Class Group</button>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.map(t => (
              <div key={t.id} onClick={() => setDetailView({ type: 'teacher', id: t.id })} className="p-8 bg-slate-50 rounded-[3rem] relative group border border-transparent hover:border-indigo-100 transition-all cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl" style={{ backgroundColor: t.color }}>{t.name[0] || '?'}</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl truncate max-w-[150px] uppercase">{t.name}</h4>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleAddNewTeacher} className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-black text-[11px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-400 transition-all">+ New Faculty Member</button>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(s => (
               <div key={s.id} className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Subject Name</span>
                  <input className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-900 uppercase text-xs" value={s.name} onChange={e => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, name: e.target.value} : sub))} />
                  <div className="flex items-center justify-between px-2 pt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periods / Week</span>
                    <input type="number" className="w-12 bg-transparent text-right font-black text-indigo-600 outline-none text-xl" value={s.frequencyPerWeek} onChange={e => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, frequencyPerWeek: parseInt(e.target.value) || 1} : sub))} />
                  </div>
               </div>
            ))}
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
              <p className="text-[11px] font-black text-blue-700 uppercase tracking-[0.2em] leading-relaxed">MASTER ENGAGEMENTS: Define immovable blocks (Gym, Swimming, Lunch). Click any slot to configure its name and affected classes.</p>
            </div>
            <div className="overflow-x-auto bg-slate-50/50 p-6 rounded-[3rem] border border-slate-100">
              <table className="w-full table-fixed min-w-[800px] border-collapse">
                <thead>
                  <tr>
                    <th className="w-16"></th>
                    {['MON','TUE','WED','THUR','FRI'].map(d => <th key={d} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length: profile?.hours.totalPeriods || 8}).map((_, pIdx) => (
                    <tr key={pIdx}>
                      <td className="text-[10px] font-black text-slate-300 text-center uppercase h-[140px]">P{pIdx+1}</td>
                      {Array.from({length: 5}).map((_, dIdx) => {
                        const lock = lockedSlots.find(l => l.dayOfWeek === dIdx && l.period === pIdx);
                        return (
                          <td key={dIdx} className="p-2 h-[140px]">
                            <button onClick={() => openLockConfig(dIdx, pIdx)} className={`w-full h-full rounded-[1.8rem] border-[3px] flex flex-col items-center justify-center p-4 transition-all overflow-hidden ${lock ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-100 hover:bg-slate-50'}`}>
                              {lock ? (
                                <>
                                  <span className="text-[11px] font-black uppercase text-center line-clamp-2 leading-tight">{lock.name}</span>
                                  <span className="text-[8px] font-bold opacity-50 uppercase mt-2 tracking-widest">{lock.isSchoolWide ? 'INSTITUTION' : `${lock.classIds.length} GROUPS`}</span>
                                </>
                              ) : (
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">+ ENGAGEMENT</span>
                              )}
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
