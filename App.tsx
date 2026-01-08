
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolSchedule, SchoolProfile, SubjectConfig, ScheduleSlot } from './types';
import { generateWeeklyMaster } from './services/geminiService';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScheduleForm from './components/ScheduleForm';
import ScheduleViewer from './components/ScheduleViewer';
import TeacherView from './components/TeacherView';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error'; action?: () => void } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [navigationFocus, setNavigationFocus] = useState<{ id: string, type: 'teacher' | 'class' } | null>(null);

  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [lockedSlots, setLockedSlots] = useState<LockedSlot[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [schedule, setSchedule] = useState<SchoolSchedule | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setAuthLoading(true);
      if (u) {
        setUser(u);
        const cloudData = await fetchUserData(u.uid);
        if (cloudData && cloudData.profile) {
          setProfile(cloudData.profile);
          setTeachers(cloudData.teachers || []);
          setClasses(cloudData.classes || []);
          setTextbooks(cloudData.textbooks || []);
          setLockedSlots(cloudData.lockedSlots || []);
          setSubjects(cloudData.subjects || []);
          setSchedule(cloudData.schedule || null);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profile && !isLoading) {
      const dataToSave = {
        profile: { ...profile, teachers, classes, textbooks, lockedSlots, subjects },
        teachers, classes, textbooks, lockedSlots, subjects, schedule
      };
      const timeoutId = setTimeout(() => { saveUserData(user.uid, dataToSave); }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading, profile?.specialInstructions]);

  const handleOnboardingComplete = (newProfile: SchoolProfile) => {
    setProfile(newProfile);
    setTeachers(newProfile.teachers || []);
    setClasses(newProfile.classes || []);
    setLockedSlots(newProfile.lockedSlots || []);
    setSubjects(newProfile.subjects || []);
    setShowOnboarding(false);
    setActiveTab('home');
  };

  const handleEntityJump = (id: string, type: 'teacher' | 'class') => {
    setNavigationFocus({ id, type });
    setActiveTab(type === 'teacher' ? 'faculty' : 'homerooms');
  };

  const handleUpdateScheduleSlot = (updatedSlot: ScheduleSlot) => {
    const currentSchedule = schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } };
    const existingIdx = currentSchedule.weeklySlots.findIndex(s => s.day === updatedSlot.day && s.period === updatedSlot.period && s.classId === updatedSlot.classId);
    let newSlots = [...currentSchedule.weeklySlots];
    if (existingIdx > -1) {
      if (!updatedSlot.subjectId) newSlots.splice(existingIdx, 1);
      else newSlots[existingIdx] = updatedSlot;
    } else if (updatedSlot.subjectId) newSlots.push(updatedSlot);
    setSchedule({ ...currentSchedule, weeklySlots: newSlots });
  };

  const handleMoveScheduleSlot = (source: { day: number, period: number }, target: { day: number, period: number }, classId: string, isCopy: boolean = false) => {
    if (!schedule) return;
    const newSlots = [...schedule.weeklySlots];
    const sourceIdx = newSlots.findIndex(s => s.classId === classId && s.day === source.day && s.period === source.period);
    const targetIdx = newSlots.findIndex(s => s.classId === classId && s.day === target.day && s.period === target.period);
    if (sourceIdx > -1) {
      if (isCopy) {
        const clonedSlot = { ...newSlots[sourceIdx], id: Math.random().toString(36).substr(2, 9), day: target.day, period: target.period };
        if (targetIdx > -1) newSlots[targetIdx] = clonedSlot; else newSlots.push(clonedSlot);
      } else {
        if (targetIdx > -1) {
          const temp = { ...newSlots[sourceIdx], day: target.day, period: target.period };
          newSlots[sourceIdx] = { ...newSlots[targetIdx], day: source.day, period: source.period };
          newSlots[targetIdx] = temp;
        } else {
          newSlots[sourceIdx] = { ...newSlots[sourceIdx], day: target.day, period: target.period };
        }
      }
      setSchedule({ ...schedule, weeklySlots: newSlots });
    }
  };

  const handleFillScheduleSlots = (source: { day: number, period: number }, range: { startDay: number, endDay: number, startPeriod: number, endPeriod: number }, classId: string) => {
    if (!schedule) return;
    const sourceSlot = schedule.weeklySlots.find(s => s.classId === classId && s.day === source.day && s.period === source.period);
    if (!sourceSlot) return;
    let newSlots = [...schedule.weeklySlots];
    for (let d = range.startDay; d <= range.endDay; d++) {
      for (let p = range.startPeriod; p <= range.endPeriod; p++) {
        const isLocked = lockedSlots.some(l => l.dayOfWeek === d && l.period === p && (l.isSchoolWide || l.classIds.includes(classId)));
        if (isLocked) continue;
        const targetIdx = newSlots.findIndex(s => s.classId === classId && s.day === d && s.period === p);
        const filledSlot = { ...sourceSlot, id: Math.random().toString(36).substr(2, 9), day: d, period: p };
        if (targetIdx > -1) newSlots[targetIdx] = filledSlot; else newSlots.push(filledSlot);
      }
    }
    setSchedule({ ...schedule, weeklySlots: newSlots });
  };

  const handleMoveLockSlot = (source: { day: number, period: number }, target: { day: number, period: number }, isCopy: boolean = false) => {
    const newLocks = [...lockedSlots];
    const sourceIdx = newLocks.findIndex(l => l.dayOfWeek === source.day && l.period === source.period);
    const targetIdx = newLocks.findIndex(l => l.dayOfWeek === target.day && l.period === target.period);
    if (sourceIdx > -1) {
      if (isCopy) {
        const clonedLock = { ...newLocks[sourceIdx], id: Math.random().toString(36).substr(2, 9), dayOfWeek: target.day, period: target.period };
        if (targetIdx > -1) newLocks[targetIdx] = clonedLock; else newLocks.push(clonedLock);
      } else {
        if (targetIdx > -1) {
          const sD = { ...newLocks[sourceIdx] }; const tD = { ...newLocks[targetIdx] };
          newLocks[sourceIdx] = { ...tD, dayOfWeek: source.day, period: source.period };
          newLocks[targetIdx] = { ...sD, dayOfWeek: target.day, period: target.period };
        } else newLocks[sourceIdx] = { ...newLocks[sourceIdx], dayOfWeek: target.day, period: target.period };
      }
      setLockedSlots(newLocks);
    }
  };

  const handleFillLockSlots = (source: { day: number, period: number }, range: { startDay: number, endDay: number, startPeriod: number, endPeriod: number }) => {
    const sourceLock = lockedSlots.find(l => l.dayOfWeek === source.day && l.period === source.period);
    if (!sourceLock) return;
    let newLocks = [...lockedSlots];
    for (let d = range.startDay; d <= range.endDay; d++) {
      for (let p = range.startPeriod; p <= range.endPeriod; p++) {
        const targetIdx = newLocks.findIndex(l => l.dayOfWeek === d && l.period === p);
        const filledLock = { ...sourceLock, id: Math.random().toString(36).substr(2, 9), dayOfWeek: d, period: p };
        if (targetIdx > -1) newLocks[targetIdx] = filledLock; else newLocks.push(filledLock);
      }
    }
    setLockedSlots(newLocks);
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    setLoadingMsg("Optimization Engine is balancing institutional rhythms...");
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const slots = await generateWeeklyMaster(teachers, lockedSlots, classes, currentProfile);
      setSchedule(prev => ({ ...prev, weeklySlots: slots, quarterlyPlan: prev?.quarterlyPlan || { quarterName: 'Term 1', weeks: [] } }));
      setNotification({ msg: "Schedule Optimized Successfully", type: 'success', action: () => { setActiveTab('homerooms'); setNotification(null); } });
      setIsLoading(false);
    } catch (e: any) {
      setNotification({ msg: e.message || "Optimization failed.", type: 'error' });
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  if (!user) return <Auth />;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn space-y-12">
          <div className="w-24 h-24 border-[8px] border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-2xl"></div>
          <p className="text-[13px] font-black text-slate-900 uppercase tracking-[0.4em] animate-pulse">{loadingMsg}</p>
        </div>
      ) : (
        <>
          {activeTab === 'home' && <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} onJump={handleEntityJump} />}
          {activeTab === 'setup' && <ScheduleForm profile={profile} setProfile={setProfile} teachers={teachers} setTeachers={setTeachers} classes={classes} setClasses={setClasses} textbooks={textbooks} setTextbooks={setTextbooks} lockedSlots={lockedSlots} setLockedSlots={setLockedSlots} subjects={subjects} setSubjects={setSubjects} onGenerate={handleGenerateMaster} onMoveLock={handleMoveLockSlot} onFillLocks={handleFillLockSlots} schedule={schedule} onNavigate={setActiveTab} />}
          {activeTab === 'homerooms' && <ScheduleViewer schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} classes={classes} teachers={teachers} subjects={subjects} textbooks={textbooks} lockedSlots={lockedSlots} profile={profile} onGenerateRoadmap={() => {}} onUpdateSlot={handleUpdateScheduleSlot} onMoveSlot={handleMoveScheduleSlot} onFillSlots={handleFillScheduleSlots} onNavigate={setActiveTab} onJump={handleEntityJump} initialClassId={navigationFocus?.type === 'class' ? navigationFocus.id : undefined} />}
          {activeTab === 'faculty' && <TeacherView schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} teachers={teachers} classes={classes} subjects={subjects} lockedSlots={lockedSlots} profile={profile} initialTeacherId={navigationFocus?.type === 'teacher' ? navigationFocus.id : undefined} />}
          {activeTab === 'settings' && <Settings user={user} profile={profile} onReset={() => clearUserData(user.uid).then(() => window.location.reload())} onLogout={() => signOut(auth)} />}
        </>
      )}
    </Layout>
  );
};

export default App;
