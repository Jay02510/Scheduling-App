import React, { useState } from 'react';
import { Teacher, Textbook, ClassGroup, FixedClass, SchoolProfile, SubjectConfig } from '../types';
import { TEACHER_COLORS, CLASS_COLORS } from '../constants';

interface ScheduleFormProps {
  onGenerate: () => void;
  profile: SchoolProfile | null;
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

const BLOCK_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Cyan', hex: '#06b6d4' }
];

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  onGenerate, 
  profile, 
  teachers, 
  setTeachers, 
  classes, 
  setClasses, 
  textbooks,
  setTextbooks,
  fixedClasses, 
  setFixedClasses, 
  subjects, 
  setSubjects 
}) => {
  const [activeClassTab, setActiveClassTab] = useState<string>(classes[0]?.id || '');
  const [selectedFixedId, setSelectedFixedId] = useState<string | null>(null);
  const totalPeriods = profile?.hours.totalPeriods || 8;

  const handleAssignmentChange = (classId: string, subjectId: string, teacherId: string) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        const filtered = c.assignments.filter(a => a.subjectId !== subjectId);
        if (teacherId === '') return { ...c, assignments: filtered };
        return { ...c, assignments: [...filtered, { subjectId, teacherId }] };
      }
      return c;
    }));
  };

  const deleteTeacher = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Remove this teacher?")) {
      setTeachers(teachers.filter(t => t.id !== id));
      setClasses(classes.map(c => ({
        ...c,
        homeroomTeacherId: c.homeroomTeacherId === id ? '' : c.homeroomTeacherId,
        assignments: c.assignments.filter(a => a.teacherId !== id)
      })));
    }
  };

  const deleteClass = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Remove this class?")) {
      const updated = classes.filter(c => c.id !== id);
      setClasses(updated);
      if (activeClassTab === id) {
        setActiveClassTab(updated[0]?.id || '');
      }
    }
  };

  const deleteSubject = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Remove this subject?")) {
      setSubjects(subjects.filter(s => s.id !== id));
      setClasses(classes.map(c => ({
        ...c,
        assignments: c.assignments.filter(a => a.subjectId !== id)
      })));
    }
  };

  const addNewTeacher = () => {
    const colorIndex = teachers.length % TEACHER_COLORS.length;
    setTeachers([...teachers, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: 'New Teacher', 
      role: 'homeroom', 
      subjects: [], 
      maxDailyPeriods: totalPeriods, 
      assignedClasses: [], 
      employmentType: 'full-time', 
      breaksNeededPerWeek: 5, 
      color: TEACHER_COLORS[colorIndex] 
    }]);
  };

  const addNewClass = () => {
    const newClassId = Math.random().toString(36).substr(2, 9);
    const colorIndex = classes.length % CLASS_COLORS.length;
    const className = `Class ${classes.length + 1}`;
    
    setClasses([...classes, { 
      id: newClassId, 
      name: className, 
      grade: 'Grade 1', 
      homeroomTeacherId: '', 
      assignments: [], 
      color: CLASS_COLORS[colorIndex] 
    }]);

    setTextbooks([...textbooks, {
      id: Math.random().toString(36).substr(2, 9),
      title: `Book: ${className}`,
      subject: 'General',
      gradeLevel: 'Grade 1',
      totalChapters: 12,
      totalPages: 100,
      currentPage: 0
    }]);
    setActiveClassTab(newClassId);
  };

  const toggleClassForFixed = (classId: string, fixedId: string) => {
    setFixedClasses(prev => prev.map(f => {
      if (f.id !== fixedId) return f;
      const currentIds = f.classIds || [];
      const newIds = currentIds.includes(classId) 
        ? currentIds.filter(id => id !== classId)
        : [...currentIds, classId];
      return { ...f, classIds: newIds, isSchoolWide: false };
    }));
  };

  const selectedFixed = fixedClasses.find(f => f.id === selectedFixedId);

  return (
    <div className="space-y-12 pb-40 animate-fadeIn">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Setup</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Manage school information</p>
        </div>
        <button
          onClick={onGenerate}
          className="gradient-primary text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
        >
          Generate Weekly Master
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staff & Classes Column */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">Staff</h3>
              <button onClick={addNewTeacher} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add</button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {teachers.map(t => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border-l-8 relative group" style={{ borderLeftColor: t.color }}>
                  <div className="flex justify-between items-center">
                    <input className="bg-transparent border-0 p-0 font-black text-slate-700 focus:ring-0 text-xs w-full" value={t.name} onChange={e => setTeachers(teachers.map(p => p.id === t.id ? {...p, name: e.target.value} : p))} />
                    <button type="button" onClick={(e) => deleteTeacher(t.id, e)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">Classes</h3>
              <button onClick={addNewClass} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add</button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {classes.map(c => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border-l-8 relative group" style={{ borderLeftColor: c.color }}>
                  <div className="flex justify-between items-center">
                    <input className="bg-transparent border-0 p-0 font-black text-slate-700 focus:ring-0 text-xs w-full" value={c.name} onChange={e => setClasses(classes.map(p => p.id === c.id ? {...p, name: e.target.value} : p))} />
                    <button type="button" onClick={(e) => deleteClass(c.id, e)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Subjects Section */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Subjects</h3>
            <button onClick={() => setSubjects([...subjects, { id: Math.random().toString(36).substr(2, 9), name: 'New Subject', frequencyPerWeek: 5, gradeLevels: ['Grade 1'] }])} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add</button>
          </div>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {subjects.map(s => (
              <div key={s.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group">
                <input className="bg-transparent border-0 p-0 font-black text-slate-700 focus:ring-0 text-xs flex-1" value={s.name} onChange={e => setSubjects(subjects.map(p => p.id === s.id ? {...p, name: e.target.value} : p))} />
                <div className="flex items-center gap-2">
                  <input type="number" className="w-10 bg-white border border-slate-200 rounded-lg text-center font-black text-[10px] py-1" value={s.frequencyPerWeek} onChange={e => setSubjects(subjects.map(p => p.id === s.id ? {...p, frequencyPerWeek: parseInt(e.target.value) || 0} : p))} />
                  <button type="button" onClick={(e) => deleteSubject(s.id, e)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Locked Times Section */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Locked Times</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Click grid to block</p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-6 gap-1 min-w-[200px]">
              <div className="h-4"></div>
              {['M','T','W','T','F'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-400 uppercase">{d}</div>)}
              {Array.from({length: totalPeriods}).map((_, p) => (
                <React.Fragment key={p}>
                  <div className="text-[7px] font-black text-slate-300 flex items-center justify-center">P{p+1}</div>
                  {Array.from({length: 5}).map((_, d) => {
                    const fixed = fixedClasses.find(f => f.dayOfWeek === d && f.period === p);
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          const existingIdx = fixedClasses.findIndex(f => f.dayOfWeek === d && f.period === p);
                          if (existingIdx > -1) {
                            setSelectedFixedId(fixedClasses[existingIdx].id);
                          } else {
                            const newId = Math.random().toString(36).substr(2, 9);
                            setFixedClasses([...fixedClasses, {
                              id: newId, name: 'Locked Slot', provider: 'School', dayOfWeek: d, period: p, classIds: [], isSchoolWide: true, color: BLOCK_COLORS[0].hex
                            }]);
                            setSelectedFixedId(newId);
                          }
                        }}
                        className={`h-7 rounded border transition-all ${
                          fixed ? 'ring-1 ring-slate-900 ring-offset-1 z-10' : 'bg-slate-50 border-transparent hover:border-slate-200'
                        }`}
                        style={fixed ? { backgroundColor: fixed.color || '#6366f1' } : {}}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {selectedFixed ? (
              <div className="p-5 bg-slate-50 rounded-2xl space-y-4 border border-slate-100 animate-fadeIn">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Edit Block</span>
                  <button onClick={() => setSelectedFixedId(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <input 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"
                  value={selectedFixed.name}
                  onChange={e => setFixedClasses(fixedClasses.map(f => f.id === selectedFixedId ? { ...f, name: e.target.value } : f))}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400">Global Lock</span>
                  <button 
                    onClick={() => setFixedClasses(fixedClasses.map(f => f.id === selectedFixedId ? { ...f, isSchoolWide: !f.isSchoolWide, classIds: !f.isSchoolWide ? [] : f.classIds } : f))}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${selectedFixed.isSchoolWide ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border'}`}
                  >
                    {selectedFixed.isSchoolWide ? 'All' : 'Selected'}
                  </button>
                </div>
                {!selectedFixed.isSchoolWide && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-slate-100">
                    {classes.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleClassForFixed(c.id, selectedFixed.id)}
                        className={`px-2 py-1 rounded text-[7px] font-black uppercase transition-all ${selectedFixed.classIds?.includes(c.id) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => { setFixedClasses(fixedClasses.filter(f => f.id !== selectedFixedId)); setSelectedFixedId(null); }} className="w-full py-2 bg-rose-50 text-rose-500 rounded-lg text-[8px] font-black uppercase hover:bg-rose-100">Delete Block</button>
              </div>
            ) : (
              <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Select slot to edit</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-800">Assign Staff</h3>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Pick a class and assign lessons.</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide justify-center">
          {classes.map(c => (
            <button key={c.id} onClick={() => setActiveClassTab(c.id)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeClassTab === c.id ? 'bg-[#0f172a] text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`} style={activeClassTab === c.id ? { borderBottom: `4px solid ${c.color}` } : {}}>{c.name}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map(sub => {
            const currentC = classes.find(c => c.id === activeClassTab);
            const assignment = currentC?.assignments.find(a => a.subjectId === sub.id);
            return (
              <div key={sub.id} className="p-6 bg-slate-50 rounded-[2.5rem] space-y-4 border border-transparent hover:border-slate-200 transition-all shadow-sm">
                <div className="text-center">
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{sub.name}</p>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase mt-1">{sub.frequencyPerWeek} p/w</p>
                </div>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black text-slate-700 outline-none shadow-inner" value={assignment?.teacherId || ''} onChange={e => handleAssignmentChange(activeClassTab, sub.id, e.target.value)}>
                  <option value="">No Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ScheduleForm;