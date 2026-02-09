
import React, { useState } from 'react';
import { SchoolProfile, Teacher, SubjectConfig, Textbook, ClassGroup, LockedSlot } from '../types';
import { TEACHER_COLORS, CLASS_COLORS } from '../constants';

interface OnboardingProps {
  onComplete: (profile: SchoolProfile) => void;
}

const DEFAULT_SUBJECTS: SubjectConfig[] = [
  { id: 'sub-math', name: 'Mathematics', frequencyPerWeek: 5, gradeLevels: ['G1'] },
  { id: 'sub-eng', name: 'English', frequencyPerWeek: 5, gradeLevels: ['G1'] },
  { id: 'sub-sci', name: 'Science', frequencyPerWeek: 3, gradeLevels: ['G1'] },
  { id: 'sub-art', name: 'Art', frequencyPerWeek: 2, gradeLevels: ['G1'] },
  { id: 'sub-pe', name: 'Physical Ed', frequencyPerWeek: 2, gradeLevels: ['G1'] },
  { id: 'sub-mus', name: 'Music', frequencyPerWeek: 2, gradeLevels: ['G1'] }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [activeClassId, setActiveClassId] = useState('');

  const [profile, setProfile] = useState<SchoolProfile>({
    name: '',
    hours: { 
      startTime: '08:30', periodDuration: 45, totalPeriods: 8, lunchAfterPeriod: 4, recessAfterPeriod: 2, homeworkAfterPeriod: 8
    },
    subjects: DEFAULT_SUBJECTS, 
    textbooks: [],
    teachers: [
      { id: 't-1', name: 'Sarah Miller', role: 'homeroom', subjects: [], maxDailyPeriods: 8, breaksNeededPerWeek: 5, color: TEACHER_COLORS[0], assignedClasses: [], employmentType: 'Full-Time' }
    ],
    classes: [
      { id: 'c-1', name: 'Class 1A', grade: 'G1', homeroomTeacherId: 't-1', assignments: [], color: CLASS_COLORS[0] }
    ],
    lockedSlots: [
      { id: 'lock-lunch', name: 'Lunch Break', dayOfWeek: 0, period: 3, classIds: [], isSchoolWide: true }
    ], 
    specialEvents: []
  });

  const next = () => { 
    if (step === 4 && profile.classes.length > 0) setActiveClassId(profile.classes[0].id); 
    setStep(s => s + 1); 
  };
  const back = () => setStep(s => s - 1);

  const startQuickDemo = () => {
    const demoProfile: SchoolProfile = {
      ...profile,
      name: "Westside Academy (Demo)",
      teachers: [
        { id: 't-1', name: 'Dr. Aris', role: 'homeroom', subjects: ['sub-math'], maxDailyPeriods: 6, breaksNeededPerWeek: 5, color: TEACHER_COLORS[0], assignedClasses: ['c-1'], employmentType: 'Full-Time' },
        { id: 't-2', name: 'Prof. Kim', role: 'subject', subjects: ['sub-sci', 'sub-mus'], maxDailyPeriods: 7, breaksNeededPerWeek: 4, color: TEACHER_COLORS[1], assignedClasses: [], employmentType: 'Full-Time' },
        { id: 't-3', name: 'Ms. Lopez', role: 'homeroom', subjects: ['sub-eng'], maxDailyPeriods: 6, breaksNeededPerWeek: 5, color: TEACHER_COLORS[2], assignedClasses: ['c-2'], employmentType: 'Full-Time' },
        { id: 't-4', name: 'Coach Ben', role: 'specialist', subjects: ['sub-pe'], maxDailyPeriods: 8, breaksNeededPerWeek: 3, color: TEACHER_COLORS[3], assignedClasses: [], employmentType: 'Full-Time' }
      ],
      classes: [
        { id: 'c-1', name: 'Grade 1A', grade: 'G1', homeroomTeacherId: 't-1', color: CLASS_COLORS[0], assignments: [
          { subjectId: 'sub-math', teacherId: 't-1' }, { subjectId: 'sub-sci', teacherId: 't-2' }, { subjectId: 'sub-pe', teacherId: 't-4' }
        ]},
        { id: 'c-2', name: 'Grade 1B', grade: 'G1', homeroomTeacherId: 't-3', color: CLASS_COLORS[1], assignments: [
          { subjectId: 'sub-eng', teacherId: 't-3' }, { subjectId: 'sub-mus', teacherId: 't-2' }, { subjectId: 'sub-pe', teacherId: 't-4' }
        ]},
        { id: 'c-3', name: 'Grade 1C', grade: 'G1', homeroomTeacherId: 't-2', color: CLASS_COLORS[2], assignments: [
          { subjectId: 'sub-sci', teacherId: 't-2' }, { subjectId: 'sub-math', teacherId: 't-1' }, { subjectId: 'sub-pe', teacherId: 't-4' }
        ]}
      ],
      lockedSlots: [
        { id: 'l-1', name: 'LUNCH', dayOfWeek: 0, period: 3, isSchoolWide: true, classIds: [] },
        { id: 'l-2', name: 'LUNCH', dayOfWeek: 1, period: 3, isSchoolWide: true, classIds: [] },
        { id: 'l-3', name: 'LUNCH', dayOfWeek: 2, period: 3, isSchoolWide: true, classIds: [] },
        { id: 'l-4', name: 'LUNCH', dayOfWeek: 3, period: 3, isSchoolWide: true, classIds: [] },
        { id: 'l-5', name: 'LUNCH', dayOfWeek: 4, period: 3, isSchoolWide: true, classIds: [] }
      ]
    };
    onComplete(demoProfile);
  };

  const addClass = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setProfile({...profile, classes: [...profile.classes, { id, name: `Class ${profile.classes.length + 1}`, grade: 'G1', homeroomTeacherId: '', assignments: [], color: CLASS_COLORS[profile.classes.length % CLASS_COLORS.length] }]});
  };

  const addTeacher = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setProfile({...profile, teachers: [...profile.teachers, { id, name: 'New Teacher', role: 'subject', subjects: [], maxDailyPeriods: 8, breaksNeededPerWeek: 5, color: TEACHER_COLORS[profile.teachers.length % TEACHER_COLORS.length], assignedClasses: [], employmentType: 'Full-Time' }]});
  };

  const handleAssignment = (classId: string, subjectId: string, teacherId: string) => {
    setProfile(prev => ({
      ...prev, classes: prev.classes.map(c => {
        if (c.id === classId) {
          const filter = (c.assignments || []).filter(a => a.subjectId !== subjectId);
          return { ...c, assignments: teacherId ? [...filter, { subjectId, teacherId }] : filter };
        } return c;
      })
    }));
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col md:flex-row h-full max-h-[800px] overflow-hidden border border-white/10">
        <div className="w-full md:w-80 bg-[#0f172a] p-10 text-white flex flex-col justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase mb-2 leading-none">EduPlanner<br/><span className="text-indigo-400">Setup</span></h1>
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-2">Getting Started</p>
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`flex items-center gap-4 transition-all ${step === s ? 'translate-x-1 opacity-100' : 'opacity-30'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${step === s ? 'bg-white text-indigo-600' : 'bg-white/10 text-white'}`}>{s}</div>
                <span className="text-[9px] font-black uppercase tracking-widest">{['School Info', 'Classes', 'Teachers', 'Break Times', 'Lessons'][s-1]}</span>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/5">
             <button 
              onClick={startQuickDemo}
              className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group"
             >
               Quick Start Demo
               <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </button>
             <p className="text-[7px] text-slate-500 font-bold uppercase text-center mt-3 tracking-widest">Populate with sample school data</p>
          </div>
        </div>

        <div className="flex-1 p-10 flex flex-col justify-between bg-slate-50 overflow-hidden">
          <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar space-y-8">
            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <header><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">School Information</h2></header>
                <div className="space-y-6">
                  <label className="block">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-2 ml-1">School Name</span>
                    <input className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="My Awesome School" />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
                      <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">Lessons per Day</span>
                      <input type="number" className="bg-transparent border-0 font-black text-2xl text-white p-0 outline-none w-full" value={profile.hours.totalPeriods} onChange={e => setProfile({...profile, hours: {...profile.hours, totalPeriods: parseInt(e.target.value) || 8}})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Your Classes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.classes.map(c => (
                    <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                      <input className="flex-1 bg-transparent border-0 font-black text-slate-800 text-sm uppercase" value={c.name} onChange={e => setProfile({...profile, classes: profile.classes.map(cl => cl.id === c.id ? {...cl, name: e.target.value} : cl)})} />
                    </div>
                  ))}
                  <button onClick={addClass} className="p-6 border-2 border-dashed border-indigo-100 rounded-3xl text-indigo-400 font-black text-[10px] uppercase">+ Add Class</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Your Teachers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.teachers.map(t => (
                    <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 text-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                      <input className="w-full bg-transparent border-0 font-black text-slate-800 text-xs text-center" value={t.name} onChange={e => setProfile({...profile, teachers: profile.teachers.map(tr => tr.id === t.id ? {...tr, name: e.target.value} : tr)})} />
                    </div>
                  ))}
                  <button onClick={addTeacher} className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase">+ Add Teacher</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Break Times</h2>
                <p className="text-slate-500 text-sm">You can set specific break times or assembly times later in the settings.</p>
                <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 text-center">
                   <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Advanced Scheduling Available Later</p>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 animate-fadeIn h-full flex flex-col">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Assign Subjects</h2>
                <div className="flex gap-2 overflow-x-auto pb-4 sticky top-0 bg-slate-50 z-10">
                  {profile.classes.map(c => (
                    <button key={c.id} onClick={() => setActiveClassId(c.id)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeClassId === c.id ? 'bg-[#0f172a] text-white shadow-xl' : 'bg-white text-slate-400'}`}>{c.name}</button>
                  ))}
                </div>
                <div className="space-y-3 pb-10">
                  {profile.subjects.map(sub => {
                    const assign = profile.classes.find(c => c.id === activeClassId)?.assignments.find(a => a.subjectId === sub.id);
                    return (
                      <div key={sub.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <span className="font-black text-slate-900 uppercase text-[10px]">{sub.name}</span>
                        <select className="bg-slate-50 border-0 rounded-xl px-4 py-2 font-bold text-[10px]" value={assign?.teacherId || ''} onChange={e => handleAssignment(activeClassId, sub.id, e.target.value)}>
                          <option value="">No Teacher</option>
                          {profile.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between pt-10 border-t border-slate-200">
            {step > 1 && <button onClick={back} className="px-8 py-4 text-slate-400 font-black uppercase text-[9px] tracking-widest">Back</button>}
            <button onClick={step === 5 ? () => onComplete(profile) : next} className="px-12 py-4 gradient-primary text-white rounded-2xl font-black uppercase text-[10px] shadow-xl ml-auto tracking-widest">{step === 5 ? 'Create My Plan' : 'Continue'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
