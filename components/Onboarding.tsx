
import React, { useState } from 'react';
import { SchoolProfile, Teacher, SubjectConfig, Textbook, ClassGroup, LockedSlot, ScheduleSlot } from '../types';
import { TEACHER_COLORS, CLASS_COLORS } from '../constants';

interface OnboardingProps {
  onComplete: (profile: SchoolProfile & { schedule?: any }) => void;
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
    hours: { startTime: '08:30', periodDuration: 45, totalPeriods: 8, lunchAfterPeriod: 4, recessAfterPeriod: 2, homeworkAfterPeriod: 8 },
    subjects: DEFAULT_SUBJECTS, 
    textbooks: [],
    teachers: [{ id: 't-1', name: 'Sarah Miller', role: 'homeroom', subjects: [], maxDailyPeriods: 8, breaksNeededPerWeek: 5, color: TEACHER_COLORS[0], assignedClasses: [], employmentType: 'Full-Time' }],
    classes: [{ id: 'c-1', name: 'Class 1A', grade: 'G1', homeroomTeacherId: 't-1', assignments: [], color: CLASS_COLORS[0] }],
    lockedSlots: [{ id: 'lock-lunch', name: 'Lunch Break', dayOfWeek: 0, period: 3, classIds: [], isSchoolWide: true }], 
    specialEvents: []
  });

  const startQuickDemo = () => {
    const demoTeachers: Teacher[] = [
      { id: 't-1', name: 'Dr. Aris (Math)', role: 'homeroom', subjects: ['sub-math'], maxDailyPeriods: 6, breaksNeededPerWeek: 5, color: TEACHER_COLORS[0], assignedClasses: ['c-1'], employmentType: 'Full-Time' },
      { id: 't-2', name: 'Prof. Kim (Sci)', role: 'subject', subjects: ['sub-sci', 'sub-mus'], maxDailyPeriods: 7, breaksNeededPerWeek: 4, color: TEACHER_COLORS[1], assignedClasses: [], employmentType: 'Full-Time' },
      { id: 't-3', name: 'Ms. Lopez (Eng)', role: 'homeroom', subjects: ['sub-eng'], maxDailyPeriods: 6, breaksNeededPerWeek: 5, color: TEACHER_COLORS[2], assignedClasses: ['c-2'], employmentType: 'Full-Time' },
      { id: 't-4', name: 'Coach Ben (PE)', role: 'specialist', subjects: ['sub-pe'], maxDailyPeriods: 8, breaksNeededPerWeek: 3, color: TEACHER_COLORS[3], assignedClasses: [], employmentType: 'Full-Time' }
    ];

    const demoClasses: ClassGroup[] = [
      { id: 'c-1', name: 'Grade 1A', grade: 'G1', homeroomTeacherId: 't-1', color: CLASS_COLORS[0], assignments: [{ subjectId: 'sub-math', teacherId: 't-1' }, { subjectId: 'sub-sci', teacherId: 't-2' }, { subjectId: 'sub-pe', teacherId: 't-4' }] },
      { id: 'c-2', name: 'Grade 1B', grade: 'G1', homeroomTeacherId: 't-3', color: CLASS_COLORS[1], assignments: [{ subjectId: 'sub-eng', teacherId: 't-3' }, { subjectId: 'sub-mus', teacherId: 't-2' }, { subjectId: 'sub-pe', teacherId: 't-4' }] }
    ];

    // Pre-populate mock schedule slots for the demo
    const mockSlots: ScheduleSlot[] = [
      { id: 'm1', day: 0, period: 0, classId: 'c-1', subjectId: 'sub-math', teacherId: 't-1' },
      { id: 'm2', day: 0, period: 1, classId: 'c-1', subjectId: 'sub-sci', teacherId: 't-2' },
      { id: 'm3', day: 0, period: 2, classId: 'c-1', subjectId: 'sub-pe', teacherId: 't-4' },
      { id: 'm4', day: 0, period: 0, classId: 'c-2', subjectId: 'sub-eng', teacherId: 't-3' },
      { id: 'm5', day: 0, period: 1, classId: 'c-2', subjectId: 'sub-mus', teacherId: 't-2' }
    ];

    const demoProfile: any = {
      ...profile,
      name: "Westside Academy (Interactive Demo)",
      teachers: demoTeachers,
      classes: demoClasses,
      schedule: { weeklySlots: mockSlots, quarterlyPlan: { quarterName: 'Term 1', weeks: [] } }
    };
    onComplete(demoProfile);
  };

  const next = () => { if (step === 4 && profile.classes.length > 0) setActiveClassId(profile.classes[0].id); setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col md:flex-row h-full max-h-[800px] overflow-hidden border border-white/10">
        <div className="w-full md:w-80 bg-[#0f172a] p-10 text-white flex flex-col justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase mb-2 leading-none text-glow-cyan">EduPlanner<br/><span className="text-indigo-400">Setup</span></h1>
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-2">Core OS Initialization</p>
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`flex items-center gap-4 transition-all ${step === s ? 'translate-x-1 opacity-100' : 'opacity-30'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${step === s ? 'bg-white text-indigo-600' : 'bg-white/10 text-white'}`}>{s}</div>
                <span className="text-[9px] font-black uppercase tracking-widest">{['School', 'Classes', 'Staff', 'Breaks', 'Logic'][s-1]}</span>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/5">
             <button onClick={startQuickDemo} className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2 group">
               Start Interactive Demo
               <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </button>
             <p className="text-[7px] text-slate-500 font-bold uppercase text-center mt-3 tracking-widest">Load 100% complete sample plan</p>
          </div>
        </div>

        <div className="flex-1 p-10 flex flex-col justify-between bg-slate-50 overflow-hidden">
          <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar space-y-8">
            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <header><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">School Information</h2></header>
                <div className="space-y-6">
                  <label className="block">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-2 ml-1">Official Name (No PII)</span>
                    <input className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Westside Academy" />
                  </label>
                  <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Standard Rhythm</span>
                      <p className="text-xs font-bold text-slate-300">8 Periods • 45m each</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/40 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step === 5 && (
              <div className="space-y-8 animate-fadeIn h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-lg mb-4">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Ready to Deploy</h2>
                <p className="text-slate-500 font-medium text-sm max-w-xs">Your core school infrastructure is initialized. Press the button to enter the dashboard.</p>
              </div>
            )}
            {/* ... other steps ... */}
            <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase">Configure steps 2-4 in the setup center later</div>
          </div>
          <div className="flex justify-between pt-10 border-t border-slate-200">
            {step > 1 && <button onClick={back} className="px-8 py-4 text-slate-400 font-black uppercase text-[9px] tracking-widest">Back</button>}
            <button onClick={step === 5 ? () => onComplete(profile) : next} className="px-12 py-4 gradient-primary text-white rounded-2xl font-black uppercase text-[10px] shadow-xl ml-auto tracking-widest">{step === 5 ? 'Launch Platform' : 'Continue'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
