import React, { useState } from 'react';
import { SchoolProfile, Teacher, SubjectConfig, Textbook, ClassGroup, LockedSlot } from '../types';
import { TEACHER_COLORS, CLASS_COLORS } from '../constants';

interface OnboardingProps {
  onComplete: (profile: SchoolProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<SchoolProfile>({
    name: '',
    hours: { startTime: '08:30', periodDuration: 45, totalPeriods: 8, lunchAfterPeriod: 4 },
    subjects: [
      { id: 's1', name: 'Math', frequencyPerWeek: 5, gradeLevels: ['G1'] },
      { id: 's2', name: 'English', frequencyPerWeek: 5, gradeLevels: ['G1'] }
    ],
    textbooks: [],
    teachers: [],
    classes: [],
    lockedSlots: [],
    specialEvents: []
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const addClass = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setProfile({
      ...profile,
      classes: [...profile.classes, { id, name: `Class ${profile.classes.length + 1}`, grade: 'G1', homeroomTeacherId: '', assignments: [], color: CLASS_COLORS[profile.classes.length % CLASS_COLORS.length] }]
    });
  };

  const addTeacher = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setProfile({
      ...profile,
      teachers: [...profile.teachers, { id, name: 'New Teacher', role: 'subject', subjects: [], maxDailyPeriods: 6, breaksNeededPerWeek: 5, color: TEACHER_COLORS[profile.teachers.length % TEACHER_COLORS.length], assignedClasses: [], employmentType: 'Full-Time' }]
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]">
        <div className="w-full md:w-64 bg-indigo-600 p-10 text-white flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter uppercase mb-10">School<br/>Planner</h1>
          <div className="space-y-6 flex-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`flex items-center gap-3 transition-opacity ${step === s ? 'opacity-100' : 'opacity-40'}`}>
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-black">{s}</div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {s === 1 ? 'Details' : s === 2 ? 'Classes' : s === s ? 'Staff' : 'Finish'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-12 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-8">
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900">Basic Info</h2>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase text-slate-400">School Name</span>
                    <input className="w-full mt-2 bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Sunnyvale Elementary" />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label>
                      <span className="text-[10px] font-black uppercase text-slate-400">Total Periods</span>
                      <input type="number" className="w-full mt-2 bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold outline-none" value={profile.hours.totalPeriods} onChange={e => setProfile({...profile, hours: {...profile.hours, totalPeriods: parseInt(e.target.value)}})} />
                    </label>
                    <label>
                      <span className="text-[10px] font-black uppercase text-slate-400">Lunch After Period</span>
                      <input type="number" className="w-full mt-2 bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold outline-none" value={profile.hours.lunchAfterPeriod} onChange={e => setProfile({...profile, hours: {...profile.hours, lunchAfterPeriod: parseInt(e.target.value)}})} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900">Classes</h2>
                <div className="grid grid-cols-1 gap-3">
                  {profile.classes.map((c, i) => (
                    <div key={c.id} className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: c.color }}></div>
                      <input className="bg-transparent border-0 font-bold flex-1 focus:ring-0" value={c.name} onChange={e => setProfile({...profile, classes: profile.classes.map(cl => cl.id === c.id ? {...cl, name: e.target.value} : cl)})} />
                    </div>
                  ))}
                  <button onClick={addClass} className="py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all">+ Add Class</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-3xl font-black text-slate-900">Staff</h2>
                <div className="grid grid-cols-1 gap-3">
                  {profile.teachers.map((t, i) => (
                    <div key={t.id} className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: t.color }}></div>
                      <input className="bg-transparent border-0 font-bold flex-1 focus:ring-0" value={t.name} onChange={e => setProfile({...profile, teachers: profile.teachers.map(tr => tr.id === t.id ? {...tr, name: e.target.value} : tr)})} />
                    </div>
                  ))}
                  <button onClick={addTeacher} className="py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-all">+ Add Teacher</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fadeIn text-center py-10">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900">Ready to go!</h2>
                <p className="text-slate-500 font-medium">We'll build your first schedule now. You can adjust details later.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-10">
            {step > 1 ? <button onClick={back} className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Back</button> : <div></div>}
            <button onClick={step === 4 ? () => onComplete(profile) : next} className="px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">
              {step === 4 ? 'Launch App' : 'Next Step'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;