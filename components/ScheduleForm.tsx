
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
    if (confirm("Delete this teacher? This will clear their assignments.")) {
      const updatedTeachers = teachers.filter(t => t.id !== id);
      setTeachers(updatedTeachers);
      setClasses(classes.map(c => ({
        ...c,
        homeroomTeacherId: c.homeroomTeacherId === id ? '' : c.homeroomTeacherId,
        koreanTeacherId: c.koreanTeacherId === id ? '' : c.koreanTeacherId,
        assignments: c.assignments.filter(a => a.teacherId !== id)
      })));
    }
  };

  const deleteClass = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this class?")) {
      const updatedClasses = classes.filter(c => c.id !== id);
      setClasses(updatedClasses);
      if (activeClassTab === id) {
        setActiveClassTab(updatedClasses[0]?.id || '');
      }
    }
  };

  const deleteSubject = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this subject? It will be removed from all classes.")) {
      const updatedSubjects = subjects.filter(s => s.id !== id);
      setSubjects(updatedSubjects);
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
      koreanTeacherId: '', 
      assignments: [], 
      color: CLASS_COLORS[colorIndex] 
    }]);

    setTextbooks([...textbooks, {
      id: Math.random().toString(36).substr(2, 9),
      title: `Book for ${className}`,
      subject: 'General',
      gradeLevel: 'Grade 1',
      totalChapters: 12,
      totalPages: 100,
      currentPage: 0
    }]);
    setActiveClassTab(newClassId);
  };

  return (
    <div className="space-y-12 pb-40 animate-fadeIn">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Setup</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Manage your school information</p>
        </div>
        <button
          onClick={onGenerate}
          className="gradient-primary text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
        >
          Generate Schedule
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teachers */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Staff</h3>
            <button onClick={addNewTeacher} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add</button>
          </div>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {teachers.map(t => (
              <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border-l-8 transition-all group" style={{ borderLeftColor: t.color }}>
                <div className="flex justify-between items-center mb-1">
                  <input className="bg-transparent border-0 p-0 font-black text-slate-700 focus:ring-0 text-xs w-full" value={t.name} onChange={e => setTeachers(teachers.map(p => p.id === t.id ? {...p, name: e.target.value} : p))} />
                  <button onClick={(e) => deleteTeacher(t.id, e)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex gap-2 mt-1">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></div>
                   <span className="text-[8px] font-black uppercase text-slate-400">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Classes */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Classes</h3>
            <button onClick={addNewClass} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add</button>
          </div>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {classes.map(c => (
              <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border-l-8 transition-all group" style={{ borderLeftColor: c.color }}>
                <div className="flex justify-between items-center mb-1">
                  <input className="bg-transparent border-0 p-0 font-black text-slate-700 focus:ring-0 text-xs w-full" value={c.name} onChange={e => setClasses(classes.map(p => p.id === c.id ? {...p, name: e.target.value} : p))} />
                  <button onClick={(e) => deleteClass(c.id, e)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <select className="mt-2 w-full bg-white border border-slate-200 rounded-lg text-[9px] font-bold py-1 px-2 outline-none" value={c.homeroomTeacherId} onChange={e => setClasses(classes.map(p => p.id === c.id ? {...p, homeroomTeacherId: e.target.value} : p))}>
                  <option value="">No Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Subjects */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Subjects</h3>
            <button onClick={() => setSubjects([...subjects, { id: Math.random().toString(36).substr(2, 9), name: 'New Subject', frequencyPerWeek: 5, gradeLevels: ['Grade 1'] }])} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add</button>
          </div>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {subjects.map(s => (
              <div key={s.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group">
                <input className="bg-transparent border-0 p-0 font-black text-slate-700 focus:ring-0 text-xs flex-1" value={s.name} onChange={e => setSubjects(subjects.map(p => p.id === s.id ? {...p, name: e.target.value} : p))} />
                <div className="flex items-center gap-2">
                  <input type="number" className="w-10 bg-white border border-slate-200 rounded-lg text-center font-black text-[10px] py-1" value={s.frequencyPerWeek} onChange={e => setSubjects(subjects.map(p => p.id === s.id ? {...p, frequencyPerWeek: parseInt(e.target.value) || 0} : p))} />
                  <button onClick={(e) => deleteSubject(s.id, e)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-800">Assign Teachers</h3>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Assign staff to subjects for each class.</p>
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
                  <option value="">Unassigned</option>
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
