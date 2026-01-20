
import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolSchedule, SchoolProfile, SubjectConfig, ScheduleSlot, Language, SchoolEvent } from './types';
import { generateWeeklyMaster, computeInputHash } from './services/geminiService';
import { TRANSLATIONS } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScheduleForm from './components/ScheduleForm';
import ScheduleViewer from './components/ScheduleViewer';
import TeacherView from './components/TeacherView';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import Auth from './components/Auth';
import CurriculumRoadmap from './components/CurriculumRoadmap';
import SchoolCalendar from './components/SchoolCalendar';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState<Language>('ko');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [lastInputHash, setLastInputHash] = useState<string>('');
  
  const [dirtyClassIds, setDirtyClassIds] = useState<Set<string>>(new Set());
  const [forceFullSync, setForceFullSync] = useState(false);

  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [lockedSlots, setLockedSlots] = useState<LockedSlot[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [schedule, setSchedule] = useState<SchoolSchedule | null>(null);
  const [navigationFocus, setNavigationFocus] = useState<{ id: string, type: 'teacher' | 'class' } | null>(null);

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setAuthLoading(true);
      if (u) {
        setUser(u);
        try {
          const cloudData = await fetchUserData(u.uid);
          if (cloudData && cloudData.profile) {
            setProfile(cloudData.profile);
            setTeachers(cloudData.teachers || []);
            setClasses(cloudData.classes || []);
            setTextbooks(cloudData.textbooks || []);
            setLockedSlots(cloudData.lockedSlots || []);
            setSubjects(cloudData.subjects || []);
            setSchedule(cloudData.schedule || null);
            setLastInputHash(cloudData.lastInputHash || '');
            if (cloudData.language) setLanguage(cloudData.language);
          }
        } catch (e) {
          console.error("Cloud fetch error:", e);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profile && !isLoading) {
      const dataToSave = {
        profile, teachers, classes, textbooks, lockedSlots, subjects, schedule, lastInputHash, language
      };
      const timeoutId = setTimeout(() => { saveUserData(user.uid, dataToSave); }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading, lastInputHash, language]);

  const markClassDirty = (classId: string) => {
    setDirtyClassIds(prev => new Set(prev).add(classId));
  };

  const handleUpdateClasses = (newClasses: ClassGroup[]) => {
    // Detect which classes changed assignments to mark them dirty
    newClasses.forEach((newCls, idx) => {
      const oldCls = classes[idx];
      if (oldCls && JSON.stringify(oldCls.assignments) !== JSON.stringify(newCls.assignments)) {
        markClassDirty(newCls.id);
      }
    });
    setClasses(newClasses);
  };

  const handleEntityJump = (id: string, type: 'teacher' | 'class') => {
    setNavigationFocus({ id, type });
    setActiveTab(type === 'teacher' ? 'faculty' : 'homerooms');
  };

  const handleMoveSlot = (source: { day: number, period: number }, target: { day: number, period: number }, classId: string, isCopy: boolean) => {
    if (!schedule) return;
    const sourceSlot = schedule.weeklySlots.find(s => s.day === source.day && s.period === source.period && s.classId === classId);
    if (!sourceSlot) return;

    const newSlots = schedule.weeklySlots.filter(s => !(s.day === target.day && s.period === target.period && s.classId === classId));
    
    if (!isCopy) {
      // Remove source
      const filtered = newSlots.filter(s => !(s.day === source.day && s.period === source.period && s.classId === classId));
      filtered.push({ ...sourceSlot, day: target.day, period: target.period, id: Math.random().toString(36).substr(2, 9), isManualOverride: true });
      setSchedule({ ...schedule, weeklySlots: filtered });
    } else {
      newSlots.push({ ...sourceSlot, day: target.day, period: target.period, id: Math.random().toString(36).substr(2, 9), isManualOverride: true });
      setSchedule({ ...schedule, weeklySlots: newSlots });
    }
  };

  const handleFillSlots = (source: { day: number, period: number }, range: { startDay: number, endDay: number, startPeriod: number, endPeriod: number }, classId: string) => {
    if (!schedule) return;
    const sourceSlot = schedule.weeklySlots.find(s => s.day === source.day && s.period === source.period && s.classId === classId);
    if (!sourceSlot) return;

    let updatedSlots = [...schedule.weeklySlots];
    for (let d = range.startDay; d <= range.endDay; d++) {
      for (let p = range.startPeriod; p <= range.endPeriod; p++) {
        if (d === source.day && p === source.period) continue;
        updatedSlots = updatedSlots.filter(s => !(s.day === d && s.period === p && s.classId === classId));
        updatedSlots.push({ ...sourceSlot, day: d, period: p, id: Math.random().toString(36).substr(2, 9), isManualOverride: true });
      }
    }
    setSchedule({ ...schedule, weeklySlots: updatedSlots });
  };

  const handleMoveLock = (source: { day: number, period: number }, target: { day: number, period: number }, isCopy: boolean) => {
    const sourceLock = lockedSlots.find(l => l.dayOfWeek === source.day && l.period === source.period);
    if (!sourceLock) return;

    let newLocks = lockedSlots.filter(l => !(l.dayOfWeek === target.day && l.period === target.period));
    if (!isCopy) {
      newLocks = newLocks.filter(l => !(l.dayOfWeek === source.day && l.period === source.period));
    }
    newLocks.push({ ...sourceLock, dayOfWeek: target.day, period: target.period, id: Math.random().toString(36).substr(2, 9) });
    setLockedSlots(newLocks);
  };

  const handleFillLocks = (source: { day: number, period: number }, range: { startDay: number, endDay: number, startPeriod: number, endPeriod: number }) => {
    const sourceLock = lockedSlots.find(l => l.dayOfWeek === source.day && l.period === source.period);
    if (!sourceLock) return;

    let updatedLocks = [...lockedSlots];
    for (let d = range.startDay; d <= range.endDay; d++) {
      for (let p = range.startPeriod; p <= range.endPeriod; p++) {
        if (d === source.day && p === source.period) continue;
        updatedLocks = updatedLocks.filter(l => !(l.dayOfWeek === d && l.period === p));
        updatedLocks.push({ ...sourceLock, dayOfWeek: d, period: p, id: Math.random().toString(36).substr(2, 9) });
      }
    }
    setLockedSlots(updatedLocks);
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    const currentInputState = { teachers, classes, lockedSlots, subjects, hours: profile.hours, special: profile.specialInstructions || "" };
    const currentHash = computeInputHash(currentInputState);
    
    if (currentHash === lastInputHash && !forceFullSync && dirtyClassIds.size === 0) {
      if (!window.confirm(t('confirmation_resync'))) return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setValidationIssues([]);
    
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const { slots, validation } = await generateWeeklyMaster(
        teachers, lockedSlots, classes, currentProfile, schedule?.weeklySlots || [],
        forceFullSync ? [] : Array.from(dirtyClassIds),
        (msg) => setLoadingMsg(msg)
      );
      
      setSchedule(prev => ({ ...prev, weeklySlots: slots, quarterlyPlan: prev?.quarterlyPlan || { quarterName: 'Term 1', weeks: [] } }));
      setLastInputHash(currentHash);
      setDirtyClassIds(new Set());
      setForceFullSync(false);
      if (validation.issues.length > 0) setValidationIssues(validation.issues);
    } catch (e: any) {
      setErrorMessage(`Infrastructure Sync Failure: ${e.message || "Parallel optimization failed."}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  if (!user) return <Auth />;
  if (!profile) return <Onboarding onComplete={(p) => { setProfile(p); setTeachers(p.teachers); setClasses(p.classes); setSubjects(p.subjects); setForceFullSync(true); }} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} language={language} setLanguage={setLanguage}>
      <div className="mb-8 no-print flex items-center justify-between bg-white border border-slate-200 p-4 rounded-[1.5rem] shadow-sm">
        <div className="flex items-center gap-3 ml-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dirtyClassIds.size === 0 && computeInputHash({ teachers, classes, lockedSlots, subjects, hours: profile.hours, special: profile.specialInstructions || "" }) === lastInputHash ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {dirtyClassIds.size > 0 
              ? `${dirtyClassIds.size} ${t('classes')} ${t('local_changes')}` 
              : (computeInputHash({ teachers, classes, lockedSlots, subjects, hours: profile.hours, special: profile.specialInstructions || "" }) === lastInputHash ? t('synchronized') : t('local_changes'))}
          </span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setForceFullSync(true); handleGenerateMaster(); }} className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">Force Global Re-Sync</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="relative">
             <div className="w-20 h-20 border-8 border-indigo-100 rounded-full"></div>
             <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-[14px] font-black text-slate-900 uppercase tracking-[0.4em]">{loadingMsg}</p>
        </div>
      ) : (
        <>
          {(errorMessage || validationIssues.length > 0) && (
            <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-[2rem] space-y-4 animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                <div><h4 className="font-black text-rose-900 uppercase text-xs">Sync Alert</h4><p className="text-rose-600 font-bold text-[10px] uppercase tracking-widest">{errorMessage || "Optimization conflicts detected."}</p></div>
              </div>
              <button onClick={() => { setErrorMessage(null); setValidationIssues([]); }} className="text-[9px] font-black uppercase text-slate-400">Dismiss</button>
            </div>
          )}
          {activeTab === 'home' && <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} onJump={handleEntityJump} language={language} />}
          
          {activeTab === 'setup' && (
            <ScheduleForm 
              profile={profile} setProfile={setProfile} 
              teachers={teachers} setTeachers={setTeachers} 
              classes={classes} setClasses={handleUpdateClasses} 
              textbooks={textbooks} setTextbooks={setTextbooks} 
              lockedSlots={lockedSlots} setLockedSlots={setLockedSlots} 
              subjects={subjects} setSubjects={setSubjects} 
              onGenerate={handleGenerateMaster} schedule={schedule} 
              onMoveLock={handleMoveLock} onFillLocks={handleFillLocks}
              onNavigate={setActiveTab} language={language} 
            />
          )}

          {activeTab === 'homerooms' && (
            <ScheduleViewer 
              schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} 
              classes={classes} teachers={teachers} subjects={subjects} textbooks={textbooks} 
              lockedSlots={lockedSlots} profile={profile} onGenerateRoadmap={() => {}} 
              onUpdateSlot={(slot) => {
                if (schedule) setSchedule({ ...schedule, weeklySlots: [...schedule.weeklySlots.filter(s => !(s.day === slot.day && s.period === slot.period && s.classId === slot.classId)), slot] });
              }}
              onMoveSlot={handleMoveSlot} onFillSlots={handleFillSlots}
              onNavigate={setActiveTab} onRegenerate={handleGenerateMaster} onJump={handleEntityJump} 
              initialClassId={navigationFocus?.type === 'class' ? navigationFocus.id : undefined} language={language} 
            />
          )}

          {activeTab === 'curriculum' && <CurriculumRoadmap textbooks={textbooks} onUpdateTextbooks={setTextbooks} subjects={subjects} classes={classes} language={language} />}
          
          {activeTab === 'calendar' && <SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => setProfile(p => p ? {...p, specialEvents: evs} : null)} />}

          {activeTab === 'faculty' && <TeacherView schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} teachers={teachers} classes={classes} subjects={subjects} lockedSlots={lockedSlots} profile={profile} initialTeacherId={navigationFocus?.type === 'teacher' ? navigationFocus.id : undefined} />}
          
          {activeTab === 'settings' && <Settings user={user} profile={profile} teachers={teachers} schedule={schedule} onReset={() => clearUserData(user.uid).then(() => window.location.reload())} onLogout={() => signOut(auth)} />}
        </>
      )}
    </Layout>
  );
};

export default App;
