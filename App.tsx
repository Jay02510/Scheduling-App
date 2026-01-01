
import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [timetableMode, setTimetableMode] = useState<'school' | 'staff'>('school');
  
  // CRITICAL: Refs to manage sync state outside of the render cycle to prevent race conditions
  const syncLocked = useRef(false);
  const initialLoadDone = useRef(false);
  const syncTimeoutRef = useRef<number | null>(null);

  // App-wide Source of Truth
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [fixedClasses, setFixedClasses] = useState<FixedClass[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [schedule, setSchedule] = useState<SchoolSchedule | null>(null);

  // Load initial data
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

  // MASTER SYNC LOOP: Controlled by syncLocked ref
  useEffect(() => {
    if (syncLocked.current || !user || !profile || !initialLoadDone.current) return;

    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = window.setTimeout(async () => {
      if (syncLocked.current || !user) return;

      const currentState = {
        profile,
        teachers,
        textbooks,
        classes,
        fixedClasses,
        subjects,
        schedule
      };
      
      try {
        await saveUserData(user.uid, currentState);
      } catch (e) {
        console.warn("Sync suspended.");
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    };
  }, [profile, teachers, textbooks, classes, fixedClasses, subjects, schedule, user]);

  const handleOnboardingComplete = async (newProfile: SchoolProfile) => {
    if (!user) return;
    setIsLoading(true);
    const initialState = {
      profile: { ...newProfile, specialEvents: [] },
      teachers: newProfile.teachers,
      classes: newProfile.classes,
      fixedClasses: newProfile.fixedClasses,
      textbooks: newProfile.textbooks,
      subjects: newProfile.subjects,
      schedule: null
    };
    
    setProfile(initialState.profile);
    setTeachers(initialState.teachers);
    setClasses(initialState.classes);
    setFixedClasses(initialState.fixedClasses);
    setTextbooks(initialState.textbooks);
    setSubjects(initialState.subjects);
    
    await saveUserData(user.uid, initialState);
    
    initialLoadDone.current = true;
    setShowOnboarding(false);
    setIsLoading(false);
    setActiveTab('home');
  };

  const resetSystem = async () => {
    if (!user) return;
    
    const confirmed = window.confirm("WARNING: This will permanently wipe all institutional data. This action is irreversible. Proceed?");
    if (!confirmed) return;

    // Halt all background processes
    syncLocked.current = true;
    initialLoadDone.current = false;
    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    setIsLoading(true);

    try {
      // 1. Wipe Cloud Data
      const success = await clearUserData(user.uid);
      if (!success) throw new Error("Could not reach cloud database.");
      
      // 2. Wipe Local State
      setProfile(null);
      setTeachers([]);
      setClasses([]);
      setTextbooks([]);
      setFixedClasses([]);
      setSubjects([]);
      setSchedule(null);
      
      // 3. De-authorize
      await signOut(auth);
      
      // 4. Reset Application
      window.location.replace(window.location.origin);
    } catch (e) {
      console.error("Wipe failed:", e);
      alert("System Reset Failed: " + (e as Error).message);
      syncLocked.current = false;
      setIsLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    try {
      // Direct pass ensures AI gets most recent state regardless of sync delay
      const generated = await generateSchedule(teachers, textbooks, fixedClasses, classes, profile);
      setSchedule(generated);
      await saveUserData(user.uid, { profile, teachers, classes, textbooks, fixedClasses, subjects, schedule: generated });
      setActiveTab('timetable');
    } catch (error) {
      console.error(error);
      alert("Scheduling Error: Check staff availability and subject counts.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return null;
  if (!user) return <Auth />;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-pulse">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Institutional Update...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'home': return <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} />;
      case 'setup': return (
        <ScheduleForm 
          profile={profile} 
          teachers={teachers} setTeachers={setTeachers} 
          classes={classes} setClasses={setClasses} 
          textbooks={textbooks} setTextbooks={setTextbooks}
          fixedClasses={fixedClasses} setFixedClasses={setFixedClasses} 
          subjects={subjects} setSubjects={setSubjects} 
          onGenerate={handleGenerateSchedule} 
        />
      );
      case 'planner': return <div className="space-y-16 pb-20"><ResourcePlanner textbooks={textbooks} onUpdate={setTextbooks} profile={profile} /><div className="h-px bg-slate-200 w-full rounded-full"></div><SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => profile && setProfile({...profile, specialEvents: evs})} /></div>;
      case 'timetable':
        if (!schedule) return <div className="text-center py-40 text-slate-300 font-black uppercase text-xs tracking-widest">No schedule found. Use setup to build one.</div>;
        return (
          <div className="space-y-8">
            <div className="flex justify-center bg-slate-100 p-1 rounded-xl w-fit mx-auto">
              <button onClick={() => setTimetableMode('school')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timetableMode === 'school' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>School</button>
              <button onClick={() => setTimetableMode('staff')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timetableMode === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Staff</button>
            </div>
            {timetableMode === 'school' ? <ScheduleViewer schedule={schedule} classes={classes} teachers={teachers} profile={profile} /> : <TeacherView schedule={schedule} teachers={teachers} classes={classes} profile={profile} />}
          </div>
        );
      case 'insights': return schedule && profile ? <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} /> : <div className="text-center py-40 text-slate-300 font-black uppercase text-xs tracking-widest">Generate a schedule to see insights.</div>;
      case 'settings': return <Settings user={user} profile={profile} onReset={resetSystem} onLogout={() => signOut(auth)} />;
      default: return <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} />;
    }
  };

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </>
  );
};

export default App;
