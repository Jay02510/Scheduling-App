
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
  { id: 'sub-art', name: 'Fine Arts', frequencyPerWeek: 2, gradeLevels: ['G1'] }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [activeClassId, setActiveClassId] = useState('');

  const [profile, setProfile] = useState<SchoolProfile>({
    name: '',
    hours: { startTime: '08:30', periodDuration: 45, totalPeriods: 8, lunchAfterPeriod: 4 },
    subjects: DEFAULT_SUBJECTS,
    textbooks: [],
    teachers: [
      { id: 't-1', name: 'Lead Teacher', role: 'homeroom', subjects: [], maxDailyPeriods: 8, breaksNeededPerWeek: 5, color: TEACHER_COLORS[0], assignedClasses: [], employmentType: 'Full-Time' }
    ],
    classes: [
      { id: 'c-1', name: 'Grade 1A', grade: 'G1', homeroomTeacherId: 't-1', assignments: [], color: CLASS_COLORS[0] }
    ],
    lockedSlots: [],
    specialEvents: []
  });

  const next = () => {
    if (step === 3) {
      if (profile.classes.length > 0) {
        setActiveClassId(profile.classes[0].id);
      }
    }
    setStep(s => s + 1);
  };
  
  const back = () => setStep(s => s - 1);

  const addClass = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setProfile({
      ...profile,
      classes: [...profile.classes, { id, name: `Grade ${profile.classes.length + 1}B`, grade: 'G1', homeroomTeacherId: '', assignments: [], color: CLASS_COLORS[profile.classes.length % CLASS_COLORS.length] }]
    });
  };

  const addTeacher = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setProfile({
      ...profile,
      teachers: [...profile.teachers, { id, name: 'New Faculty', role: 'subject', subjects: [], maxDailyPeriods: 8, breaksNeededPerWeek: 5, color: TEACHER_COLORS[profile.teachers.length % TEACHER_COLORS.length], assignedClasses: [], employmentType: 'Full-Time' }]
    });
  };

  const handleAssignment = (classId: string, subjectId: string, teacherId: string) => {
    setProfile(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === classId) {
          const filtered = (c.assignments || []).filter(a => a.subjectId !== subjectId);
          if (!teacherId) return { ...c, assignments: filtered };
          return {
            ...c,
            assignments: [...filtered, { subjectId, teacherId }]
          };
        }
        return c;
      })
    }));
  };

  const isFormValid = () => {
    if (step === 1) return profile.name.length > 2;
    if (step === 2) return profile.classes.length > 0;
    if (step === 3) return profile.teachers.length > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-[100] p-4 md:p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[800px]">
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">EduPlanner</h1>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Setup Phase</p>
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`flex items-center gap-4 transition-all ${step === s ? 'translate-x-2 opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border-2 ${step === s ? 'bg-white text-indigo-600 border-white' : 'border-white/20'}`}>{s}</div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {s === 1 ? 'School' : s === 2 ? 'Groups' : s === 3 ? 'Staff' : 'Lessons'}
                </span>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">PRO ENGINE v2</div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-12 flex flex-col justify-between bg-slate-50 overflow-hidden">
          <div className="overflow-y-auto pr-4 custom-scrollbar">
            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-4xl font-black text-slate-900 uppercase">School Identity</h2>
                <div className="space-y-6">
                  <label className="block">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Institution Name</span>
                    <input className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Westview Primary" />
                  </label>
                  <div className="grid grid-cols-2 gap-6">
                    <label>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Daily Periods</span>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold" value={profile.hours.totalPeriods} onChange={e => setProfile({...profile, hours: {...profile.hours, totalPeriods: parseInt(e.target.value) || 1}})} />
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Lunch Period</span>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold" value={profile.hours.lunchAfterPeriod} onChange={e => setProfile({...profile, hours: {...profile.hours, lunchAfterPeriod: parseInt(e.target.value) || 1}})} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-4xl font-black text-slate-900 uppercase">Class Groups</h2>
                <div className="space-y-4">
                  {profile.classes.map((c) => (
                    <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-6 shadow-sm">
                      <div className="w-12 h-12 rounded-2xl shrink-0" style={{ backgroundColor: c.color }}></div>
                      <input className="flex-1 bg-transparent border-0 font-black text-slate-800 text-lg" value={c.name} onChange={e => setProfile({...profile, classes: profile.classes.map(cl => cl.id === c.id ? {...cl, name: e.target.value} : cl)})} />
                    </div>
                  ))}
                  <button onClick={addClass} className="w-full py-6 border-4 border-dashed border-indigo-100 rounded-[2.5rem] text-indigo-400 font-black text-[11px] uppercase tracking-widest">+ Register Class</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <h2 className="text-4xl font-black text-slate-900 uppercase">Staff Registry</h2>
                <div className="space-y-4">
                  {profile.teachers.map((t) => (
                    <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-6 shadow-sm">
                      <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: t.color }}>{t.name[0] || '?'}</div>
                      <input className="flex-1 bg-transparent border-0 font-black text-slate-800 text-lg" value={t.name} onChange={e => setProfile({...profile, teachers: profile.teachers.map(tr => tr.id === t.id ? {...tr, name: e.target.value} : tr)})} />
                    </div>
                  ))}
                  <button onClick={addTeacher} className="w-full py-6 border-4 border-dashed border-indigo-100 rounded-[2.5rem] text-indigo-400 font-black text-[11px] uppercase tracking-widest">+ Add Teacher</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-fadeIn h-full">
                <h2 className="text-4xl font-black text-slate-900 uppercase">Assignment Hub</h2>
                <div className="flex gap-2 overflow-x-auto pb-4 sticky top-0 bg-slate-50 z-10">
                  {profile.classes.map(c => (
                    <button key={c.id} onClick={() => setActiveClassId(c.id)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeClassId === c.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>{c.name}</button>
                  ))}
                </div>
                <div className="space-y-3 pb-20">
                  {profile.subjects.map(sub => {
                    const currentCls = profile.classes.find(cl => cl.id === activeClassId);
                    const currentAssignment = currentCls?.assignments.find(a => a.subjectId === sub.id);
                    return (
                      <div key={sub.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <span className="font-black text-slate-900 uppercase text-xs">{sub.name}</span>
                        <select className="bg-slate-50 border-0 rounded-xl px-4 py-2 font-bold text-[11px]" value={currentAssignment?.teacherId || ''} onChange={e => handleAssignment(activeClassId, sub.id, e.target.value)}>
                          <option value="">Unassigned</option>
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
            {step > 1 && <button onClick={back} className="px-10 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Back</button>}
            <button 
              disabled={!isFormValid()}
              onClick={step === 4 ? () => onComplete(profile) : next} 
              className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl ml-auto disabled:opacity-50"
            >
              {step === 4 ? 'Finish Setup' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
