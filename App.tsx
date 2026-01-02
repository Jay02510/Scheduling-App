import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, FixedClass, SchoolSchedule, SchoolProfile, SubjectConfig } from './types';
import { generateWeeklyMaster, generateCurriculumRoadmap } from './services/geminiService';
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
  const [loadingMsg, setLoadingMsg] = useState('');
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
    setLoadingMsg("Saving your school profile...");
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

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    setLoadingMsg("Synthesizing Weekly Master Grid...");
    try {
      const slots = await generateWeeklyMaster(teachers, fixedClasses, classes, profile);
      const newSchedule = { 
        weeklySlots: slots, 
        quarterlyPlan: schedule?.quarterlyPlan || { quarterName: 'Not Generated', weeks: [] } 
      };
      setSchedule(newSchedule);
      setActiveTab('timetable');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    setLoadingMsg("Calculating Curriculum Roadmap...");
    try {
      const plan = await generateCurriculumRoadmap(textbooks, profile);
      const newSchedule = { 
        weeklySlots: schedule?.weeklySlots || [], 
        quarterlyPlan: plan 
      };
      setSchedule(newSchedule);
      setActiveTab('timetable');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSystem = async () => {
    if (!user || !window.confirm("Are you sure you want to reset all data? This cannot be undone.")) return;
    setIsLoading(true);
    setLoadingMsg("Resetting system...");
    try {
      await clearUserData(user.uid);
      setProfile(null);
      setTeachers([]);
      setTextbooks([]);
      setClasses([]);
      setFixedClasses([]);
      setSubjects([]);
      setSchedule(null);
      setShowOnboarding(true);
      initialLoadDone.current = false;
      setActiveTab('home');
    } catch (e) {
      alert("Failed to reset data.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return null;
  if (!user) return <Auth />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fadeIn">
          <div className="relative w-20 h-20 mb-8">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse-soft">{loadingMsg}</p>
        </div>
      ) : (
        <>
          {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
          {activeTab === 'home' && <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} />}
          {activeTab === 'setup' && (
            <ScheduleForm 
              profile={profile} 
              setProfile={setProfile}
              teachers={teachers} 
              setTeachers={setTeachers} 
              classes={classes} 
              setClasses={setClasses} 
              textbooks={textbooks} 
              setTextbooks={setTextbooks} 
              fixedClasses={fixedClasses} 
              setFixedClasses={setFixedClasses} 
              subjects={subjects} 
              setSubjects={setSubjects} 
              onGenerate={handleGenerateMaster} 
            />
          )}
          {activeTab === 'timetable' && (
            <div className="space-y-8">
              <div className="flex justify-center bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto shadow-inner">
                <button onClick={() => setTimetableMode('school')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timetableMode === 'school' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Class Schedules</button>
                <button onClick={() => setTimetableMode('staff')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timetableMode === 'staff' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400'}`}>Staff Workloads</button>
              </div>
              {schedule ? (
                timetableMode === 'school' ? (
                  <ScheduleViewer schedule={schedule} classes={classes} teachers={teachers} profile={profile} onGenerateRoadmap={handleGenerateRoadmap} />
                ) : (
                  <TeacherView schedule={schedule} teachers={teachers} classes={classes} profile={profile} />
                )
              ) : (
                <div className="text-center py-40 border-2 border-dashed border-slate-200 rounded-[3rem]">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No active schedule grid found</p>
                  <button onClick={() => setActiveTab('setup')} className="mt-4 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">Return to Setup</button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'planner' && <div className="space-y-16 pb-20"><ResourcePlanner textbooks={textbooks} onUpdate={setTextbooks} profile={profile} /><div className="h-px bg-slate-200 w-full"></div><SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => profile && setProfile({...profile, specialEvents: evs})} /></div>}
          {activeTab === 'insights' && (schedule && profile ? <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} /> : <div className="text-center py-40">Generate a schedule to view analytics.</div>)}
          {activeTab === 'settings' && <Settings user={user} profile={profile} onReset={resetSystem} onLogout={() => signOut(auth)} />}
        </>
      )}
    </Layout>
  );
};

export default App;