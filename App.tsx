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
        } else {
          setShowOnboarding(true);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async (newProfile: SchoolProfile) => {
    setProfile(newProfile);
    setTeachers(newProfile.teachers);
    setClasses(newProfile.classes);
    setTextbooks(newProfile.textbooks);
    setFixedClasses(newProfile.fixedClasses);
    setSubjects(newProfile.subjects);
    setShowOnboarding(false);
    setActiveTab('home');
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    setLoadingMsg("Synthesizing ID-mapped Master Schedule...");
    try {
      // Ensure we're using latest state for the synthesis profile
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, fixedClasses, subjects };
      const slots = await generateWeeklyMaster(teachers, fixedClasses, classes, currentProfile);
      setSchedule({ weeklySlots: slots, quarterlyPlan: schedule?.quarterlyPlan || { quarterName: '', weeks: [] } });
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
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, fixedClasses, subjects };
      const plan = await generateCurriculumRoadmap(textbooks, currentProfile);
      setSchedule({ weeklySlots: schedule?.weeklySlots || [], quarterlyPlan: plan });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return null;
  if (!user) return <Auth />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{loadingMsg}</p>
        </div>
      ) : (
        <>
          {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
          {activeTab === 'home' && <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} />}
          {activeTab === 'setup' && (
            <ScheduleForm 
              profile={profile} setProfile={setProfile} teachers={teachers} setTeachers={setTeachers} classes={classes} setClasses={setClasses} textbooks={textbooks} setTextbooks={setTextbooks} fixedClasses={fixedClasses} setFixedClasses={setFixedClasses} subjects={subjects} setSubjects={setSubjects} onGenerate={handleGenerateMaster} 
            />
          )}
          {activeTab === 'timetable' && schedule && (
            <ScheduleViewer schedule={schedule} classes={classes} teachers={teachers} subjects={subjects} profile={profile} onGenerateRoadmap={handleGenerateRoadmap} />
          )}
          {!schedule && activeTab === 'timetable' && (
             <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em]">No schedule generated yet</p>
               <button onClick={() => setActiveTab('setup')} className="mt-4 text-indigo-600 font-bold uppercase text-[10px]">Return to Setup</button>
             </div>
          )}
          {activeTab === 'planner' && <div className="space-y-16"><ResourcePlanner textbooks={textbooks} onUpdate={setTextbooks} profile={profile} /><SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => profile && setProfile({...profile, specialEvents: evs})} /></div>}
          {activeTab === 'insights' && schedule && profile && <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} />}
          {activeTab === 'settings' && <Settings user={user} profile={profile} onReset={() => {}} onLogout={() => signOut(auth)} />}
        </>
      )}
    </Layout>
  );
};

export default App;