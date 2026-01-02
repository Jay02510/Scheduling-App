import React, { useState } from 'react';
import { SchoolProfile, Teacher, SubjectConfig, Textbook, ClassGroup, FixedClass } from '../types';
import { TEACHER_COLORS, CLASS_COLORS } from '../constants';

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
  const [selectedFixedId, setSelectedFixedId] = useState<string | null>(null);

  const [profile, setProfile] = useState<SchoolProfile>(() => {
    const initialSubjects: SubjectConfig[] = [
      { id: 'sub-1', name: 'Mathematics', frequencyPerWeek: 5, gradeLevels: ['Grade 1'], textbookId: 'tb-1', constraints: { morningOnly: true } },
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
        { id: 't-1', name: 'Lead Teacher A', role: 'homeroom', subjects: ['Mathematics'], maxDailyPeriods: 8, assignedClasses: [], employmentType: 'full-time', breaksNeededPerWeek: 5, color: TEACHER_COLORS[0] },
        { id: 't-2', name: 'Korean Teacher B', role: 'korean', subjects: ['English'], maxDailyPeriods: 8, assignedClasses: [], employmentType: 'full-time', breaksNeededPerWeek: 5, color: TEACHER_COLORS[1] }
      ],
      classes: [
        { id: 'c-1', name: 'Class 1', grade: 'Grade 1', homeroomTeacherId: 't-1', koreanTeacherId: 't-2', assignments: [{ subjectId: 'sub-1', teacherId: 't-1' }, { subjectId: 'sub-2', teacherId: 't-2' }], color: CLASS_COLORS[0] }
      ],
      fixedClasses: [],
      specialEvents: []
    };
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

    const newTextbook: Textbook = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Curriculum Guide for ${className}`,
      subject: 'General',
      gradeLevel: 'Grade 1',
      totalChapters: 12,
      totalPages: 120,
      currentPage: 0
    };

    setProfile({ 
      ...profile, 
      classes: [...profile.classes, newClass],
      textbooks: [...profile.textbooks, newTextbook]
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

  const addSubject = () => {
    const subId = Math.random().toString(36).substr(2, 9);
    const tbId = Math.random().toString(36).substr(2, 9);
    const newSub: SubjectConfig = {
      id: subId,
      name: 'New Subject',
      frequencyPerWeek: 5,
      gradeLevels: ['Grade 1'],
      textbookId: tbId
    };
    const newTb: Textbook = {
      id: tbId,
      title: 'New Textbook Resource',
      subject: 'New Subject',
      gradeLevel: 'Grade 1',
      totalChapters: 10,
      totalPages: 100
    };
    setProfile({
      ...profile,
      subjects: [...profile.subjects, newSub],
      textbooks: [...profile.textbooks, newTb]
    });
  };

  const toggleClassForFixed = (classId: string, fixedId: string) => {
    setProfile(prev => ({
      ...prev,
      fixedClasses: prev.fixedClasses.map(f => {
        if (f.id !== fixedId) return f;
        const currentIds = f.classIds || [];
        const newIds = currentIds.includes(classId) 
          ? currentIds.filter(id => id !== classId)
          : [...currentIds, classId];
        return { ...f, classIds: newIds, isSchoolWide: false };
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

  const setLeadTeacher = (teacherId: string, classId: string, type: 'homeroom' | 'korean') => {
    setProfile(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        const field = type === 'homeroom' ? 'homeroomTeacherId' : 'koreanTeacherId';
        if (c[field] === teacherId) return { ...c, [field]: '' };
        if (c.id === classId) return { ...c, [field]: teacherId };
        return c;
      })
    }));
  };

  const handleGlobalSubjectUpdate = (subjectId: string, updates: Partial<SubjectConfig>) => {
    setProfile(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === subjectId ? { ...s, ...updates } : s)
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 1: School Identity</h2>
              <p className="text-slate-500 mt-1 text-sm">Define your institution's profile.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="col-span-full">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Institution Name</span>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-bold text-slate-900"
                  placeholder="e.g. Academy of Sciences"
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                />
              </label>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Academic Periods</span>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-600">Total per day:</span>
                  <input
                    type="number"
                    className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-black text-indigo-600 text-center outline-none"
                    value={profile.hours.totalPeriods}
                    onChange={e => setProfile({...profile, hours: {...profile.hours, totalPeriods: parseInt(e.target.value) || 0}})}
                  />
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block">Institutional Break</span>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-600">After Period:</span>
                  <input type="number" className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-black text-indigo-600 text-center outline-none" value={profile.hours.lunchAfterPeriod} onChange={e => setProfile({...profile, hours: {...profile.hours, lunchAfterPeriod: parseInt(e.target.value) || 0}})} />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 2: Class Registry</h2>
              <p className="text-slate-500 mt-1 text-sm">Create class groups. Textbooks are automatically generated.</p>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {profile.classes.map((c, i) => (
                <div key={c.id} className="bg-white p-4 rounded-2xl flex flex-wrap items-center gap-4 border-l-8 border-slate-100 shadow-sm" style={{ borderLeftColor: c.color }}>
                  <div 
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-base shadow-sm cursor-pointer"
                    style={{ backgroundColor: c.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <input 
                      className="w-full bg-transparent border-0 p-0 font-bold text-slate-800 focus:ring-0 placeholder:text-slate-300" 
                      value={c.name} 
                      onChange={e => setProfile({ ...profile, classes: profile.classes.map(cl => cl.id === c.id ? { ...cl, name: e.target.value } : cl) })}
                    />
                  </div>
                  <select 
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={c.grade}
                    onChange={e => setProfile({...profile, classes: profile.classes.map(cl => cl.id === c.id ? { ...cl, grade: e.target.value } : cl)})}
                  >
                    {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Kindergarten', 'Pre-K'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              ))}
              <button 
                onClick={addClass}
                className="w-full py-6 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50/50 transition-all flex flex-col items-center gap-1"
              >
                <span>+ Create Class Group</span>
              </button>
            </div>
          </div>
        );
      case 3:
        const selectedFixed = profile.fixedClasses.find(f => f.id === selectedFixedId);
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 3: Blocked Slots</h2>
              <p className="text-slate-500 mt-1 text-sm">Lock times for all groups or specific classes.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
                <div className="grid grid-cols-6 gap-2 min-w-[320px]">
                  <div className="h-4"></div>
                  {['M','T','W','T','F'].map(d => <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase">{d}</div>)}
                  {Array.from({length: profile.hours.totalPeriods}).map((_, p) => (
                    <React.Fragment key={p}>
                      <div className="text-[9px] font-black text-slate-300 flex items-center justify-center">P{p+1}</div>
                      {Array.from({length: 5}).map((_, d) => {
                        const fixed = profile.fixedClasses.find(f => f.dayOfWeek === d && f.period === p);
                        return (
                          <button
                            key={d}
                            onClick={() => {
                              const existingIdx = profile.fixedClasses.findIndex(f => f.dayOfWeek === d && f.period === p);
                              if (existingIdx > -1) {
                                setSelectedFixedId(profile.fixedClasses[existingIdx].id);
                              } else {
                                const newId = Math.random().toString(36).substr(2, 9);
                                setProfile({...profile, fixedClasses: [...profile.fixedClasses, {
                                  id: newId, name: 'Locked Slot', provider: 'School', dayOfWeek: d, period: p, classIds: [], isSchoolWide: true, color: BLOCK_COLORS[0].hex
                                }]});
                                setSelectedFixedId(newId);
                              }
                            }}
                            className={`h-10 rounded-lg border transition-all text-[7px] font-black uppercase flex flex-col items-center justify-center text-center px-0.5 overflow-hidden ${
                              fixed ? (fixed.id === selectedFixedId ? 'ring-2 ring-black z-10' : '') : 'bg-slate-50 border-transparent hover:border-indigo-100'
                            }`}
                            style={fixed ? { backgroundColor: fixed.color || '#6366f1', color: 'white', borderColor: 'transparent' } : {}}
                          >
                            <span className="truncate w-full">{fixed ? fixed.name : '+'}</span>
                            {fixed && fixed.isSchoolWide && <span className="text-[5px] opacity-50">Global</span>}
                            {fixed && !fixed.isSchoolWide && <span className="text-[5px] opacity-50">{fixed.classIds?.length} Groups</span>}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {selectedFixed ? (
                  <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md space-y-5 animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Lock Name</span>
                      <input 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 outline-none"
                        value={selectedFixed.name}
                        onChange={e => setProfile(prev => ({
                          ...prev,
                          fixedClasses: prev.fixedClasses.map(f => f.id === selectedFixedId ? { ...f, name: e.target.value } : f)
                        }))}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Target Classes</span>
                        <button 
                          onClick={() => setProfile(prev => ({
                            ...prev,
                            fixedClasses: prev.fixedClasses.map(f => f.id === selectedFixedId ? { ...f, isSchoolWide: !f.isSchoolWide, classIds: !f.isSchoolWide ? [] : f.classIds } : f)
                          }))}
                          className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${selectedFixed.isSchoolWide ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {selectedFixed.isSchoolWide ? 'All Classes' : 'Specific Only'}
                        </button>
                      </div>

                      {!selectedFixed.isSchoolWide && (
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          {profile.classes.map(c => {
                            const isSelected = selectedFixed.classIds?.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                onClick={() => toggleClassForFixed(c.id, selectedFixed.id)}
                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                          {(!selectedFixed.classIds || selectedFixed.classIds.length === 0) && (
                            <p className="text-[8px] font-bold text-rose-400 uppercase w-full text-center">Select at least one class</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Block Color</span>
                       <div className="flex flex-wrap gap-2">
                         {BLOCK_COLORS.map(c => (
                           <button 
                             key={c.hex} 
                             onClick={() => setProfile(prev => ({
                               ...prev,
                               fixedClasses: prev.fixedClasses.map(f => f.id === selectedFixedId ? { ...f, color: c.hex } : f)
                             }))}
                             className={`w-7 h-7 rounded-full border-2 transition-all ${selectedFixed.color === c.hex ? 'border-black scale-110' : 'border-transparent'}`}
                             style={{ backgroundColor: c.hex }}
                           />
                         ))}
                       </div>
                    </div>
                    <button onClick={() => {
                        setProfile(prev => ({ ...prev, fixedClasses: prev.fixedClasses.filter(f => f.id !== selectedFixedId) }));
                        setSelectedFixedId(null);
                    }} className="w-full py-2 bg-rose-50 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest mt-2 hover:bg-rose-100 transition-colors">Delete Block</button>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-300 text-center p-6">
                      <p className="text-[9px] font-black uppercase tracking-widest">Select a grid slot to add a block</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 4: Faculty Mapping</h2>
              <p className="text-slate-500 mt-1 text-sm">Assign leads per class. Unique colors help identification.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {profile.teachers.map((t, i) => {
                const homeroomClass = profile.classes.find(c => c.homeroomTeacherId === t.id);
                const koreanClass = profile.classes.find(c => c.koreanTeacherId === t.id);
                return (
                  <div key={t.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-5 transition-all hover:border-indigo-100 border-l-8" style={{ borderLeftColor: t.color }}>
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ backgroundColor: t.color }}>
                        {t.name ? t.name[0].toUpperCase() : '?'}
                      </div>
                      <div className="flex-1">
                        <input
                          className="w-full bg-transparent border-0 p-0 font-black text-slate-800 outline-none focus:ring-0 placeholder:text-slate-200"
                          placeholder="Staff Name"
                          value={t.name}
                          onChange={e => setProfile({...profile, teachers: profile.teachers.map(tr => tr.id === t.id ? { ...tr, name: e.target.value } : tr)})}
                        />
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            t.role === 'homeroom' ? 'bg-indigo-50 text-indigo-500' : 
                            t.role === 'korean' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'
                          }`}>
                            {t.role}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setProfile(p => ({...p, teachers: p.teachers.filter(ptr => ptr.id !== t.id)}))} className="text-slate-200 hover:text-rose-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Primary Role</span>
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold outline-none cursor-pointer"
                          value={t.role}
                          onChange={(e) => setProfile({...profile, teachers: profile.teachers.map(tr => tr.id === t.id ? { ...tr, role: e.target.value as any } : tr)})}
                        >
                          <option value="homeroom">Homeroom Lead</option>
                          <option value="korean">Korean Lead</option>
                          <option value="subject">Specialist</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Homeroom:</span>
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold outline-none cursor-pointer"
                          value={t.role === 'korean' ? (koreanClass?.id || '') : (homeroomClass?.id || '')}
                          disabled={t.role === 'subject'}
                          onChange={(e) => setLeadTeacher(t.id, e.target.value, t.role === 'korean' ? 'korean' : 'homeroom')}
                        >
                          <option value="">None</option>
                          {profile.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={addTeacher} className="p-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-400 transition-all flex flex-col items-center justify-center gap-3">
                + Add Staff
              </button>
            </div>
          </div>
        );
      case 5:
        const currentClass = profile.classes.find(c => c.id === activeClassTab);
        return (
          <div className="space-y-8 animate-fadeIn max-w-full">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 5: Lesson Allocation</h2>
                <p className="text-slate-500 mt-1 text-sm">Assign curricula for each group independently.</p>
              </div>
              <button 
                onClick={addSubject}
                className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2"
              >
                + New Subject
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {profile.classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveClassTab(c.id)}
                  className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-4 ${
                    activeClassTab === c.id ? 'bg-[#0f172a] text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-50 shadow-sm'
                  }`}
                  style={activeClassTab === c.id ? { borderBottomColor: c.color } : { borderBottomColor: 'transparent' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {currentClass && (
              <div className="space-y-4 pb-12 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {profile.subjects.map((sub) => {
                  const assignment = currentClass.assignments.find(a => a.subjectId === sub.id);
                  const isActive = !!assignment;
                  
                  return (
                    <div key={sub.id} className={`bg-white p-6 rounded-3xl border shadow-sm transition-all group ${isActive ? 'border-indigo-100 opacity-100' : 'border-slate-50 opacity-60 hover:opacity-100'}`}>
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-full md:w-1/4 space-y-1">
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={isActive}
                              onChange={() => handleAssignmentChange(currentClass.id, sub.id, isActive ? '' : (profile.teachers[0]?.id || ''))}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <input
                              className="w-full bg-transparent border-0 p-0 font-black text-sm text-slate-800 focus:ring-0"
                              value={sub.name}
                              onChange={(e) => handleGlobalSubjectUpdate(sub.id, { name: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="w-full md:w-1/4 flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Weekly:</span>
                          <input
                            type="number"
                            className="w-12 bg-slate-50 border border-slate-100 p-1 text-center font-black text-indigo-600 text-[10px] rounded-lg"
                            value={sub.frequencyPerWeek}
                            onChange={(e) => handleGlobalSubjectUpdate(sub.id, { frequencyPerWeek: parseInt(e.target.value) || 0 })}
                          />
                        </div>

                        <div className="w-full md:w-2/4 flex flex-col gap-2">
                          <select
                            className={`w-full border-0 rounded-xl px-4 py-3 text-[11px] font-black outline-none appearance-none cursor-pointer transition-colors ${isActive ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                            value={assignment?.teacherId || ''}
                            disabled={!isActive}
                            onChange={(e) => handleAssignmentChange(currentClass.id, sub.id, e.target.value)}
                          >
                            <option value="">No Lead Assigned</option>
                            {profile.teachers.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.role.toUpperCase()})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center z-[100] p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-50 w-full max-w-5xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[850px] border border-white/5 relative">
        <div className="w-full md:w-64 bg-[#0f172a] p-6 md:p-10 text-white flex flex-col flex-shrink-0 relative">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
             <div className="absolute top-[-20%] right-[-30%] w-[150%] h-[150%] gradient-primary blur-[80px] rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-10 relative z-10 flex flex-col h-full">
            <div>
              <h1 className="text-xl font-black leading-tight tracking-tighter uppercase">EduPlanner<br/><span className="text-indigo-400">Builder</span></h1>
            </div>
            <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {[1, 2, 3, 4, 5].map(s => {
                const isCurrent = step === s;
                const isPast = step > s;
                return (
                    <div key={s} className={`flex items-center gap-3 transition-all duration-300 ${isCurrent ? 'translate-x-1' : 'opacity-40'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isCurrent ? 'bg-white text-indigo-600 shadow-xl' : isPast ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white'}`}>
                        {isPast ? '✓' : s}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                          {s === 1 ? 'School' : s === 2 ? 'Classes' : s === 3 ? 'Blocks' : s === 4 ? 'Faculty' : 'Lesson Plan'}
                      </span>
                    </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-between bg-slate-50 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {renderStep()}
          </div>
          <div className="mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 border-t border-slate-200 flex-shrink-0 relative z-10">
            {step > 1 && (
              <button onClick={prevStep} className="text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-900 transition-all px-4 py-2">
                ← Back
              </button>
            )}
            <button 
              onClick={step === 5 ? () => onComplete(profile) : nextStep}
              className="w-full sm:w-auto px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl gradient-primary text-white transition-all hover:scale-105 active:scale-95 ml-auto"
            >
              {step === 5 ? 'Finalize Institution' : 'Proceed →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;