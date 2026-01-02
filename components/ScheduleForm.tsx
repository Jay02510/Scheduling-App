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
  setProfile,
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

  const addNewTeacher = () => {
    const colorIndex = teachers.length % TEACHER_COLORS.length;
    setTeachers([...teachers, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: 'New Teacher', 
      role: 'homeroom', 
      subjects: [], 
      maxDailyPeriods: totalPeriods - 2, 
      assignedClasses: [], 
      employmentType: 'full-time', 
      breaksNeededPerWeek: 5, 
      color: TEACHER_COLORS[colorIndex] 
    }]);
  };

  const addNewClass = () => {
    const newClassId = Math.random().toString(36).substr(2, 9);
    const colorIndex = classes.length % CLASS_COLORS.length;
    setClasses([...classes, { 
      id: newClassId, 
      name: `Class ${classes.length + 1}`, 
      grade: 'Grade 1', 
      homeroomTeacherId: '', 
      assignments: [], 
      color: CLASS_COLORS[colorIndex] 
    }]);
  };

  const updateProfile = (updates: Partial<SchoolProfile>) => {
    if (profile) setProfile({ ...profile, ...updates });
  };

  return (
    <div className="space-y-12 pb-40 animate-fadeIn">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Institutional Setup</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Configure parameters for the AI Synthesis engine</p>
        </div>
        <button
          onClick={onGenerate}
          className="gradient-primary text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
        >
          Synthesize All Schedules
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Constraints Section */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 h-fit">
          <div className="space-y-4">
             <h3 className="text-lg font-black text-slate-800">Hours & Lunch</h3>
             <div className="space-y-4">
               <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Lunch Break Period</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs outline-none"
                    value={profile?.hours.lunchAfterPeriod}
                    onChange={(e) => {
                      if (profile) setProfile({...profile, hours: {...profile.hours, lunchAfterPeriod: parseInt(e.target.value)}});
                    }}
                  >
                    {Array.from({length: totalPeriods}).map((_, i) => (
                      <option key={i} value={i}>After Period {i + 1}</option>
                    ))}
                  </select>
                  <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-tight">This slot is globally blocked for all classes.</p>
               </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">Staff Constraints</h3>
              <button onClick={addNewTeacher} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add</button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {teachers.map(t => (
                <div key={t.id} className="p-5 bg-slate-50 rounded-3xl border-l-8 border-slate-200 space-y-3" style={{ borderLeftColor: t.color }}>
                  <input className="bg-transparent border-0 p-0 font-black text-slate-800 focus:ring-0 text-sm w-full" value={t.name} onChange={e => setTeachers(teachers.map(p => p.id === t.id ? {...p, name: e.target.value} : p))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[7px] font-black uppercase text-slate-400">Max Per/Day</label>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-black text-center" value={t.maxDailyPeriods} onChange={e => setTeachers(teachers.map(p => p.id === t.id ? {...p, maxDailyPeriods: parseInt(e.target.value) || 0} : p))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] font-black uppercase text-slate-400">Breaks/Week</label>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-black text-center" value={t.breaksNeededPerWeek} onChange={e => setTeachers(teachers.map(p => p.id === t.id ? {...p, breaksNeededPerWeek: parseInt(e.target.value) || 0} : p))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subjects & Textbooks */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Curricula</h3>
            <button onClick={() => setSubjects([...subjects, { id: Math.random().toString(36).substr(2, 9), name: 'New Subject', frequencyPerWeek: 5, gradeLevels: ['G1'] }])} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">+ Add</button>
          </div>
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {subjects.map(s => (
              <div key={s.id} className="p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-slate-200 transition-all space-y-3 shadow-sm">
                <input className="bg-transparent border-0 p-0 font-black text-slate-800 focus:ring-0 text-xs w-full" value={s.name} onChange={e => setSubjects(subjects.map(p => p.id === s.id ? {...p, name: e.target.value} : p))} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[7px] font-black uppercase text-slate-400">Freq/Wk</label>
                    <input type="number" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black" value={s.frequencyPerWeek} onChange={e => setSubjects(subjects.map(p => p.id === s.id ? {...p, frequencyPerWeek: parseInt(e.target.value) || 0} : p))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] font-black uppercase text-slate-400">Resource</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
                      value={s.textbookId || ''}
                      onChange={e => setSubjects(subjects.map(p => p.id === s.id ? { ...p, textbookId: e.target.value } : p))}
                    >
                      <option value="">None</option>
                      {textbooks.map(tb => <option key={tb.id} value={tb.id}>{tb.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Immutable Fixed Classes */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Locked Blocks</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fixed Institutional Events</p>
          </div>
          <div className="grid grid-cols-6 gap-1">
            <div className="h-4"></div>
            {['M','T','W','T','F'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-400">{d}</div>)}
            {Array.from({length: totalPeriods}).map((_, p) => (
              <React.Fragment key={p}>
                <div className="text-[7px] font-black text-slate-300 flex items-center justify-center">P{p+1}</div>
                {Array.from({length: 5}).map((_, d) => {
                  const fixed = fixedClasses.find(f => f.dayOfWeek === d && f.period === p);
                  const isLunch = p === profile?.hours.lunchAfterPeriod;
                  return (
                    <button
                      key={d}
                      disabled={isLunch}
                      onClick={() => {
                        const existingIdx = fixedClasses.findIndex(f => f.dayOfWeek === d && f.period === p);
                        if (existingIdx > -1) {
                          setSelectedFixedId(fixedClasses[existingIdx].id);
                        } else {
                          const newId = Math.random().toString(36).substr(2, 9);
                          setFixedClasses([...fixedClasses, {
                            id: newId, name: 'Activity', provider: 'School', dayOfWeek: d, period: p, classIds: [], isSchoolWide: true, color: '#f1f5f9'
                          }]);
                          setSelectedFixedId(newId);
                        }
                      }}
                      className={`h-9 rounded-xl border transition-all ${isLunch ? 'bg-slate-200 border-transparent cursor-not-allowed opacity-40' : (fixed ? 'ring-2 ring-slate-900 ring-offset-2' : 'bg-slate-50 border-transparent hover:border-slate-200')}`}
                      style={fixed ? { backgroundColor: fixed.color || '#cbd5e1' } : {}}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          {selectedFixedId && (
            <div className="p-6 bg-slate-900 rounded-[2rem] space-y-4 animate-fadeIn">
              <input 
                className="w-full bg-slate-800 border-0 rounded-xl px-4 py-3 text-white font-black text-xs outline-none" 
                placeholder="Name (e.g. GYM)" 
                value={fixedClasses.find(f => f.id === selectedFixedId)?.name || ''} 
                onChange={e => setFixedClasses(fixedClasses.map(f => f.id === selectedFixedId ? { ...f, name: e.target.value } : f))}
              />
              <div className="flex flex-wrap gap-2">
                 {BLOCK_COLORS.map(c => (
                   <button key={c.hex} onClick={() => setFixedClasses(fixedClasses.map(f => f.id === selectedFixedId ? {...f, color: c.hex} : f))} className="w-6 h-6 rounded-full border border-white/20" style={{backgroundColor: c.hex}} />
                 ))}
              </div>
              <button onClick={() => setSelectedFixedId(null)} className="w-full py-2 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Done</button>
            </div>
          )}
        </section>
      </div>

      <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
        <div className="text-center">
          <h3 className="text-2xl font-black text-slate-800">Faculty Assignments</h3>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Select class groups and define curriculum leads</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide justify-center">
          {classes.map(c => (
            <button key={c.id} onClick={() => setActiveClassTab(c.id)} className={`px-8 py-4 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeClassTab === c.id ? 'bg-[#0f172a] text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{c.name}</button>
          ))}
          <button onClick={addNewClass} className="px-8 py-4 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200 text-slate-400">+ New Group</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map(sub => {
            const currentC = classes.find(c => c.id === activeClassTab);
            const assignment = currentC?.assignments.find(a => a.subjectId === sub.id);
            return (
              <div key={sub.id} className="p-6 bg-slate-50 rounded-[2rem] space-y-4 border border-transparent hover:border-slate-200 transition-all shadow-sm">
                <div className="text-center">
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{sub.name}</p>
                </div>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black text-slate-700 outline-none shadow-inner" value={assignment?.teacherId || ''} onChange={e => handleAssignmentChange(activeClassTab, sub.id, e.target.value)}>
                  <option value="">No Teacher Assigned</option>
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