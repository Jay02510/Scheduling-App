
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
  onGenerate, profile, teachers, setTeachers, classes, setClasses, textbooks, subjects, setSubjects, lockedSlots, setLockedSlots, schedule 
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'classes' | 'subjects' | 'global'>('staff');
  const [detailView, setDetailView] = useState<{ type: 'teacher' | 'class', id: string } | null>(null);
  
  const [assignmentSub, setAssignmentSub] = useState('');
  const [assignmentTea, setAssignmentTea] = useState('');
  const [assignmentBook, setAssignmentBook] = useState('');
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  const handleAddAssignment = (classId: string) => {
    if (!assignmentSub || !assignmentTea) return;
    setClasses(classes.map(c => {
      if (c.id === classId) {
        const filtered = (c.assignments || []).filter(a => a.subjectId !== assignmentSub);
        return {
          ...c,
          assignments: [...filtered, { subjectId: assignmentSub, teacherId: assignmentTea, textbookId: assignmentBook }]
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
        name: 'School Lock',
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
        <button onClick={() => setDetailView(null)} className="text-[10px] font-black uppercase text-slate-400">← Back</button>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <input className="text-3xl font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0 w-full" value={cls.name} onChange={e => setClasses(classes.map(c => c.id === cls.id ? {...c, name: e.target.value} : c))} />
              <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">{cls.grade}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Homeroom Assignments</h4>
              <div className="space-y-3">
                {cls.assignments?.map(a => (
                  <div key={a.subjectId} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group">
                    <div>
                      <p className="text-[11px] font-black text-slate-900 uppercase">{getSubjectName(a.subjectId)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{getTeacherName(a.teacherId)}</p>
                    </div>
                    <button onClick={() => setClasses(classes.map(c => c.id === cls.id ? {...c, assignments: c.assignments.filter(as => as.subjectId !== a.subjectId)} : c))} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              {showAddAssignment ? (
                <div className="p-6 bg-slate-900 rounded-[2rem] space-y-4">
                  <select className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-[10px] font-black" value={assignmentSub} onChange={e => setAssignmentSub(e.target.value)}>
                    <option value="" className="text-slate-900">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id} className="text-slate-900">{s.name}</option>)}
                  </select>
                  <select className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-[10px] font-black" value={assignmentTea} onChange={e => setAssignmentTea(e.target.value)}>
                    <option value="" className="text-slate-900">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddAssignment(false)} className="flex-1 py-3 text-[9px] font-black text-slate-400 uppercase">Cancel</button>
                    <button onClick={() => handleAddAssignment(cls.id)} className="flex-1 py-3 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase">Assign</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddAssignment(true)} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-[9px] font-black uppercase text-slate-400">+ Add Lesson</button>
              )}
            </div>
          </div>
          <div className="bg-slate-50 p-8 rounded-3xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Class Preview</h4>
            <div className="space-y-2">
              {Array.from({length: 5}).map((_, d) => (
                <div key={d} className="flex gap-1 h-8">
                  {Array.from({length: 8}).map((_, p) => (
                    <div key={p} className="flex-1 rounded bg-white border border-slate-200"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase">Setup</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Manage Global Resources</p>
        </div>
        <button onClick={onGenerate} className="gradient-primary text-white px-10 py-5 rounded-2xl shadow-xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all">Build School Timetable</button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit shadow-inner">
        {['staff', 'classes', 'subjects', 'global'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            {t === 'global' ? 'Global Schedule' : t}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 min-h-[500px]">
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map(t => (
              <div key={t.id} className="p-8 bg-slate-50 rounded-[2.5rem] relative group border border-transparent hover:border-indigo-100 transition-all">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-xl font-black shadow-xl" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">{t.name}</h4>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
            <button className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase">+ New Teacher</button>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(c => (
              <div key={c.id} onClick={() => setDetailView({ type: 'class', id: c.id })} className="p-8 bg-slate-50 rounded-[2.5rem] cursor-pointer hover:shadow-lg transition-all border-b-8" style={{ borderBottomColor: c.color }}>
                <h4 className="font-black text-slate-900 text-xl uppercase text-center">{c.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mt-2">{c.grade}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-8 max-w-full overflow-hidden">
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Institutional Master: Toggle slots to lock them for the entire school (Lunch, Recess, Assembly).</p>
            </div>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-2 min-w-[600px]">
                <div className="h-10"></div>
                {['MON','TUE','WED','THUR','FRI'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>)}
                {Array.from({length: profile?.hours.totalPeriods || 8}).map((_, p) => (
                  <React.Fragment key={p}>
                    <div className="text-[10px] font-black text-slate-300 flex items-center justify-center">P{p+1}</div>
                    {Array.from({length: 5}).map((_, d) => {
                      const isLocked = lockedSlots.some(l => l.dayOfWeek === d && l.period === p && l.isSchoolWide);
                      return (
                        <button key={d} onClick={() => toggleGlobalLock(d, p)} className={`h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-2 ${isLocked ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-indigo-200'}`}>
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
