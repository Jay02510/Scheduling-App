
import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolSchedule, SchoolProfile, SubjectConfig, Language, ScheduleSlot } from './types';
import { generateWeeklyMaster, computeInputHash } from './services/geminiService';
import { TRANSLATIONS } from './constants';
import { sanitizeErrorMessage, logSecurely, sanitizeData } from './utils/security';
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

// SECURITY: Sanitize inputs to prevent XSS and strip potential PII patterns
const sanitizeInput = (val: string) => sanitizeData(val);

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
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [cooldown, setCooldown] = useState<number>(0);
  
  const [dirtyClassIds, setDirtyClassIds] = useState<Set<string>>(new Set());
  const [forceFullSync, setForceFullSync] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [lockedSlots, setLockedSlots] = useState<LockedSlot[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [schedule, setSchedule] = useState<SchoolSchedule | null>(null);
  const [lastInputHash, setLastInputHash] = useState<string>('');

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // Rate limiter logic: Cooldown of 30s between successful AI syncs
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Session Timeout Logic: Auto-logout after 30 mins of inactivity
  useEffect(() => {
    const timeout = 30 * 60 * 1000; // 30 minutes
    const checkInactivity = setInterval(() => {
      if (user && Date.now() - lastActivity > timeout) {
        logSecurely("Session expired due to inactivity");
        signOut(auth);
        window.location.reload();
      }
    }, 60000);

    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      clearInterval(checkInactivity);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [user, lastActivity]);

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
          logSecurely("Cloud fetch error:", e);
        }
      } else {
        const localSession = localStorage.getItem('demo_user_session');
        if (localSession) {
          const parsedUser = JSON.parse(localSession);
          setUser(parsedUser);
          setIsPremium(true);
          const localData = localStorage.getItem('demo_data');
          if (localData) {
            const data = JSON.parse(localData);
            setProfile(data.profile);
            setTeachers(data.teachers || []);
            setClasses(data.classes || []);
            setTextbooks(data.textbooks || []);
            setLockedSlots(data.lockedSlots || []);
            setSubjects(data.subjects || []);
            setSchedule(data.schedule || null);
            setLastInputHash(data.lastInputHash || '');
          }
        } else {
          setUser(null);
          setIsPremium(false);
        }
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
      if (user.isDemo) {
        localStorage.setItem('demo_data', JSON.stringify(dataToSave));
        return;
      }
      const timeoutId = setTimeout(() => { saveUserData(user.uid, dataToSave); }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading, lastInputHash, language, isPremium]);

  const markClassDirty = (classId: string) => {
    setDirtyClassIds(prev => new Set(prev).add(classId));
  };

  const handleUpdateClasses = (newClasses: ClassGroup[]) => {
    const sanitized = newClasses.map(c => ({
      ...c,
      name: sanitizeInput(c.name)
    }));
    sanitized.forEach((newCls, idx) => {
      const oldCls = classes[idx];
      if (oldCls && JSON.stringify(oldCls.assignments) !== JSON.stringify(newCls.assignments)) {
        markClassDirty(newCls.id);
      }
    });
    setClasses(sanitized);
  };

  const handleUpdateTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers.map(t => ({ ...t, name: sanitizeInput(t.name) })));
  };

  const handleEntityJump = (id: string, type: 'teacher' | 'class') => {
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
    if (!user || !profile || cooldown > 0) return;
    
    // DEMO CAP CHECK
    if (!isPremium && classes.length > 3) {
      alert(language === 'ko' 
        ? "체험판은 최대 3개 학급만 가능합니다. 기관용으로 업그레이드하세요." 
        : "Demo Mode is limited to 3 classes. Please upgrade to Institutional Tier.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const classesToProcess = forceFullSync ? classes.map(c => c.id) : Array.from(dirtyClassIds);
      const cappedClasses = !isPremium ? classesToProcess.slice(0, 3) : classesToProcess;

      const { slots, validation } = await generateWeeklyMaster(
        teachers, lockedSlots, classes, currentProfile, 
        forceFullSync ? [] : (schedule?.weeklySlots || []),
        cappedClasses,
        (msg) => setLoadingMsg(msg),
        !isPremium
      );
      
      setSchedule(prev => ({ 
        ...prev, 
        weeklySlots: slots, 
        quarterlyPlan: prev?.quarterlyPlan || { quarterName: 'Term 1', weeks: [] } 
      }));
      setDirtyClassIds(new Set());
      setForceFullSync(false);
      setLastSyncTime(Date.now());
      setCooldown(30); // 30s Cooldown for stability and security
    } catch (e: any) {
      setErrorMessage(sanitizeErrorMessage(e));
      logSecurely("Generation failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchDemo = () => {
    const demoUser = {
      uid: 'demo-user',
      email: 'guest@eduplanner.pro',
      displayName: 'Demo Guest',
      isDemo: true,
      isPremium: true
    };
    
    const demoTeachers = [
      { id: 't-1', name: 'Dr. Aris Miller', role: 'homeroom' as const, subjects: ['sub-math'], maxDailyPeriods: 6, breaksNeededPerWeek: 5, color: '#6366f1', assignedClasses: ['c-1'], employmentType: 'Full-Time' },
      { id: 't-2', name: 'Prof. Kim Lin', role: 'subject' as const, subjects: ['sub-sci', 'sub-mus'], maxDailyPeriods: 7, breaksNeededPerWeek: 4, color: '#10b981', assignedClasses: [], employmentType: 'Full-Time' },
      { id: 't-3', name: 'Ms. Lopez Perez', role: 'homeroom' as const, subjects: ['sub-eng'], maxDailyPeriods: 6, breaksNeededPerWeek: 5, color: '#f59e0b', assignedClasses: ['c-2'], employmentType: 'Full-Time' },
      { id: 't-4', name: 'Coach Ben Wright', role: 'specialist' as const, subjects: ['sub-pe'], maxDailyPeriods: 8, breaksNeededPerWeek: 3, color: '#a855f7', assignedClasses: [], employmentType: 'Full-Time' }
    ];

    const demoClasses = [
      { id: 'c-1', name: 'Grade 1A', grade: 'G1', homeroomTeacherId: 't-1', color: '#6366f1', assignments: [{ subjectId: 'sub-math', teacherId: 't-1' }, { subjectId: 'sub-sci', teacherId: 't-2' }, { subjectId: 'sub-pe', teacherId: 't-4' }] },
      { id: 'c-2', name: 'Grade 1B', grade: 'G1', homeroomTeacherId: 't-3', color: '#f59e0b', assignments: [{ subjectId: 'sub-eng', teacherId: 't-3' }, { subjectId: 'sub-mus', teacherId: 't-2' }, { subjectId: 'sub-pe', teacherId: 't-4' }] }
    ];

    const demoSubjects = [
      { id: 'sub-math', name: 'Mathematics', frequencyPerWeek: 5, gradeLevels: ['G1'] },
      { id: 'sub-eng', name: 'English', frequencyPerWeek: 5, gradeLevels: ['G1'] },
      { id: 'sub-sci', name: 'Science', frequencyPerWeek: 3, gradeLevels: ['G1'] },
      { id: 'sub-art', name: 'Art', frequencyPerWeek: 2, gradeLevels: ['G1'] },
      { id: 'sub-pe', name: 'Physical Ed', frequencyPerWeek: 2, gradeLevels: ['G1'] },
      { id: 'sub-mus', name: 'Music', frequencyPerWeek: 2, gradeLevels: ['G1'] }
    ];

    const demoTextbooks = [
      { id: 'tb-1', title: 'Calculus Foundations', subject: 'Mathematics', gradeLevel: 'G1', totalChapters: 12, totalPages: 360, currentPage: 1, classId: 'c-1', assignedQuarter: 0, color: '#6366f1' },
      { id: 'tb-2', title: 'Experimental Science 101', subject: 'Science', gradeLevel: 'G1', totalChapters: 8, totalPages: 240, currentPage: 1, classId: 'c-1', assignedQuarter: 0, color: '#10b981' },
      { id: 'tb-3', title: 'Oxford Literature', subject: 'English', gradeLevel: 'G1', totalChapters: 16, totalPages: 420, currentPage: 1, classId: 'c-2', assignedQuarter: 0, color: '#f59e0b' }
    ];

    const demoLockedSlots = [
      { id: 'lock-lunch', name: 'Lunch Break', dayOfWeek: 0, period: 3, classIds: [], isSchoolWide: true },
      { id: 'lock-lunch-tue', name: 'Lunch Break', dayOfWeek: 1, period: 3, classIds: [], isSchoolWide: true },
      { id: 'lock-lunch-wed', name: 'Lunch Break', dayOfWeek: 2, period: 3, classIds: [], isSchoolWide: true },
      { id: 'lock-lunch-thu', name: 'Lunch Break', dayOfWeek: 3, period: 3, classIds: [], isSchoolWide: true },
      { id: 'lock-lunch-fri', name: 'Lunch Break', dayOfWeek: 4, period: 3, classIds: [], isSchoolWide: true }
    ];

    const demoSchedule = {
      quarterlyPlan: { quarterName: 'Term 1', weeks: [] },
      weeklySlots: [
        { id: 'm1', day: 0, period: 0, classId: 'c-1', subjectId: 'sub-math', teacherId: 't-1' },
        { id: 'm2', day: 0, period: 1, classId: 'c-1', subjectId: 'sub-sci', teacherId: 't-2' },
        { id: 'm3', day: 0, period: 2, classId: 'c-1', subjectId: 'sub-pe', teacherId: 't-4' },
        { id: 'm4', day: 1, period: 0, classId: 'c-1', subjectId: 'sub-math', teacherId: 't-1' },
        { id: 'm5', day: 1, period: 1, classId: 'c-1', subjectId: 'sub-sci', teacherId: 't-2' },
        { id: 'm6', day: 2, period: 0, classId: 'c-1', subjectId: 'sub-math', teacherId: 't-1' },
        
        { id: 'm7', day: 0, period: 0, classId: 'c-2', subjectId: 'sub-eng', teacherId: 't-3' },
        { id: 'm8', day: 0, period: 1, classId: 'c-2', subjectId: 'sub-mus', teacherId: 't-2' },
        { id: 'm9', day: 1, period: 0, classId: 'c-2', subjectId: 'sub-eng', teacherId: 't-3' },
        { id: 'm10', day: 1, period: 1, classId: 'c-2', subjectId: 'sub-pe', teacherId: 't-4' },
        { id: 'm11', day: 2, period: 1, classId: 'c-2', subjectId: 'sub-eng', teacherId: 't-3' }
      ]
    };

    const demoProfile = {
      name: 'Westside Academy (Trial Console)',
      hours: { startTime: '08:30', periodDuration: 45, totalPeriods: 8, lunchAfterPeriod: 4, recessAfterPeriod: 2, homeworkAfterPeriod: 8 },
      subjects: demoSubjects,
      textbooks: demoTextbooks,
      teachers: demoTeachers,
      classes: demoClasses,
      lockedSlots: demoLockedSlots,
      specialEvents: []
    };

    localStorage.setItem('demo_user_session', JSON.stringify(demoUser));
    
    // Save current schema if they want to override later
    const initialDemoSave = {
      profile: demoProfile, teachers: demoTeachers, classes: demoClasses, textbooks: demoTextbooks, lockedSlots: demoLockedSlots, subjects: demoSubjects, schedule: demoSchedule, lastInputHash: '', language, isPremium: true
    };
    localStorage.setItem('demo_data', JSON.stringify(initialDemoSave));

    setProfile(demoProfile);
    setTeachers(demoTeachers);
    setClasses(demoClasses);
    setSubjects(demoSubjects);
    setTextbooks(demoTextbooks);
    setLockedSlots(demoLockedSlots);
    setSchedule(demoSchedule);
    setLastInputHash('');
    setIsPremium(true);
    setUser(demoUser);
    setHasEntered(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('demo_user_session');
    localStorage.removeItem('demo_data');
    signOut(auth);
    setUser(null);
    setIsPremium(false);
    setProfile(null);
    setHasEntered(false);
  };

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  if (!hasEntered && !user) return <LandingPage onEnter={() => setHasEntered(true)} onTryDemo={handleLaunchDemo} language={language} setLanguage={setLanguage} />;
  if (!user) return <Auth onBack={() => setHasEntered(false)} onTryDemo={handleLaunchDemo} />;
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
      onLogout={handleLogout}
    >
      <div className="mb-8 no-print flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 p-5 rounded-[2rem] shadow-sm gap-4">
        <div className="flex items-center gap-4 ml-2">
          <div className={`w-3 h-3 rounded-full ${changeCount === 0 && !forceFullSync ? 'bg-emerald-500 shadow-lg' : 'bg-amber-500 animate-pulse shadow-lg'}`}></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
              {forceFullSync ? `FULL RE-SYNC` : (changeCount > 0 ? `${changeCount} CHANGES DETECTED` : `LOGIC STABLE`)}
            </span>
            {cooldown > 0 && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Cooldown: {cooldown}s</span>}
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            disabled={isLoading || cooldown > 0}
            onClick={() => { setForceFullSync(true); handleGenerateMaster(); }} 
            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${
              cooldown > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#0f172a] text-white hover:bg-indigo-600'
            }`}
          >
            {isLoading ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            {isLoading ? 'Syncing...' : (cooldown > 0 ? `Ready in ${cooldown}s` : 'Sync AI Schedule')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 animate-pulse">
          <div className="relative"><div className="w-24 h-24 border-[10px] border-indigo-50 rounded-full"></div><div className="w-24 h-24 border-[10px] border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div></div>
          <div className="text-center space-y-3">
            <p className="text-[14px] font-black text-slate-900 uppercase tracking-[0.5em]">{loadingMsg}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applying Institutional Logic...</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'home' && <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} onJump={handleEntityJump} language={language} />}
          {activeTab === 'setup' && (
            <ScheduleForm 
              profile={profile} setProfile={(p) => setProfile({...p, name: sanitizeInput(p.name)})} 
              teachers={teachers} setTeachers={handleUpdateTeachers} 
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
              onNavigate={setActiveTab} onRegenerate={handleGenerateMaster} 
              onUpdateSlot={handleManualSlotUpdate}
              onMoveSlot={handleManualMove}
              language={language} 
            />
          )}
          {activeTab === 'curriculum' && <CurriculumRoadmap textbooks={textbooks} onUpdateTextbooks={setTextbooks} subjects={subjects} classes={classes} language={language} />}
          {activeTab === 'calendar' && <SchoolCalendar events={profile?.specialEvents || []} onUpdate={(evs) => setProfile(p => p ? {...p, specialEvents: evs} : null)} language={language} />}
          {activeTab === 'faculty' && <TeacherView schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} teachers={teachers} classes={classes} subjects={subjects} lockedSlots={lockedSlots} profile={profile} />}
          {activeTab === 'settings' && (
            <Settings 
              user={user} 
              profile={profile} 
              teachers={teachers} 
              schedule={schedule} 
              isPremium={isPremium} 
              onReset={async () => {
                if (user && user.isDemo) {
                  localStorage.removeItem('demo_data');
                  window.location.reload();
                  return;
                }
                clearUserData(user.uid).then(() => window.location.reload());
              }} 
              onLogout={handleLogout} 
              language={language} 
            />
          )}
          {activeTab === 'rhythm' && <MasterRhythm profile={profile} language={language} />}
        </>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} userId={user?.uid || 'anonymous'} userEmail={user?.email || ''} />
    </Layout>
  );
};

export default App;
