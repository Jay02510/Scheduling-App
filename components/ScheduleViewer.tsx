import React, { useState, useMemo } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, SubjectConfig, ScheduleSlot } from '../types';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  subjects: SubjectConfig[];
  profile: SchoolProfile | null;
  onGenerateRoadmap: () => void;
  onUpdateSlot?: (slot: ScheduleSlot) => void;
  onNavigate?: (tab: string) => void;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, subjects, profile, onGenerateRoadmap, onUpdateSlot, onNavigate }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [viewMode, setViewMode] = useState<'individual' | 'roadmap'>('individual');
  const [verificationResult, setVerificationResult] = useState<{ type: 'clean' | 'clash'; issues: string[] } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [editingSlot, setEditingSlot] = useState<{ day: number, period: number } | null>(null);

  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours.totalPeriods || 8;

  const currentClass = classes.find(c => c.id === selectedClassId);
  const classSlots = schedule.weeklySlots.filter(s => s.classId === selectedClassId);

  // Requirement Fulfillment Tracker
  const fulfillment = useMemo(() => {
    if (!currentClass) return [];
    return currentClass.assignments.map(a => {
      const subject = subjects.find(s => s.id === a.subjectId);
      const scheduledCount = classSlots.filter(s => s.subjectId === a.subjectId).length;
      const target = subject?.frequencyPerWeek || 0;
      return {
        subject: subject?.name || 'Unknown',
        target,
        current: scheduledCount,
        status: scheduledCount >= target ? 'complete' : 'pending'
      };
    });
  }, [currentClass, classSlots, subjects]);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  const checkClashes = () => {
    setIsVerifying(true);
    const issues: string[] = [];
    const teacherMap: Record<string, string[]> = {};

    schedule.weeklySlots.forEach(slot => {
      const key = `${slot.day}-${slot.period}-${slot.teacherId}`;
      if (!teacherMap[key]) teacherMap[key] = [];
      teacherMap[key].push(classes.find(c => c.id === slot.classId)?.name || 'Unknown Class');
    });

    Object.entries(teacherMap).forEach(([key, classNames]) => {
      if (classNames.length > 1) {
        const [day, period, tId] = key.split('-');
        const tName = teachers.find(t => t.id === tId)?.name || 'Staff';
        issues.push(`${tName} double-booked: ${classNames.join(' & ')} (Day ${parseInt(day)+1}, Period ${parseInt(period)+1})`);
      }
    });

    setTimeout(() => {
      setVerificationResult({ type: issues.length > 0 ? 'clash' : 'clean', issues });
      setIsVerifying(false);
    }, 800);
  };

  const handleApplyChange = (subjectId: string) => {
    if (!editingSlot || !onUpdateSlot) return;
    
    if (subjectId === '') {
      onUpdateSlot({
        id: Math.random().toString(36).substr(2, 9),
        day: editingSlot.day,
        period: editingSlot.period,
        classId: selectedClassId,
        subjectId: '',
        teacherId: '',
        isManualOverride: true
      });
    } else {
      const pair = currentClass?.assignments.find(a => a.subjectId === subjectId);
      if (pair) {
        onUpdateSlot({
          id: Math.random().toString(36).substr(2, 9),
          day: editingSlot.day,
          period: editingSlot.period,
          classId: selectedClassId,
          subjectId: subjectId,
          teacherId: pair.teacherId,
          isManualOverride: true
        });
      }
    }
    setEditingSlot(null);
  };

  if (!schedule || (schedule.weeklySlots.length === 0 && !editingSlot)) {
      return (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-500 mb-8 shadow-inner">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">Timetable Pending</h2>
              <button onClick={() => onNavigate?.('setup')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Go to Setup</button>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative pb-20">
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Edit Slot</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 pb-4 border-b">
              {days[editingSlot.day]} • Period {editingSlot.period + 1} • {currentClass?.name}
            </p>
            <div className="space-y-3">
              <button onClick={() => handleApplyChange('')} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 mb-4">Clear Period</button>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 block">Assigned Lessons</span>
              {currentClass?.assignments.length === 0 ? (
                <p className="p-8 bg-slate-50 rounded-2xl text-[9px] font-black text-slate-300 uppercase text-center italic">No lessons assigned in Setup.</p>
              ) : currentClass?.assignments.map(a => (
                <button key={a.subjectId} onClick={() => handleApplyChange(a.subjectId)} className="w-full py-5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-900 font-black text-[11px] uppercase tracking-widest hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between px-6 group">
                  <span>{getSubjectName(a.subjectId)}</span>
                  <span className="text-[8px] text-slate-400 font-bold group-hover:text-indigo-500">{getTeacherName(a.teacherId)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setEditingSlot(null)} className="mt-10 w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">Close Window</button>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setViewMode('individual')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Class Grids</button>
          <button onClick={() => setViewMode('roadmap')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'roadmap' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Syllabus Plan</button>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-center">
          <button onClick={checkClashes} disabled={isVerifying} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${verificationResult?.type === 'clash' ? 'bg-rose-50 border-rose-200 text-rose-600' : verificationResult?.type === 'clean' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
            {isVerifying ? 'Scanning...' : verificationResult?.type === 'clash' ? 'Clash Found' : verificationResult?.type === 'clean' ? 'Audit Clean' : 'Audit Data'}
          </button>
          <div className="w-px h-8 bg-slate-200 mx-2 hidden xl:block"></div>
          <div className="flex gap-2 overflow-x-auto max-w-full pb-2 xl:pb-0 scrollbar-hide">
            {classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'individual' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
           <div className="xl:col-span-9 bg-white border-[3px] border-slate-900 rounded-[1.5rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b-[3px] border-slate-900">
                    <th className="border-r-[3px] border-slate-900 p-6 text-[12px] font-black uppercase text-slate-800 w-32">Period</th>
                    {days.map(d => <th key={d} className="border-r-[3px] last:border-r-0 border-slate-900 p-6 text-[11px] font-black uppercase text-slate-800">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: totalPeriods }).map((_, pIdx) => (
                    <tr key={pIdx} className="border-b-[3px] border-slate-900 last:border-b-0">
                      <td className="border-r-[3px] border-slate-900 p-8 text-center font-black text-slate-900 text-5xl bg-slate-50">{pIdx + 1}</td>
                      {Array.from({ length: 5 }).map((_, dIdx) => {
                        const lock = profile?.lockedSlots.find(f => f.dayOfWeek === dIdx && f.period === pIdx && (f.isSchoolWide || f.classIds.includes(selectedClassId)));
                        const slot = classSlots.find(s => s.day === dIdx && s.period === pIdx);
                        const teacher = teachers.find(t => t.id === slot?.teacherId);
                        if (lock) return <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 bg-slate-100"><div className="h-full flex items-center justify-center p-4 text-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lock.name}</span></div></td>;
                        return (
                          <td key={dIdx} onClick={() => setEditingSlot({ day: dIdx, period: pIdx })} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 bg-white group hover:bg-slate-50 transition-colors cursor-pointer">
                            {slot && slot.subjectId ? (
                              <div className="h-full flex flex-col relative">
                                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                                  <span className="text-[13px] font-black text-slate-900 uppercase leading-tight">{getSubjectName(slot.subjectId)}</span>
                                  {slot.isManualOverride && <div className="absolute top-2 right-2"><span className="text-[6px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase">MOD</span></div>}
                                </div>
                                <div className="h-12 flex items-center justify-center border-t-[3px] border-slate-900" style={{ backgroundColor: teacher?.color || '#cbd5e1' }}><span className="text-[10px] font-black uppercase text-slate-900 tracking-widest truncate px-2">{getTeacherName(slot.teacherId)}</span></div>
                              </div>
                            ) : <div className="h-full opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)] flex items-center justify-center"><span className="text-[9px] font-black uppercase text-slate-400 opacity-0 group-hover:opacity-100">+ Assign</span></div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
           <div className="xl:col-span-3 space-y-6">
              <div className="bg-[#0f172a] p-8 rounded-[2rem] text-white shadow-xl">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Target Fulfillment</h4>
                 <div className="space-y-4">
                    {fulfillment.map((item, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase truncate max-w-[120px]">{item.subject}</span>
                            <span className={`text-[8px] font-bold ${item.status === 'complete' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.current} / {item.target}
                            </span>
                         </div>
                         <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${item.status === 'complete' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (item.current / item.target) * 100)}%` }}></div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100 shadow-sm">
           <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-10">Map detailed curriculum targets based on your textbooks.</p>
           <button onClick={onGenerateRoadmap} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Build Roadmap</button>
        </div>
      )}
    </div>
  );
};

export default ScheduleViewer;