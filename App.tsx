
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
    
    if (!isPremium) {
      alert(language === 'ko' 
        ? "AI 스케줄링은 기관용(프리미엄) 기능입니다. 가격 페이지에서 베타 코드를 입력하거나 온보딩을 요청하세요." 
        : "AI Scheduling is an Institutional feature. Please enter a Beta code or request onboarding via the Pricing page.");
      setActiveTab('settings');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setValidationIssues([]);
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const classesToProcess = forceFullSync ? classes.map(c => c.id) : Array.from(dirtyClassIds);
      const { slots, validation } = await generateWeeklyMaster(
        teachers, lockedSlots, classes, currentProfile, 
        forceFullSync ? [] : (schedule?.weeklySlots || []),
        classesToProcess,
        (msg) => setLoadingMsg(msg)
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
      setErrorMessage(`Schedule Sync Failed: ${e.message || "Parallel optimization failed."}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  if (!hasEntered && !user) return <LandingPage onEnter={() => setHasEntered(true)} language={language} userId={user?.uid} />;
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
            {changeCount > 0 && changeCount < 10 && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tight">
                  Few changes detected. 
                </span>
                <button 
                  onClick={() => setActiveTab('homerooms')}
                  className="text-[9px] font-black text-indigo-600 underline uppercase hover:text-indigo-800 transition-colors"
                >
                  Click here to fix manually and skip AI sync wait
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            disabled={isLoading}
            onClick={() => { setForceFullSync(true); handleGenerateMaster(); }} 
            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all shadow-xl flex items-center gap-3 ${isPremium ? 'bg-[#0f172a] text-white hover:bg-indigo-600 shadow-indigo-500/10' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
          >
            {isLoading ? (
               <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            {isLoading ? 'Updating...' : (isPremium ? 'Sync AI Schedule' : 'Sync AI (Pro Only)')}
          </button>
        </div>
      </div>

      {(errorMessage || validationIssues.length > 0) && (
        <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-[2.5rem] space-y-4 animate-fadeIn no-print shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            <div className="flex-1">
              <h4 className="font-black text-rose-900 uppercase text-xs tracking-tight">Schedule Alerts</h4>
              <div className="mt-2 space-y-1 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                {errorMessage && <p className="text-rose-600 font-bold text-[10px] uppercase">{errorMessage}</p>}
                {validationIssues.map((issue, idx) => (
                  <p key={idx} className="text-rose-600 font-bold text-[10px] uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0"></span>
                    {issue}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <button onClick={() => setActiveTab('homerooms')} className="px-6 py-2.5 bg-[#0f172a] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all">Manual Drag-and-Drop</button>
            <button onClick={() => { setErrorMessage(null); setValidationIssues([]); }} className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Dismiss</button>
          </div>
        </div>
      )}

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
