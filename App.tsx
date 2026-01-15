
import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, saveUserData, fetchUserData, clearUserData } from './services/firebase';
import { Teacher, Textbook, ClassGroup, LockedSlot, SchoolSchedule, SchoolProfile, SubjectConfig, ScheduleSlot } from './types';
import { generateWeeklyMaster, computeInputHash } from './services/geminiService';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScheduleForm from './components/ScheduleForm';
import ScheduleViewer from './components/ScheduleViewer';
import TeacherView from './components/TeacherView';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import Auth from './components/Auth';
import CurriculumRoadmap from './components/CurriculumRoadmap';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [lastInputHash, setLastInputHash] = useState<string>('');

  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [lockedSlots, setLockedSlots] = useState<LockedSlot[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [schedule, setSchedule] = useState<SchoolSchedule | null>(null);
  const [navigationFocus, setNavigationFocus] = useState<{ id: string, type: 'teacher' | 'class' } | null>(null);

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
          setLastInputHash(cloudData.lastInputHash || '');
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profile && !isLoading) {
      const dataToSave = {
        profile: { ...profile, teachers, classes, textbooks, lockedSlots, subjects },
        teachers, classes, textbooks, lockedSlots, subjects, schedule,
        lastInputHash
      };
      const timeoutId = setTimeout(() => { saveUserData(user.uid, dataToSave); }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading, lastInputHash]);

  const handleEntityJump = (id: string, type: 'teacher' | 'class') => {
    setNavigationFocus({ id, type });
    setActiveTab(type === 'teacher' ? 'faculty' : 'homerooms');
  };

  const handleUpdateScheduleSlot = (updatedSlot: ScheduleSlot) => {
    setSchedule(prev => {
      if (!prev) return null;
      const existing = prev.weeklySlots.find(s => s.day === updatedSlot.day && s.period === updatedSlot.period && s.classId === updatedSlot.classId);
      let newSlots;
      if (existing) {
        if (!updatedSlot.subjectId) {
          newSlots = prev.weeklySlots.filter(s => s.id !== existing.id);
        } else {
          newSlots = prev.weeklySlots.map(s => s.id === existing.id ? { ...updatedSlot, id: existing.id } : s);
        }
      } else {
        if (!updatedSlot.subjectId) return prev;
        newSlots = [...prev.weeklySlots, updatedSlot];
      }
      return { ...prev, weeklySlots: newSlots };
    });
  };

  const handleMoveScheduleSlot = (source: { day: number, period: number }, target: { day: number, period: number }, classId: string, isCopy: boolean) => {
    setSchedule(prev => {
      if (!prev) return null;
      const sourceSlot = prev.weeklySlots.find(s => s.day === source.day && s.period === source.period && s.classId === classId);
      if (!sourceSlot) return prev;
      const targetSlot = prev.weeklySlots.find(s => s.day === target.day && s.period === target.period && s.classId === classId);
      let newSlots = prev.weeklySlots;
      if (isCopy) {
        const newTargetSlot = { ...sourceSlot, id: Math.random().toString(36).substr(2, 9), day: target.day, period: target.period };
        if (targetSlot) newSlots = newSlots.map(s => s.id === targetSlot.id ? newTargetSlot : s);
        else newSlots = [...newSlots, newTargetSlot];
      } else {
        if (targetSlot) {
          newSlots = newSlots.map(s => {
            if (s.id === sourceSlot.id) return { ...targetSlot, day: source.day, period: source.period };
            if (s.id === targetSlot.id) return { ...sourceSlot, day: target.day, period: target.period };
            return s;
          });
        } else {
          newSlots = newSlots.map(s => s.id === sourceSlot.id ? { ...s, day: target.day, period: target.period } : s);
        }
      }
      return { ...prev, weeklySlots: newSlots };
    });
  };

  const handleFillScheduleSlots = (source: { day: number, period: number }, range: { startDay: number, endDay: number, startPeriod: number, endPeriod: number }, classId: string) => {
    setSchedule(prev => {
      if (!prev) return null;
      const sourceSlot = prev.weeklySlots.find(s => s.day === source.day && s.period === source.period && s.classId === classId);
      if (!sourceSlot) return prev;
      let newSlots = [...prev.weeklySlots];
      for (let d = range.startDay; d <= range.endDay; d++) {
        for (let p = range.startPeriod; p <= range.endPeriod; p++) {
          if (d === source.day && p === source.period) continue;
          const existing = newSlots.find(s => s.day === d && s.period === p && s.classId === classId);
          const filledSlot = { ...sourceSlot, id: Math.random().toString(36).substr(2, 9), day: d, period: p };
          if (existing) newSlots = newSlots.map(s => s.id === existing.id ? filledSlot : s);
          else newSlots.push(filledSlot);
        }
      }
      return { ...prev, weeklySlots: newSlots };
    });
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;
    
    // Always use current profile state to ensure specialInstructions are captured
    const currentInputState = { 
      teachers, 
      classes, 
      lockedSlots, 
      subjects, 
      special: profile.specialInstructions || "" 
    };
    
    const currentHash = computeInputHash(currentInputState);
    if (currentHash === lastInputHash) {
      const confirm = window.confirm("Configuration identical to last sync. Force re-synchronization?");
      if (!confirm) return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setValidationIssues([]);
    setLoadingMsg("Initializing Parallel Infrastructure Sync...");
    
    try {
      const currentProfile: SchoolProfile = { 
        ...profile, 
        teachers, 
        classes, 
        textbooks, 
        lockedSlots, 
        subjects,
        specialInstructions: profile.specialInstructions || ""
      };
      
      const { slots, validation } = await generateWeeklyMaster(
        teachers, 
        lockedSlots, 
        classes, 
        currentProfile, 
        true, // Power mode
        (msg) => setLoadingMsg(msg)
      );
      
      setSchedule(prev => ({ 
        ...prev, 
        weeklySlots: slots, 
        quarterlyPlan: prev?.quarterlyPlan || { quarterName: 'Term 1', weeks: [] } 
      }));
      setLastInputHash(currentHash);
      if (validation.issues.length > 0) setValidationIssues(validation.issues);
      setIsLoading(false);
    } catch (e: any) {
      setErrorMessage(`Sync Failure: ${e.message || "Parallel optimization pipeline interrupted."}`);
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  if (!user) return <Auth />;
  if (!profile) return <Onboarding onComplete={(p) => { setProfile(p); setTeachers(p.teachers); setClasses(p.classes); setSubjects(p.subjects); }} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="mb-8 no-print flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-100 p-4 rounded-[2rem] border border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${computeInputHash({ teachers, classes, lockedSlots, subjects, special: profile.specialInstructions || "" }) === lastInputHash ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {computeInputHash({ teachers, classes, lockedSlots, subjects, special: profile.specialInstructions || "" }) === lastInputHash ? 'System State: Synchronized' : 'Drafting Phase: Local Changes Detected'}
          </span>
        </div>
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Engine Optimization: Parallel Batch Mode
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn space-y-8">
          <div className="relative">
             <div className="w-24 h-24 border-[8px] border-indigo-100 rounded-full"></div>
             <div className="w-24 h-24 border-[8px] border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center max-w-sm">
            <p className="text-[14px] font-black text-slate-900 uppercase tracking-[0.4em] mb-4">{loadingMsg}</p>
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Applying AI Tuning & Constraints...</p>
          </div>
        </div>
      ) : (
        <>
          {(errorMessage || validationIssues.length > 0) && (
            <div className="mb-8 p-8 bg-rose-50 border-2 border-rose-200 rounded-[2.5rem] space-y-4 animate-fadeIn shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 className="font-black text-rose-900 uppercase text-xs tracking-tight">Logic Validation Report</h4>
                  <p className="text-rose-600 font-bold text-[10px] uppercase tracking-widest mt-0.5">{errorMessage || "The schedule has been generated but contains minor constraint conflicts."}</p>
                </div>
              </div>
              
              {validationIssues.length > 0 && (
                <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {validationIssues.map((issue, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 bg-white/50 rounded-xl border border-rose-100">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></div>
                      <p className="text-[10px] font-bold text-rose-800 uppercase tracking-tight leading-relaxed">{issue}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-4 items-center pt-2">
                <button onClick={() => { setErrorMessage(null); setValidationIssues([]); }} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Dismiss Warnings</button>
                <button onClick={handleGenerateMaster} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">Rerunning Optimized Weaver</button>
              </div>
            </div>
          )}

          {activeTab === 'home' && <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onResync={() => setActiveTab('setup')} onJump={handleEntityJump} />}
          {activeTab === 'setup' && <ScheduleForm profile={profile} setProfile={setProfile} teachers={teachers} setTeachers={setTeachers} classes={classes} setClasses={setClasses} textbooks={textbooks} setTextbooks={setTextbooks} lockedSlots={lockedSlots} setLockedSlots={setLockedSlots} subjects={subjects} setSubjects={setSubjects} onGenerate={handleGenerateMaster} schedule={schedule} onNavigate={setActiveTab} />}
          {activeTab === 'homerooms' && <ScheduleViewer schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} classes={classes} teachers={teachers} subjects={subjects} textbooks={textbooks} lockedSlots={lockedSlots} profile={profile} onGenerateRoadmap={() => {}} onUpdateSlot={handleUpdateScheduleSlot} onMoveSlot={handleMoveScheduleSlot} onFillSlots={handleFillScheduleSlots} onNavigate={setActiveTab} onRegenerate={handleGenerateMaster} onJump={handleEntityJump} initialClassId={navigationFocus?.type === 'class' ? navigationFocus.id : undefined} />}
          {activeTab === 'curriculum' && <CurriculumRoadmap textbooks={textbooks} onUpdateTextbooks={setTextbooks} subjects={subjects} classes={classes} onUpdateClasses={setClasses} />}
          {activeTab === 'faculty' && <TeacherView schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} teachers={teachers} classes={classes} subjects={subjects} lockedSlots={lockedSlots} profile={profile} initialTeacherId={navigationFocus?.type === 'teacher' ? navigationFocus.id : undefined} />}
          {activeTab === 'settings' && <Settings user={user} profile={profile} teachers={teachers} schedule={schedule} onReset={() => clearUserData(user.uid).then(() => window.location.reload())} onLogout={() => signOut(auth)} />}
        </>
      )}
    </Layout>
  );
};

export default App;
