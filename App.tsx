
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
  
  // Loading & Generation State
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  // Notifications
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

  const handleMoveScheduleSlot = (source: { day: number, period: number }, target: { day: number, period: number }, classId: string) => {
    if (!schedule) return;
    
    const newSlots = [...schedule.weeklySlots];
    const sourceIdx = newSlots.findIndex(s => s.classId === classId && s.day === source.day && s.period === source.period);
    const targetIdx = newSlots.findIndex(s => s.classId === classId && s.day === target.day && s.period === target.period);

    if (sourceIdx > -1) {
      // If there's an existing item in target, we swap them
      if (targetIdx > -1) {
        const temp = { ...newSlots[sourceIdx], day: target.day, period: target.period };
        newSlots[sourceIdx] = { ...newSlots[targetIdx], day: source.day, period: source.period };
        newSlots[targetIdx] = temp;
      } else {
        // Just move to empty slot
        newSlots[sourceIdx] = { ...newSlots[sourceIdx], day: target.day, period: target.period };
      }
      setSchedule({ ...schedule, weeklySlots: newSlots });
    }
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    setIsBackgrounded(false);
    setLoadingMsg("Optimization Engine is balancing institutional rhythms...");
    
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const slots = await generateWeeklyMaster(teachers, lockedSlots, classes, currentProfile);
      
      setSchedule(prev => ({ 
        ...prev, 
        weeklySlots: slots, 
        quarterlyPlan: prev?.quarterlyPlan || { quarterName: 'Term 1', weeks: [] } 
      }));

      setNotification({
        msg: "Generation Complete: Institutional rhythms are synchronized.",
        type: 'success',
        action: () => { setActiveTab('homerooms'); setNotification(null); }
      });

      setIsLoading(false);
      setIsBackgrounded(false);
    } catch (e: any) {
      setNotification({ msg: e.message || "Optimization failed.", type: 'error' });
      setIsLoading(false);
      setIsBackgrounded(false);
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
      {isBackgrounded && (
        <div className="fixed top-8 right-8 z-[100] animate-fadeIn">
          <div className="bg-[#0f172a] border border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Optimizing in Background</span>
            <button onClick={() => setIsBackgrounded(false)} className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] animate-fadeInUp w-full max-w-lg px-4">
          <div className={`p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border ${notification.type === 'success' ? 'bg-[#0f172a] text-white border-white/10' : 'bg-rose-900 text-white border-rose-500/20'}`}>
            <div className="flex items-center gap-5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <p className="text-[11px] font-black uppercase tracking-tight leading-relaxed">{notification.msg}</p>
            </div>
            <div className="flex items-center gap-3">
              {notification.action && (
                <button onClick={notification.action} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all">View Results</button>
              )}
              <button onClick={() => setNotification(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && !isBackgrounded ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn space-y-12">
          <div className="relative">
            <div className="w-32 h-32 border-[8px] border-slate-100 rounded-[3rem]"></div>
            <div className="w-32 h-32 border-[8px] border-indigo-600 border-t-transparent rounded-[3rem] animate-spin absolute top-0 left-0 shadow-2xl shadow-indigo-500/20"></div>
          </div>
          <div className="text-center space-y-4">
            <p className="text-[13px] font-black text-slate-900 uppercase tracking-[0.4em] animate-pulse">{loadingMsg}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">This may take up to 30 seconds depending on institutional complexity.</p>
          </div>
          <button 
            onClick={() => { setIsBackgrounded(true); setActiveTab('home'); }} 
            className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Run in Background
          </button>
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
          {activeTab === 'homerooms' && (
            <ScheduleViewer 
              schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} 
              classes={classes} 
              teachers={teachers} 
              subjects={subjects} 
              textbooks={textbooks}
              lockedSlots={lockedSlots}
              profile={profile} 
              onGenerateRoadmap={() => {}} 
              onUpdateSlot={handleUpdateScheduleSlot}
              onMoveSlot={handleMoveScheduleSlot}
              onNavigate={setActiveTab}
              onJump={handleEntityJump}
              initialClassId={navigationFocus?.type === 'class' ? navigationFocus.id : undefined}
            />
          )}
          {activeTab === 'faculty' && (
            <TeacherView 
              schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} 
              teachers={teachers} 
              classes={classes} 
              subjects={subjects} 
              lockedSlots={lockedSlots}
              profile={profile} 
              initialTeacherId={navigationFocus?.type === 'teacher' ? navigationFocus.id : undefined}
            />
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
