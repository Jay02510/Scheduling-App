import React, { useState } from 'react';
import { SchoolProfile, Teacher, SubjectConfig, Textbook, ClassGroup, LockedSlot } from './types';
import { TEACHER_COLORS, CLASS_COLORS } from './constants';

interface OnboardingProps {
  onComplete: (profile: SchoolProfile) => void;
}

const BLOCK_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Slate', hex: '#475569' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Cyan', hex: '#06b6d4' }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [activeClassTab, setActiveClassTab] = useState<string>('');
  const [selectedLockId, setSelectedLockId] = useState<string | null>(null);

  const [profile, setProfile] = useState<SchoolProfile>(() => {
    const initialSubjects: SubjectConfig[] = [
      // Fix: Removed 'constraints' property which is not defined in SubjectConfig interface
      { id: 'sub-1', name: 'Mathematics', frequencyPerWeek: 5, gradeLevels: ['Grade 1'], textbookId: 'tb-1' },
      { id: 'sub-2', name: 'English', frequencyPerWeek: 5, gradeLevels: ['Grade 1'], textbookId: 'tb-2' }
    ];
    
    const initialTextbooks: Textbook[] = [
      { id: 'tb-1', title: 'Curriculum: Mathematics G1', subject: 'Mathematics', gradeLevel: 'Grade 1', totalChapters: 12, totalPages: 120 },
      { id: 'tb-2', title: 'Curriculum: English G1', subject: 'English', gradeLevel: 'Grade 1', totalChapters: 10, totalPages: 100 }
    ];

    return {
      name: '',
      hours: {
        startTime: '08:30',
        periodDuration: 45,
        totalPeriods: 8,
        lunchAfterPeriod: 4,
        recessAfterPeriod: 2,
        homeworkAfterPeriod: 7,
        dailyConfigs: Array.from({length: 5}).map((_, i) => ({ day: i, endTime: '15:30' })),
      },
      levels: [{ id: '1', name: 'Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'] }],
      terms: [{ id: '1', name: 'Term 1', startDate: '2024-09-02', endDate: '2024-12-18' }],
      subjects: initialSubjects,
      textbooks: initialTextbooks,
      teachers: [
        { id: 't-1', name: 'Lead Teacher A', role: 'homeroom', subjects: ['Mathematics'], maxDailyPeriods: 8, assignedClasses: [], employmentType: 'full-time', breaksNeededPerWeek: 5, color: TEACHER_COLORS[0] } as Teacher,
        { id: 't-2', name: 'Korean Teacher B', role: 'korean', subjects: ['English'], maxDailyPeriods: 8, assignedClasses: [], employmentType: 'full-time', breaksNeededPerWeek: 5, color: TEACHER_COLORS[1] } as Teacher
      ],
      classes: [
        { id: 'c-1', name: 'Class 1', grade: 'Grade 1', homeroomTeacherId: 't-1', koreanTeacherId: 't-2', assignments: [{ subjectId: 'sub-1', teacherId: 't-1' }, { subjectId: 'sub-2', teacherId: 't-2' }], color: CLASS_COLORS[0] } as ClassGroup
      ],
      lockedSlots: [],
      specialEvents: []
    } as SchoolProfile;
  });

  const nextStep = () => {
    if (step === 4 && activeClassTab === '') {
      setActiveClassTab(profile.classes[0]?.id || '');
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const addClass = () => {
    const newClassId = Math.random().toString(36).substr(2, 9);
    const className = `Class ${profile.classes.length + 1}`;
    
    const newClass: ClassGroup = {
      id: newClassId,
      name: className,
      grade: 'Grade 1',
      homeroomTeacherId: '',
      koreanTeacherId: '',
      assignments: [],
      color: CLASS_COLORS[profile.classes.length % CLASS_COLORS.length]
    };

    setProfile({ 
      ...profile, 
      classes: [...profile.classes, newClass]
    });
  };

  const addTeacher = () => {
    const newTeacher: Teacher = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      role: 'homeroom',
      subjects: [],
      maxDailyPeriods: profile.hours.totalPeriods,
      assignedClasses: [],
      employmentType: 'full-time',
      breaksNeededPerWeek: 5,
      color: TEACHER_COLORS[profile.teachers.length % TEACHER_COLORS.length]
    };
    setProfile({ ...profile, teachers: [...profile.teachers, newTeacher] });
  };

  const toggleClassForLock = (classId: string, lockId: string) => {
    setProfile(prev => ({
      ...prev,
      lockedSlots: prev.lockedSlots.map(l => {
        if (l.id !== lockId) return l;
        const currentIds = l.classIds || [];
        const newIds = currentIds.includes(classId) 
          ? currentIds.filter(id => id !== classId)
          : [...currentIds, classId];
        return { ...l, classIds: newIds, isSchoolWide: false };
      })
    }));
  };

  const handleAssignmentChange = (classId: string, subjectId: string, teacherId: string) => {
    setProfile(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === classId) {
          const filtered = c.assignments.filter(a => a.subjectId !== subjectId);
          if (teacherId === '') return { ...c, assignments: filtered };
          return { ...c, assignments: [...filtered, { subjectId, teacherId }] };
        }
        return c;
      })
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Institution Identity</h2>
              <p className="text-slate-500 mt-1 text-sm">Basic operational profile.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="col-span-full">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">School Name</span>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none"
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                />
              </label>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Periods</span>
                <input type="number" className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-black text-indigo-600 text-center outline-none" value={profile.hours.totalPeriods} onChange={e => setProfile({...profile, hours: {...profile.hours, totalPeriods: parseInt(e.target.value) || 0}})} />
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block">Lunch Break</span>
                <input type="number" className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-black text-indigo-600 text-center outline-none" value={profile.hours.lunchAfterPeriod} onChange={e => setProfile({...profile, hours: {...profile.hours, lunchAfterPeriod: parseInt(e.target.value) || 0}})} />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Classes</h2>
            <div className="space-y-3">
              {profile.classes.map((c, i) => (
                <div key={c.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 border shadow-sm" style={{ borderLeftColor: c.color, borderLeftWidth: '8px' }}>
                  <input className="w-full bg-transparent border-0 p-0 font-bold text-slate-800" value={c.name} onChange={e => setProfile({ ...profile, classes: profile.classes.map(cl => cl.id === c.id ? { ...cl, name: e.target.value } : cl) })} />
                </div>
              ))}
              <button onClick={addClass} className="w-full py-6 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">+ Add Class Group</button>
            </div>
          </div>
        );
      case 3:
        const selectedLock = profile.lockedSlots.find(l => l.id === selectedLockId);
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Locked Blocks</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="grid grid-cols-6 gap-2 min-w-[320px]">
                  <div className="h-4"></div>{['M','T','W','T','F'].map(d => <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase">{d}</div>)}
                  {Array.from({length: profile.hours.totalPeriods}).map((_, p) => (
                    <React.Fragment key={p}>
                      <div className="text-[9px] font-black text-slate-300 flex items-center justify-center">P{p+1}</div>
                      {Array.from({length: 5}).map((_, d) => {
                        const lock = profile.lockedSlots.find(l => l.dayOfWeek === d && l.period === p);
                        return (
                          <button key={d} onClick={() => {
                              const existing = profile.lockedSlots.find(l => l.dayOfWeek === d && l.period === p);
                              if (existing) setSelectedLockId(existing.id);
                              else {
                                const newId = Math.random().toString(36).substr(2, 9);
                                const nl: LockedSlot = { id: newId, name: 'Lock', dayOfWeek: d, period: p, classIds: [], isSchoolWide: true, color: BLOCK_COLORS[0].hex };
                                setProfile({...profile, lockedSlots: [...profile.lockedSlots, nl]});
                                setSelectedLockId(newId);
                              }
                            }} className={`h-10 rounded-lg border text-[7px] font-black uppercase ${lock ? (lock.id === selectedLockId ? 'ring-2 ring-black' : '') : 'bg-slate-50 hover:border-indigo-100'}`} style={lock ? { backgroundColor: lock.color, color: 'white' } : {}}>{lock ? lock.name : '+'}</button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {selectedLock ? (
                <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md space-y-5 animate-fadeIn">
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold" value={selectedLock.name} onChange={e => setProfile({...profile, lockedSlots: profile.lockedSlots.map(l => l.id === selectedLockId ? {...l, name: e.target.value} : l)})} />
                  <button onClick={() => { setProfile({...profile, lockedSlots: profile.lockedSlots.filter(l => l.id !== selectedLockId)}); setSelectedLockId(null); }} className="w-full py-2 bg-rose-50 text-rose-500 rounded-xl text-[9px] font-black uppercase">Delete Lock</button>
                </div>
              ) : <div className="h-40 flex items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-300 text-[9px] font-black uppercase">Select slot to lock</div>}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Staffing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {profile.teachers.map((t, i) => (
                <div key={t.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-4 border-l-8" style={{ borderLeftColor: t.color }}>
                  <input className="w-full bg-transparent border-0 p-0 font-black text-slate-800 focus:ring-0" placeholder="Teacher Name" value={t.name} onChange={e => setProfile({...profile, teachers: profile.teachers.map(tr => tr.id === t.id ? { ...tr, name: e.target.value } : tr)})} />
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold" value={t.role} onChange={e => setProfile({...profile, teachers: profile.teachers.map(tr => tr.id === t.id ? { ...tr, role: e.target.value as any } : tr)})}>
                    <option value="homeroom">Homeroom Lead</option>
                    <option value="korean">Korean Lead</option>
                    <option value="subject">Specialist</option>
                  </select>
                </div>
              ))}
              <button onClick={addTeacher} className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-widest">+ Add Staff</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-fadeIn max-w-full overflow-hidden h-full flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Lessons</h2>
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {profile.classes.map(c => (
                <button key={c.id} onClick={() => setActiveClassTab(c.id)} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border-b-4 ${activeClassTab === c.id ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-400'}`} style={activeClassTab === c.id ? { borderBottomColor: c.color } : { borderBottomColor: 'transparent' }}>{c.name}</button>
              ))}
            </div>
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar pb-20">
              {profile.subjects.map((sub) => {
                const cls = profile.classes.find(c => c.id === activeClassTab);
                const assignment = cls?.assignments.find(a => a.subjectId === sub.id);
                return (
                  <div key={sub.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row gap-6 items-center">
                    <span className="flex-1 font-black text-sm uppercase">{sub.name}</span>
                    <select className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-[11px] font-black" value={assignment?.teacherId || ''} onChange={(e) => handleAssignmentChange(activeClassTab, sub.id, e.target.value)}>
                      <option value="">Unassigned</option>
                      {profile.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center z-[100] p-6">
      <div className="bg-slate-50 w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[850px] border border-white/5">
        <div className="w-full md:w-64 bg-[#0f172a] p-10 text-white flex flex-col flex-shrink-0">
          <h1 className="text-xl font-black leading-tight tracking-tighter uppercase mb-10">EduPlanner<br/><span className="text-indigo-400">Builder</span></h1>
          <div className="space-y-6 flex-1">
            {[1, 2, 3, 4, 5].map(s => <div key={s} className={`flex items-center gap-3 transition-all ${step === s ? 'translate-x-1 opacity-100' : 'opacity-40'}`}><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${step === s ? 'bg-white text-indigo-600' : 'bg-white/5 text-white'}`}>{s}</div><span className="text-[9px] font-black uppercase tracking-widest">{s === 1 ? 'School' : s === 2 ? 'Classes' : s === 3 ? 'Locks' : s === 4 ? 'Faculty' : 'Lessons'}</span></div>)}
          </div>
        </div>
        <div className="flex-1 p-10 flex flex-col justify-between bg-slate-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto">{renderStep()}</div>
          <div className="mt-10 pt-6 flex justify-between items-center border-t border-slate-200">
            {step > 1 && <button onClick={prevStep} className="text-slate-400 font-black text-[9px] uppercase tracking-widest">← Back</button>}
            <button onClick={step === 5 ? () => onComplete(profile) : nextStep} className="px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl gradient-primary text-white ml-auto">{step === 5 ? 'Launch' : 'Proceed →'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;