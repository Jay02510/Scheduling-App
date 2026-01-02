import React, { useState } from 'react';
import { Teacher, Textbook, ClassGroup, FixedClass, SchoolProfile, SubjectConfig } from '../types';
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
  fixedClasses: FixedClass[];
  setFixedClasses: React.Dispatch<React.SetStateAction<FixedClass[]>>;
  subjects: SubjectConfig[];
  setSubjects: (subjects: SubjectConfig[]) => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  onGenerate, profile, setProfile, teachers, setTeachers, classes, setClasses, textbooks, setTextbooks, fixedClasses, setFixedClasses, subjects, setSubjects 
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'classes' | 'books' | 'locks'>('staff');

  const addNewTeacher = () => {
    setTeachers([...teachers, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: 'New Teacher', 
      role: 'subject', 
      subjects: [], 
      maxDailyPeriods: 8, 
      breaksNeededPerWeek: 5, 
      assignedClasses: [],
      employmentType: 'full-time',
      color: TEACHER_COLORS[teachers.length % TEACHER_COLORS.length] 
    }]);
  };

  const addNewClass = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setClasses([...classes, {
      id: newId,
      name: `New Class ${classes.length + 1}`,
      grade: 'Grade 1',
      homeroomTeacherId: '',
      koreanTeacherId: '',
      assignments: [],
      color: CLASS_COLORS[classes.length % CLASS_COLORS.length]
    }]);
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

  const handleAssignment = (classId: string, subjectId: string, teacherId: string) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        const other = c.assignments.filter(a => a.subjectId !== subjectId);
        return { ...c, assignments: teacherId ? [...other, { subjectId, teacherId }] : other };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Setup</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Configure your core school data</p>
        </div>
        <button onClick={onGenerate} className="gradient-primary text-white px-8 py-4 rounded-2xl shadow-xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
          Synthesize Schedule
        </button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit shadow-inner">
        {(['staff', 'classes', 'books', 'locks'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[500px]">
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Faculty Management</h3>
              <button onClick={addNewTeacher} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">+ Add Teacher</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map(t => (
                <div key={t.id} className="p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex-shrink-0" style={{ backgroundColor: t.color }}></div>
                    <div className="flex-1">
                      <input className="bg-transparent border-0 p-0 font-black text-slate-800 text-lg w-full focus:ring-0" value={t.name} onChange={e => setTeachers(teachers.map(pt => pt.id === t.id ? {...pt, name: e.target.value} : pt))} />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.role}</p>
                    </div>
                    <button onClick={() => setTeachers(teachers.filter(pt => pt.id !== t.id))} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400">Max Daily</label>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold" value={t.maxDailyPeriods} onChange={e => setTeachers(teachers.map(pt => pt.id === t.id ? {...pt, maxDailyPeriods: parseInt(e.target.value) || 0} : pt))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400">Min Breaks</label>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold" value={t.breaksNeededPerWeek} onChange={e => setTeachers(teachers.map(pt => pt.id === t.id ? {...pt, breaksNeededPerWeek: parseInt(e.target.value) || 0} : pt))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Groups & Assignments</h3>
              <div className="flex gap-2">
                <button onClick={addNewSubject} className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">+ New Subject</button>
                <button onClick={addNewClass} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">+ New Class</button>
              </div>
            </div>
            <div className="space-y-10">
              {classes.map(c => (
                <div key={c.id} className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 relative group">
                  <button onClick={() => setClasses(classes.filter(pc => pc.id !== c.id))} className="absolute top-6 right-6 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: c.color }}></div>
                    <input className="bg-transparent border-0 p-0 font-black text-slate-800 text-lg focus:ring-0 uppercase tracking-tight" value={c.name} onChange={e => setClasses(classes.map(pc => pc.id === c.id ? {...pc, name: e.target.value} : pc))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {subjects.map(s => {
                      const current = c.assignments.find(a => a.subjectId === s.id);
                      const isAssigned = !!current;
                      return (
                        <div key={s.id} className={`p-4 rounded-2xl space-y-2 border-2 transition-all ${isAssigned ? 'bg-white border-indigo-100' : 'bg-slate-100/50 border-transparent opacity-60'}`}>
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black uppercase text-slate-400 block truncate max-w-[80px]">{s.name}</label>
                            <input type="checkbox" checked={isAssigned} onChange={() => handleAssignment(c.id, s.id, isAssigned ? '' : (teachers[0]?.id || ''))} className="w-3 h-3 rounded text-indigo-600 focus:ring-0" />
                          </div>
                          <select 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-[10px] font-bold outline-none disabled:opacity-30"
                            value={current?.teacherId || ''}
                            disabled={!isAssigned}
                            onChange={e => handleAssignment(c.id, s.id, e.target.value)}
                          >
                            <option value="">Select Teacher</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900">Resource Mapping</h3>
            <div className="grid grid-cols-1 gap-4">
              {textbooks.map(b => (
                <div key={b.id} className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 rounded-[2rem] items-center">
                  <div className="flex-1">
                    <input className="bg-transparent border-0 p-0 font-black text-slate-800 text-lg w-full focus:ring-0" value={b.title} onChange={e => setTextbooks(textbooks.map(pb => pb.id === b.id ? {...pb, title: e.target.value} : pb))} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{b.subject}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400">Total Pages</label>
                      <input type="number" className="w-24 bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold" value={b.totalPages} onChange={e => setTextbooks(textbooks.map(pb => pb.id === b.id ? {...pb, totalPages: parseInt(e.target.value) || 0} : pb))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'locks' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900">Institutional Blocks</h3>
            <p className="text-sm text-slate-500 font-medium">Global events or shared class periods (Gym, Library, etc).</p>
            <div className="grid grid-cols-6 gap-2">
              <div className="h-4"></div>
              {['M','T','W','T','F'].map(d => <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase">{d}</div>)}
              {Array.from({length: profile?.hours.totalPeriods || 8}).map((_, p) => (
                <React.Fragment key={p}>
                  <div className="text-[9px] font-black text-slate-300 flex items-center justify-center">P{p+1}</div>
                  {Array.from({length: 5}).map((_, d) => {
                    const fixed = fixedClasses.find(f => f.dayOfWeek === d && f.period === p);
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          if (fixed) {
                            setFixedClasses(fixedClasses.filter(f => f.id !== fixed.id));
                          } else {
                            const newId = Math.random().toString(36).substr(2, 9);
                            setFixedClasses([...fixedClasses, { id: newId, name: 'Locked Activity', dayOfWeek: d, period: p, classIds: [], isSchoolWide: true, color: '#f1f5f9' }]);
                          }
                        }}
                        className={`h-12 rounded-xl border transition-all ${fixed ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                      >
                        {fixed ? <span className="text-[7px] font-black uppercase leading-tight">LOCKED</span> : <span className="text-slate-200 font-black">+</span>}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;