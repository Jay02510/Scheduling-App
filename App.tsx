
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolSchedule, SchoolProfile, SubjectConfig, Language, ScheduleSlot } from './types';
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
import LandingPage from './components/LandingPage';
import FeedbackModal from './components/FeedbackModal';
import MasterRhythm from './components/MasterRhythm';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState<Language>('ko');
  const [hasEntered, setHasEntered] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
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
          if (cloudData) {
            if (cloudData.profile) {
              setProfile(cloudData.profile);
              setTeachers(cloudData.teachers || []);
              setClasses(cloudData.classes || []);
              setTextbooks(cloudData.textbooks || []);
              setLockedSlots(cloudData.lockedSlots || []);
              setSubjects(cloudData.subjects || []);
              setSchedule(cloudData.schedule || null);
              setLastInputHash(cloudData.lastInputHash || '');
            }
            if (cloudData.isPremium) setIsPremium(true);
            if (cloudData.language) setLanguage(cloudData.language);
          }
        } catch (e) {
          console.error("Cloud fetch error:", e);
        }
      } else {
        setUser(null);
        setIsPremium(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profile && !isLoading) {
      const dataToSave = {
        profile, teachers, classes, textbooks, lockedSlots, subjects, schedule, lastInputHash, language, isPremium
      };
      const timeoutId = setTimeout(() => { saveUserData(user.uid, dataToSave); }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading, lastInputHash, language, isPremium]);

  const markClassDirty = (classId: string) => {
    setDirtyClassIds(prev => new Set(prev).add(classId));
  };

  const handleUpdateClasses = (newClasses: ClassGroup[]) => {
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

  const handleManualSlotUpdate = (updatedSlot: ScheduleSlot) => {
    if (!schedule) return;
    const newSlots = schedule.weeklySlots.map(s => s.id === updatedSlot.id ? updatedSlot : s);
    setSchedule({ ...schedule, weeklySlots: newSlots });
    markClassDirty(updatedSlot.classId);
  };

  const handleManualMove = (source: { day: number, period: number }, target: { day: number, period: number }, classId: string, isCopy: boolean) => {
    if (!schedule) return;
    const sourceSlot = schedule.weeklySlots.find(s => s.classId === classId && s.day === source.day && s.period === source.period);
    if (!sourceSlot) return;

    let newSlots = [...schedule.weeklySlots];
    newSlots = newSlots.filter(s => !(s.classId === classId && s.day === target.day && s.period === target.period));
    const newSlot = { ...sourceSlot, id: Math.random().toString(36).substr(2, 9), day: target.day, period: target.period };
    newSlots.push(newSlot);

    if (!isCopy) {
      newSlots = newSlots.filter(s => s.id !== sourceSlot.id);
    }

    setSchedule({ ...schedule, weeklySlots: newSlots });
    markClassDirty(classId);
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    
    // DEMO CAP CHECK
    if (!isPremium && classes.length > 3) {
      alert(language === 'ko' 
        ? "체험판에서는 최대 3개 학급까지만 AI 동기화가 가능합니다. 더 많은 학급을 위해 기관용 버전을 문의하세요." 
        : "Free Demo is limited to 3 classes for AI Sync. Contact us for institutional access to scale your school.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setValidationIssues([]);
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const classesToProcess = forceFullSync ? classes.map(c => c.id) : Array.from(dirtyClassIds);
      
      // If demo, limit classesToProcess to 3
      const cappedClasses = !isPremium ? classesToProcess.slice(0, 3) : classesToProcess;

      const { slots, validation } = await generateWeeklyMaster(
        teachers, lockedSlots, classes, currentProfile, 
        forceFullSync ? [] : (schedule?.weeklySlots || []),
        cappedClasses,
        (msg) => setLoadingMsg(msg),
        !isPremium // Pass "isDemo" flag
      );
      setSchedule(prev => ({ 
        ...prev, 
        weeklySlots: slots, 
        quarterlyPlan: prev?.quarterlyPlan || { quarterName: 'Term 1', weeks: [] } 
      }));
      setDirtyClassIds(new Set());
      setForceFullSync(false);
      if (validation.issues.length > 0) {
        setValidationIssues(validation.issues);
      }
    } catch (e: any) {
      setErrorMessage(`Schedule Sync Failed: ${e.message || "Logic engine timeout."}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  if (!hasEntered && !user) return <LandingPage onEnter={() => setHasEntered(true)} language={language} setLanguage={setLanguage} userId={user?.uid} />;
  if (!user) return <Auth onBack={() => setHasEntered(false)} />;
  if (!profile) return <Onboarding onComplete={(p) => { setProfile(p); setTeachers(p.teachers); setClasses(p.classes); setSubjects(p.subjects); setForceFullSync(true); }} />;

  const changeCount = dirtyClassIds.size;

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      language={language} 
      setLanguage={setLanguage}
      onOpenFeedback={() => setIsFeedbackOpen(true)}
      isPremium={isPremium}
    >
      <div className="mb-8 no-print flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 p-5 rounded-[2rem] shadow-sm gap-4">
        <div className="flex items-center gap-4 ml-2">
          <div className={`w-3 h-3 rounded-full ${changeCount === 0 && !forceFullSync ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.3)]'}`}></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
              {forceFullSync 
                ? `RE-SYNC IN PROGRESS`
                : (changeCount > 0 
                  ? `${changeCount} CLASS CHANGES PENDING` 
                  : `SCHEDULE SAVED`)}
            </span>
            {changeCount > 0 && !isPremium && (
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-tight">
                Demo Mode: Up to 3 classes synced by AI.
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            disabled={isLoading}
            onClick={() => { setForceFullSync(true); handleGenerateMaster(); }} 
            className="px-8 py-3 rounded-2xl bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-3"
          >
            {isLoading ? (
               <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            {isLoading ? 'Updating...' : 'Sync AI Schedule'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 animate-pulse">
          <div className="relative">
             <div className="w-24 h-24 border-[10px] border-indigo-50 rounded-full"></div>
             <div className="w-24 h-24 border-[10px] border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 shadow-[0_0_30px_rgba(79,70,229,0.2)]"></div>
          </div>
          <div className="text-center space-y-3">
            <p className="text-[14px] font-black text-slate-900 uppercase tracking-[0.5em]">{loadingMsg}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating clash-free timetable...</p>
          </div>
        </div>
      ) : (
        <>
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
              onNavigate={setActiveTab} language={language} 
            />
          )}
          {activeTab === 'homerooms' && (
            <ScheduleViewer 
              schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} 
              classes={classes} teachers={teachers} subjects={subjects} textbooks={textbooks} 
              lockedSlots={lockedSlots} profile={profile} onGenerateRoadmap={() => {}} 
              onNavigate={setActiveTab} onRegenerate={handleGenerateMaster} onJump={handleEntityJump} 
              onUpdateSlot={handleManualSlotUpdate}
              onMoveSlot={handleManualMove}
              language={language} 
            />
          )}
          {activeTab === 'curriculum' && <CurriculumRoadmap textbooks={textbooks} onUpdateTextbooks={setTextbooks} subjects={subjects} classes={classes} language={language} />}
          {activeTab === 'calendar' && <SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => setProfile(p => p ? {...p, specialEvents: evs} : null)} language={language} />}
          {activeTab === 'faculty' && <TeacherView schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} teachers={teachers} classes={classes} subjects={subjects} lockedSlots={lockedSlots} profile={profile} />}
          {activeTab === 'settings' && <Settings user={user} profile={profile} teachers={teachers} schedule={schedule} isPremium={isPremium} onReset={() => clearUserData(user.uid).then(() => window.location.reload())} onLogout={() => signOut(auth)} language={language} />}
          {activeTab === 'rhythm' && <MasterRhythm profile={profile} language={language} />}
        </>
      )}

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        userId={user?.uid || 'anonymous'} 
        userEmail={user?.email || 'jsn.benjamin@gmail.com'} 
      />
    </Layout>
  );
};

export default App;
