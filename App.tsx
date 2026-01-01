import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, FixedClass, SchoolSchedule, SchoolProfile, SubjectConfig } from './types';
import { generateSchedule } from './services/geminiService';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScheduleForm from './components/ScheduleForm';
import ScheduleViewer from './components/ScheduleViewer';
import TeacherView from './components/TeacherView';
import Onboarding from './components/Onboarding';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ResourcePlanner from './components/ResourcePlanner';
import SchoolCalendar from './components/SchoolCalendar';
import Settings from './components/Settings';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [timetableMode, setTimetableMode] = useState<'school' | 'staff'>('school');
  
  const syncLocked = useRef(false);
  const initialLoadDone = useRef(false);
  const syncTimeoutRef = useRef<number | null>(null);

  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [fixedClasses, setFixedClasses] = useState<FixedClass[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [schedule, setSchedule] = useState<SchoolSchedule | null>(null);

  const loadingMessages = [
    "Crunching curriculum data...",
    "Balancing teacher workloads...",
    "Mapping textbook page targets...",
    "Adjusting for red days and holidays...",
    "Finalizing quarterly roadmap...",
    "Almost there - crafting the master view..."
  ];

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => window.clearInterval(interval);
  }, [isLoading]);

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
          setFixedClasses(cloudData.fixedClasses || []);
          setSubjects(cloudData.subjects || []);
          setSchedule(cloudData.schedule || null);
          setShowOnboarding(false);
          initialLoadDone.current = true;
        } else {
          setShowOnboarding(true);
          initialLoadDone.current = false;
        }
      } else {
        setUser(null);
        initialLoadDone.current = false;
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (syncLocked.current || !user || !profile || !initialLoadDone.current) return;
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = window.setTimeout(async () => {
      if (syncLocked.current || !user) return;
      try {
        await saveUserData(user.uid, { profile, teachers, textbooks, classes, fixedClasses, subjects, schedule });
      } catch (e) {
        console.warn("Sync error");
      }
    }, 2000);

    return () => { if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current); };
  }, [profile, teachers, textbooks, classes, fixedClasses, subjects, schedule, user]);

  const handleOnboardingComplete = async (newProfile: SchoolProfile) => {
    if (!user) return;
    setIsLoading(true);
    const state = {
      profile: { ...newProfile, specialEvents: [] },
      teachers: newProfile.teachers,
      classes: newProfile.classes,
      fixedClasses: newProfile.fixedClasses,
      textbooks: newProfile.textbooks,
      subjects: newProfile.subjects,
      schedule: null
    };
    setProfile(state.profile);
    setTeachers(state.teachers);
    setClasses(state.classes);
    setFixedClasses(state.fixedClasses);
    setTextbooks(state.textbooks);
    setSubjects(state.subjects);
    await saveUserData(user.uid, state);
    initialLoadDone.current = true;
    setShowOnboarding(false);
    setIsLoading(false);
    setActiveTab('home');
  };

  const resetSystem = async () => {
    if (!user) return;
    if (!confirm("Delete all school data? This cannot be undone.")) return;
    syncLocked.current = true;
    initialLoadDone.current = false;
    setIsLoading(true);
    try {
      await clearUserData(user.uid);
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      alert("Reset failed");
      syncLocked.current = false;
      setIsLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    try {
      const generated = await generateSchedule(teachers, textbooks, fixedClasses, classes, profile);
      setSchedule(generated);
      await saveUserData(user.uid, { profile, teachers, classes, textbooks, fixedClasses, subjects, schedule: generated });
      setActiveTab('timetable');
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Scheduling error. The server might be busy or your constraints are too complex.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return null;
  if (!user) return <Auth />;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fadeIn">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center space-y-3 mt-10">
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse-soft">
              {loadingMessages[loadingStep]}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Please wait while Gemini synthesizes your data
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home': return <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} />;
      case 'setup': return <ScheduleForm profile={profile} teachers={teachers} setTeachers={setTeachers} classes={classes} setClasses={setClasses} textbooks={textbooks} setTextbooks={setTextbooks} fixedClasses={fixedClasses} setFixedClasses={setFixedClasses} subjects={subjects} setSubjects={setSubjects} onGenerate={handleGenerateSchedule} />;
      case 'planner': return <div className="space-y-16 pb-20"><ResourcePlanner textbooks={textbooks} onUpdate={setTextbooks} profile={profile} /><div className="h-px bg-slate-200 w-full"></div><SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => profile && setProfile({...profile, specialEvents: evs})} /></div>;
      case 'timetable': return !schedule ? <div className="text-center py-40">No schedule. Create one in setup.</div> : <div className="space-y-8"><div className="flex justify-center bg-slate-100 p-1 rounded-xl w-fit mx-auto"><button onClick={() => setTimetableMode('school')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${timetableMode === 'school' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Classes</button><button onClick={() => setTimetableMode('staff')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${timetableMode === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Staff</button></div>{timetableMode === 'school' ? <ScheduleViewer schedule={schedule} classes={classes} teachers={teachers} profile={profile} /> : <TeacherView schedule={schedule} teachers={teachers} classes={classes} profile={profile} />}</div>;
      case 'insights': return schedule && profile ? <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} /> : <div className="text-center py-40">Create a schedule to see stats.</div>;
      case 'settings': return <Settings user={user} profile={profile} onReset={resetSystem} onLogout={() => signOut(auth)} />;
      default: return <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} />;
    }
  };

  return <><>{showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}</><Layout activeTab={activeTab} setActiveTab={setActiveTab}>{renderContent()}</Layout></>;
};

export default App;