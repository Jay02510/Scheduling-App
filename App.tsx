
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolSchedule, SchoolProfile, SubjectConfig, ScheduleSlot } from './types';
import { generateWeeklyMaster, generateCurriculumRoadmap } from './services/geminiService';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScheduleForm from './components/ScheduleForm';
import ScheduleViewer from './components/ScheduleViewer';
import TeacherView from './components/TeacherView';
import MasterRhythm from './components/MasterRhythm';
import Onboarding from './components/Onboarding';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Settings from './components/Settings';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
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
        teachers,
        classes,
        textbooks,
        lockedSlots,
        subjects,
        schedule
      };
      const timeoutId = setTimeout(() => {
        saveUserData(user.uid, dataToSave);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading]);

  const handleOnboardingComplete = (newProfile: SchoolProfile) => {
    setProfile(newProfile);
    setTeachers(newProfile.teachers || []);
    setClasses(newProfile.classes || []);
    setTextbooks(newProfile.textbooks || []);
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
    const existingIdx = currentSchedule.weeklySlots.findIndex(
      s => s.day === updatedSlot.day && s.period === updatedSlot.period && s.classId === updatedSlot.classId
    );
    
    let newSlots = [...currentSchedule.weeklySlots];
    if (existingIdx > -1) {
      if (!updatedSlot.subjectId) {
        newSlots.splice(existingIdx, 1);
      } else {
        newSlots[existingIdx] = updatedSlot;
      }
    } else if (updatedSlot.subjectId) {
      newSlots.push(updatedSlot);
    }
    
    setSchedule({ ...currentSchedule, weeklySlots: newSlots });
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    setLoadingMsg("Engine is optimizing your rhythm...");
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const slots = await generateWeeklyMaster(teachers, lockedSlots, classes, currentProfile);
      setSchedule({ ...schedule, weeklySlots: slots, quarterlyPlan: schedule?.quarterlyPlan || { quarterName: 'Term 1', weeks: [] } });
      setActiveTab('homerooms');
    } catch (e: any) {
      alert(e.message || "Optimization failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Auth />;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fadeIn">
          <div className="relative mb-10">
            <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] animate-pulse">{loadingMsg}</p>
        </div>
      ) : (
        <>
          {activeTab === 'home' && (
            <Dashboard 
              teachers={teachers} 
              classes={classes} 
              textbooks={textbooks} 
              onResync={() => setActiveTab('setup')} 
              onJump={handleEntityJump}
            />
          )}
          {activeTab === 'master' && (
            <MasterRhythm profile={profile} />
          )}
          {activeTab === 'homerooms' && (
            <ScheduleViewer 
              schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} 
              classes={classes} 
              teachers={teachers} 
              subjects={subjects} 
              textbooks={textbooks}
              profile={profile} 
              onGenerateRoadmap={() => {}} 
              onUpdateSlot={handleUpdateScheduleSlot}
              onNavigate={setActiveTab}
              initialClassId={navigationFocus?.type === 'class' ? navigationFocus.id : undefined}
            />
          )}
          {activeTab === 'faculty' && (
            <TeacherView 
              schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} 
              teachers={teachers} 
              classes={classes} 
              subjects={subjects} 
              profile={profile} 
              initialTeacherId={navigationFocus?.type === 'teacher' ? navigationFocus.id : undefined}
            />
          )}
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
              lockedSlots={lockedSlots} 
              setLockedSlots={setLockedSlots} 
              subjects={subjects} 
              setSubjects={setSubjects} 
              onGenerate={handleGenerateMaster} 
              schedule={schedule} 
            />
          )}
          {activeTab === 'insights' && schedule && profile && (
            <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} />
          )}
          {activeTab === 'settings' && (
            <Settings user={user} profile={profile} onReset={() => clearUserData(user.uid).then(() => window.location.reload())} onLogout={() => signOut(auth)} />
          )}
        </>
      )}
    </Layout>
  );
};

export default App;
