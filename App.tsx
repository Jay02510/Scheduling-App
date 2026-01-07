import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolSchedule, SchoolProfile, SubjectConfig } from './types';
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
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profile && !isLoading) {
      const timeoutId = setTimeout(() => {
        saveUserData(user.uid, {
          profile,
          teachers,
          classes,
          textbooks,
          lockedSlots,
          subjects,
          schedule
        });
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, profile, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading]);

  const handleOnboardingComplete = async (newProfile: SchoolProfile) => {
    setProfile(newProfile);
    setTeachers(newProfile.teachers);
    setClasses(newProfile.classes);
    setTextbooks(newProfile.textbooks);
    setLockedSlots(newProfile.lockedSlots);
    setSubjects(newProfile.subjects);
    setShowOnboarding(false);
    setActiveTab('home');
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    setLoadingMsg("Optimizing Timetable...");
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const slots = await generateWeeklyMaster(teachers, lockedSlots, classes, currentProfile);
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
    setLoadingMsg("Mapping Curriculum Pace...");
    try {
      const plan = await generateCurriculumRoadmap(textbooks, profile);
      setSchedule({ weeklySlots: schedule?.weeklySlots || [], quarterlyPlan: plan });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!user) return;
    if (window.confirm("Permanently wipe all school data?")) {
      setIsLoading(true);
      await clearUserData(user.uid);
      window.location.reload();
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
              profile={profile} setProfile={setProfile} teachers={teachers} setTeachers={setTeachers} classes={classes} setClasses={setClasses} textbooks={textbooks} setTextbooks={setTextbooks} lockedSlots={lockedSlots} setLockedSlots={setLockedSlots} subjects={subjects} setSubjects={setSubjects} onGenerate={handleGenerateMaster} 
            />
          )}
          {activeTab === 'timetable' && schedule && (
            <div className="space-y-6">
               <div className="flex justify-center bg-slate-100 p-1 rounded-2xl w-fit mx-auto shadow-inner">
                  <button onClick={() => setTimetableMode('school')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timetableMode === 'school' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Class View</button>
                  <button onClick={() => setTimetableMode('staff')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timetableMode === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Staff View</button>
               </div>
               {timetableMode === 'school' ? (
                 <ScheduleViewer schedule={schedule} classes={classes} teachers={teachers} subjects={subjects} profile={profile} onGenerateRoadmap={handleGenerateRoadmap} />
               ) : (
                 <TeacherView schedule={schedule} teachers={teachers} classes={classes} subjects={subjects} profile={profile} />
               )}
            </div>
          )}
          {activeTab === 'planner' && <div className="space-y-16"><ResourcePlanner textbooks={textbooks} onUpdate={setTextbooks} profile={profile} classes={classes} /><SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => profile && setProfile({...profile, specialEvents: evs})} /></div>}
          {activeTab === 'insights' && schedule && profile && <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} />}
          {activeTab === 'settings' && <Settings user={user} profile={profile} onReset={handleResetData} onLogout={() => signOut(auth)} />}
        </>
      )}
    </Layout>
  );
};

export default App;