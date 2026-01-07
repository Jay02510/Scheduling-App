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
  const [activeTab, setActiveTab] = useState<'staff' | 'classes' | 'subjects' | 'global'>('staff');
  const [detailView, setDetailView] = useState<{ type: 'teacher' | 'class', id: string } | null>(null);
  
  const [assignmentSub, setAssignmentSub] = useState('');
  const [assignmentTea, setAssignmentTea] = useState('');
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  const handleAddNewTeacher = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newT: Teacher = {
      id: newId,
      name: 'New Faculty',
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

  const toggleGlobalLock = (day: number, period: number) => {
    const existing = lockedSlots.find(l => l.dayOfWeek === day && l.period === period && l.isSchoolWide);
    if (existing) {
      setLockedSlots(lockedSlots.filter(l => l.id !== existing.id));
    } else {
      setLockedSlots([...lockedSlots, {
        id: Math.random().toString(36).substr(2, 9),
        name: 'MASTER LOCK',
        dayOfWeek: day,
        period: period,
        classIds: [],
        isSchoolWide: true
      }]);
    }
  };

  if (detailView?.type === 'class') {
    const cls = classes.find(c => c.id === detailView.id);
    if (!cls) return null;

    return (
      <div className="space-y-8 animate-fadeIn">
        <button onClick={() => setDetailView(null)} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">← Back to Registry</button>
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-10">
            <div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 block">Class Name</span>
              <input className="text-4xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full uppercase" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} />
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Course Assignments</h4>
              <div className="space-y-4">
                {cls.assignments?.map(a => (
                  <div key={a.subjectId} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group">
                    <div>
                      <p className="text-[12px] font-black text-slate-900 uppercase">{getSubjectName(a.subjectId)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getTeacherName(a.teacherId)}</p>
                    </div>
                    <button onClick={() => setClasses(classes.map(c => c.id === cls.id ? {...c, assignments: c.assignments.filter(as => as.subjectId !== a.subjectId)} : c))} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-rose-50 rounded-xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              {showAddAssignment ? (
                <div className="p-8 bg-[#0f172a] rounded-[2.5rem] space-y-5 animate-fadeIn">
                  <select className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 text-[11px] font-black outline-none" value={assignmentSub} onChange={e => setAssignmentSub(e.target.value)}>
                    <option value="" className="text-slate-900">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id} className="text-slate-900">{s.name}</option>)}
                  </select>
                  <select className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 text-[11px] font-black outline-none" value={assignmentTea} onChange={e => setAssignmentTea(e.target.value)}>
                    <option value="" className="text-slate-900">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name}</option>)}
                  </select>
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => setShowAddAssignment(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                    <button onClick={() => handleAddAssignment(cls.id)} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Assign</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddAssignment(true)} className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[11px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-400 transition-all">+ Link Faculty to Subject</button>
              )}
            </div>
          </div>
          <div className="bg-slate-50 p-10 rounded-[3rem] flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-[2rem] shadow-xl mb-6" style={{ backgroundColor: cls.color }}></div>
            <p className="text-slate-400 font-bold text-xs max-w-xs leading-relaxed">This class is currently set for {cls.grade}. AI will attempt to fill {subjects.reduce((sum, s) => sum + s.frequencyPerWeek, 0)} periods weekly.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">School Setup</h2>
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mt-1">Configure your institution</p>
        </div>
        <button onClick={onGenerate} className="gradient-primary text-white px-12 py-6 rounded-[2rem] shadow-2xl font-black text-[12px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Build Live Timetable</button>
      </div>

      <div className="flex bg-slate-100 p-2 rounded-[2rem] w-fit shadow-inner">
        {['staff', 'classes', 'subjects', 'global'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
            {t === 'global' ? 'Institutional Blocks' : t === 'staff' ? 'Faculty' : t}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 min-h-[500px]">
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.map(t => (
              <div key={t.id} onClick={() => setDetailView({ type: 'teacher', id: t.id })} className="p-8 bg-slate-50 rounded-[3rem] relative group border border-transparent hover:border-indigo-100 transition-all cursor-pointer">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl">{t.name}</h4>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleAddNewTeacher} className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-black text-[11px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-400 transition-all">+ Add Faculty Member</button>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map(c => (
              <div key={c.id} onClick={() => setDetailView({ type: 'class', id: c.id })} className="p-10 bg-slate-50 rounded-[3rem] cursor-pointer hover:shadow-2xl transition-all border-b-[12px]" style={{ borderBottomColor: c.color }}>
                <h4 className="font-black text-slate-900 text-2xl uppercase text-center">{c.name}</h4>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center mt-3">{c.grade}</p>
              </div>
            ))}
            <button onClick={handleAddNewClass} className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-black text-[11px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-400 transition-all">+ Register New Class</button>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(s => (
               <div key={s.id} className="p-8 bg-slate-50 rounded-3xl space-y-4">
                  <input className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 font-black text-slate-900 uppercase text-xs" value={s.name} onChange={e => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, name: e.target.value} : sub))} />
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Weekly Frequency</span>
                    <input type="number" className="w-12 bg-transparent text-right font-black text-indigo-600 outline-none" value={s.frequencyPerWeek} onChange={e => setSubjects(subjects.map(sub => sub.id === s.id ? {...sub, frequencyPerWeek: parseInt(e.target.value) || 0} : sub))} />
                  </div>
               </div>
            ))}
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-10 animate-fadeIn overflow-hidden">
            <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
              <p className="text-[11px] font-black text-blue-700 uppercase tracking-[0.2em] leading-relaxed">Institutional Blocks: These slots are locked school-wide. Subjects cannot be scheduled here. Perfect for Assembly, Recess, or Dismissal.</p>
            </div>
            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-6 gap-3 min-w-[700px]">
                <div className="h-12"></div>
                {['MON','TUE','WED','THUR','FRI'].map(d => <div key={d} className="text-center text-[11px] font-black text-slate-400 uppercase py-4">{d}</div>)}
                {Array.from({length: profile?.hours.totalPeriods || 8}).map((_, p) => (
                  <React.Fragment key={p}>
                    <div className="text-[11px] font-black text-slate-300 flex items-center justify-center uppercase">Period {p+1}</div>
                    {Array.from({length: 5}).map((_, d) => {
                      const isLocked = lockedSlots.some(l => l.dayOfWeek === d && l.period === p && l.isSchoolWide);
                      return (
                        <button key={d} onClick={() => toggleGlobalLock(d, p)} className={`h-20 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center p-3 gap-1 ${isLocked ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105 z-10' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-indigo-200 hover:text-indigo-400'}`}>
                          <svg className={`w-5 h-5 ${isLocked ? 'text-indigo-400' : 'text-slate-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          <span className="text-[8px] font-black uppercase tracking-tighter">{isLocked ? 'MASTER LOCK' : 'AVAILABLE'}</span>
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleForm;