
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
import ResourcePlanner from './components/ResourcePlanner';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastInputHash, setLastInputHash] = useState<string>('');
  const [optimizationTier, setOptimizationTier] = useState<'standard' | 'deep'>('standard');

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
          setLastInputHash(cloudData.lastInputHash || '');
          setOptimizationTier(cloudData.optimizationTier || 'standard');
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save with debounce and include hash/tier metadata
  useEffect(() => {
    if (user && profile && !isLoading) {
      const dataToSave = {
        profile: { ...profile, teachers, classes, textbooks, lockedSlots, subjects },
        teachers, classes, textbooks, lockedSlots, subjects, schedule,
        lastInputHash, optimizationTier
      };
      const timeoutId = setTimeout(() => { saveUserData(user.uid, dataToSave); }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, teachers, classes, textbooks, lockedSlots, subjects, schedule, isLoading, lastInputHash, optimizationTier]);

  // Handler for manual slot updates (e.g., clearing or reassigning a slot)
  const handleUpdateScheduleSlot = (updatedSlot: ScheduleSlot) => {
    setSchedule(prev => {
      if (!prev) return null;
      const existing = prev.weeklySlots.find(s => s.day === updatedSlot.day && s.period === updatedSlot.period && s.classId === updatedSlot.classId);
      let newSlots;
      if (existing) {
        if (!updatedSlot.subjectId) {
          // Clearing slot
          newSlots = prev.weeklySlots.filter(s => s.id !== existing.id);
        } else {
          // Updating existing
          newSlots = prev.weeklySlots.map(s => s.id === existing.id ? { ...updatedSlot, id: existing.id } : s);
        }
      } else {
        if (!updatedSlot.subjectId) return prev;
        // Adding new slot
        newSlots = [...prev.weeklySlots, updatedSlot];
      }
      return { ...prev, weeklySlots: newSlots };
    });
  };

  // Handler for moving or swapping slots via drag and drop
  const handleMoveScheduleSlot = (source: { day: number, period: number }, target: { day: number, period: number }, classId: string, isCopy: boolean) => {
    setSchedule(prev => {
      if (!prev) return null;
      const sourceSlot = prev.weeklySlots.find(s => s.day === source.day && s.period === source.period && s.classId === classId);
      if (!sourceSlot) return prev;

      const targetSlot = prev.weeklySlots.find(s => s.day === target.day && s.period === target.period && s.classId === classId);
      
      let newSlots = prev.weeklySlots;

      if (isCopy) {
        // Create new slot at target, preserving original
        const newTargetSlot = { ...sourceSlot, id: Math.random().toString(36).substr(2, 9), day: target.day, period: target.period };
        if (targetSlot) {
          newSlots = newSlots.map(s => s.id === targetSlot.id ? newTargetSlot : s);
        } else {
          newSlots = [...newSlots, newTargetSlot];
        }
      } else {
        // Swap or Move
        if (targetSlot) {
          // Perform swap between source and target
          newSlots = newSlots.map(s => {
            if (s.id === sourceSlot.id) return { ...targetSlot, day: source.day, period: source.period };
            if (s.id === targetSlot.id) return { ...sourceSlot, day: target.day, period: target.period };
            return s;
          });
        } else {
          // Simple move to empty slot
          newSlots = newSlots.map(s => s.id === sourceSlot.id ? { ...s, day: target.day, period: target.period } : s);
        }
      }
      return { ...prev, weeklySlots: newSlots };
    });
  };

  // Handler for bulk filling slots (e.g., replicating a subject across multiple days/periods)
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
          
          if (existing) {
            newSlots = newSlots.map(s => s.id === existing.id ? filledSlot : s);
          } else {
            newSlots.push(filledSlot);
          }
        }
      }
      return { ...prev, weeklySlots: newSlots };
    });
  };

  const handleGenerateMaster = async () => {
    if (!user || !profile) return;

    // Check if anything actually changed to save API costs
    const currentInputState = { teachers, classes, lockedSlots, subjects, special: profile.specialInstructions };
    const currentHash = computeInputHash(currentInputState);
    
    if (currentHash === lastInputHash) {
      const confirm = window.confirm("Input data has not changed since last generation. Regenerating will consume API credits. Continue?");
      if (!confirm) return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingMsg(optimizationTier === 'deep' ? "Deep Solve: Engaging Pro reasoning..." : "Standard Solve: Using Flash core...");
    
    try {
      const currentProfile: SchoolProfile = { ...profile, teachers, classes, textbooks, lockedSlots, subjects };
      const slots = await generateWeeklyMaster(
        teachers, 
        lockedSlots, 
        classes, 
        currentProfile, 
        optimizationTier === 'deep'
      );
      
      setSchedule(prev => ({ ...prev, weeklySlots: slots, quarterlyPlan: prev?.quarterlyPlan || { quarterName: 'Term 1', weeks: [] } }));
      setLastInputHash(currentHash);
      setIsLoading(false);
    } catch (e: any) {
      setErrorMessage(e.message || "Optimization failed.");
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
          <div className={`w-3 h-3 rounded-full ${computeInputHash({ teachers, classes, lockedSlots, subjects, special: profile.specialInstructions }) === lastInputHash ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {computeInputHash({ teachers, classes, lockedSlots, subjects, special: profile.specialInstructions }) === lastInputHash ? 'Database Synchronized' : 'Changes Pending Sync'}
          </span>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button onClick={() => setOptimizationTier('standard')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${optimizationTier === 'standard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Flash (Standard)</button>
          <button onClick={() => setOptimizationTier('deep')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${optimizationTier === 'deep' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Pro (Deep Solve)</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn space-y-8">
          <div className="w-16 h-16 border-[6px] border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">{loadingMsg}</p>
        </div>
      ) : (
        <>
          {errorMessage && <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-[2rem] text-rose-600 font-bold text-xs uppercase tracking-tight">{errorMessage}</div>}
          {activeTab === 'home' && <Dashboard teachers={teachers} classes={classes} textbooks={textbooks} onJump={(id, type) => { setActiveTab(type === 'teacher' ? 'faculty' : 'homerooms'); }} />}
          {activeTab === 'setup' && <ScheduleForm profile={profile} setProfile={setProfile} teachers={teachers} setTeachers={setTeachers} classes={classes} setClasses={setClasses} textbooks={textbooks} setTextbooks={setTextbooks} lockedSlots={lockedSlots} setLockedSlots={setLockedSlots} subjects={subjects} setSubjects={setSubjects} onGenerate={handleGenerateMaster} schedule={schedule} onNavigate={setActiveTab} />}
          {activeTab === 'homerooms' && <ScheduleViewer schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} classes={classes} teachers={teachers} subjects={subjects} textbooks={textbooks} lockedSlots={lockedSlots} profile={profile} onGenerateRoadmap={() => {}} onUpdateSlot={handleUpdateScheduleSlot} onMoveSlot={handleMoveScheduleSlot} onFillSlots={handleFillScheduleSlots} onNavigate={setActiveTab} onRegenerate={handleGenerateMaster} />}
          {activeTab === 'faculty' && <TeacherView schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} teachers={teachers} classes={classes} subjects={subjects} lockedSlots={lockedSlots} profile={profile} />}
          {activeTab === 'resources' && <ResourcePlanner textbooks={textbooks} onUpdate={setTextbooks} profile={profile} classes={classes} />}
          {activeTab === 'audit' && profile && <AnalyticsDashboard schedule={schedule || { weeklySlots: [], quarterlyPlan: { quarterName: '', weeks: [] } }} profile={profile} teachers={teachers} />}
          {activeTab === 'settings' && <Settings user={user} profile={profile} onReset={() => clearUserData(user.uid).then(() => window.location.reload())} onLogout={() => signOut(auth)} />}
        </>
      )}
    </Layout>
  );
};

export default App;
