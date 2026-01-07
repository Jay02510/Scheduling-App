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
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Persist data to cloud when any sub-state changes
  useEffect(() => {
    if (user && profile && !isLoading) {
      const dataToSave = {
        profile,
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
  }, [user, profile, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading]);

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
    setLoadingMsg("AI is solving your timetable...");
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const slots = await generateWeeklyMaster(teachers, lockedSlots, classes, currentProfile);
      setSchedule({ ...schedule, weeklySlots: slots, quarterlyPlan: schedule?.quarterlyPlan || { quarterName: '', weeks: [] } });
      setActiveTab('timetable');
    } catch (e: any) {
      console.error(e);
      alert("AI Generation failed. Please check your setup data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    setLoadingMsg("Planning 12 weeks of lessons...");
    try {
      const plan = await generateCurriculumRoadmap(textbooks, profile);
      setSchedule({ ...schedule, weeklySlots: schedule?.weeklySlots || [], quarterlyPlan: plan });
    } catch (e: any) {
      console.error(e);
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
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse">{loadingMsg}</p>
        </div>
      ) : (
        <>
          {activeTab === 'home' && (
            <Dashboard 
              teachers={teachers} 
              classes={classes} 
              textbooks={textbooks} 
              onResync={() => setActiveTab('setup')} 
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
          {activeTab === 'timetable' && (
            <div className="space-y-8 animate-fadeIn">
               <div className="flex justify-center bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto shadow-inner">
                  <button onClick={() => setTimetableMode('school')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timetableMode === 'school' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Class Grids</button>
                  <button onClick={() => setTimetableMode('staff')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timetableMode === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Staff Wellness</button>
               </div>
               {timetableMode === 'school' ? (
                 <ScheduleViewer 
                    schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} 
                    classes={classes} 
                    teachers={teachers} 
                    subjects={subjects} 
                    profile={profile} 
                    onGenerateRoadmap={handleGenerateRoadmap} 
                    onUpdateSlot={handleUpdateScheduleSlot}
                    onNavigate={setActiveTab}
                  />
               ) : (
                 <TeacherView 
                   schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} 
                   teachers={teachers} 
                   classes={classes} 
                   subjects={subjects} 
                   profile={profile} 
                 />
               )}
            </div>
          )}
          {activeTab === 'planner' && (
            <div className="space-y-16">
              <ResourcePlanner textbooks={textbooks} onUpdate={setTextbooks} profile={profile} classes={classes} />
              <SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => profile && setProfile({...profile, specialEvents: evs})} />
            </div>
          )}
          {activeTab === 'insights' && schedule && profile && (
            <AnalyticsDashboard schedule={schedule} profile={profile} teachers={teachers} />
          )}
          {activeTab === 'settings' && (
            <Settings user={user} profile={profile} onReset={handleResetData} onLogout={() => signOut(auth)} />
          )}
        </>
      )}
    </Layout>
  );
};

export default App;