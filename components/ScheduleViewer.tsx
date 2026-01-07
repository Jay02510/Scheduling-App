import React, { useState } from 'react';
import { SchoolSchedule, ClassGroup, Teacher, SchoolProfile, SubjectConfig, ScheduleSlot } from '../types';

interface ScheduleViewerProps {
  schedule: SchoolSchedule;
  classes: ClassGroup[];
  teachers: Teacher[];
  subjects: SubjectConfig[];
  profile: SchoolProfile | null;
  onGenerateRoadmap: () => void;
  onUpdateSlot?: (slot: ScheduleSlot) => void;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ schedule, classes, teachers, subjects, profile, onGenerateRoadmap, onUpdateSlot }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [viewMode, setViewMode] = useState<'individual' | 'roadmap'>('individual');
  const [verificationResult, setVerificationResult] = useState<{ type: 'clean' | 'clash'; issues: string[] } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Edit Slot State
  const [editingSlot, setEditingSlot] = useState<{ day: number, period: number } | null>(null);

  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];
  const totalPeriods = profile?.hours.totalPeriods || 8;

  const currentClass = classes.find(c => c.id === selectedClassId);
  const classSlots = schedule.weeklySlots.filter(s => s.classId === selectedClassId);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  const checkClashes = () => {
    setIsVerifying(true);
    const issues: string[] = [];
    const teacherAssignments: Record<string, ScheduleSlot[]> = {};
    const classAssignments: Record<string, ScheduleSlot[]> = {};

    schedule.weeklySlots.forEach(slot => {
      const tKey = `${slot.day}-${slot.period}-${slot.teacherId}`;
      if (!teacherAssignments[tKey]) teacherAssignments[tKey] = [];
      teacherAssignments[tKey].push(slot);

      const cKey = `${slot.day}-${slot.period}-${slot.classId}`;
      if (!classAssignments[cKey]) classAssignments[cKey] = [];
      classAssignments[cKey].push(slot);
    });

    Object.entries(teacherAssignments).forEach(([key, slots]) => {
      if (slots.length > 1) {
        const teacher = teachers.find(t => t.id === slots[0].teacherId);
        const [day, period] = key.split('-');
        const classNames = slots.map(s => classes.find(c => c.id === s.classId)?.name).join(' & ');
        issues.push(`Teacher Clash: ${teacher?.name} assigned to ${classNames} on Day ${parseInt(day)+1}, Period ${parseInt(period)+1}`);
      }
    });

    Object.entries(classAssignments).forEach(([key, slots]) => {
      if (slots.length > 1) {
        const cls = classes.find(c => c.id === slots[0].classId);
        const [day, period] = key.split('-');
        issues.push(`Class Clash: ${cls?.name} has multiple subjects scheduled on Day ${parseInt(day)+1}, Period ${parseInt(period)+1}`);
      }
    });

    setTimeout(() => {
      setVerificationResult({ type: issues.length > 0 ? 'clash' : 'clean', issues });
      setIsVerifying(false);
    }, 800);
  };

  const handleSlotEdit = (subjectId: string) => {
    if (!editingSlot || !onUpdateSlot) return;
    
    if (subjectId === '') {
      onUpdateSlot({
        id: '',
        day: editingSlot.day,
        period: editingSlot.period,
        classId: selectedClassId,
        subjectId: '',
        teacherId: ''
      });
    } else {
      const assignment = currentClass?.assignments.find(a => a.subjectId === subjectId);
      if (assignment) {
        onUpdateSlot({
          id: Math.random().toString(36).substr(2, 9),
          day: editingSlot.day,
          period: editingSlot.period,
          classId: selectedClassId,
          subjectId: subjectId,
          teacherId: assignment.teacherId
        });
      }
    }
    setEditingSlot(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Edit Overlay */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-fadeIn">
            <h3 className="text-xl font-black text-slate-900 mb-2">Edit Period</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
              Day {editingSlot.day + 1}, Period {editingSlot.period + 1} for {currentClass?.name}
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleSlotEdit('')}
                className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
              >
                Clear Slot
              </button>
              {currentClass?.assignments.map(a => (
                <button 
                  key={a.subjectId}
                  onClick={() => handleSlotEdit(a.subjectId)}
                  className="w-full py-5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-900 font-black text-[11px] uppercase tracking-widest hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between px-6"
                >
                  <span>{getSubjectName(a.subjectId)}</span>
                  <span className="text-[8px] text-slate-400 font-bold">{getTeacherName(a.teacherId)}</span>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setEditingSlot(null)}
              className="mt-8 w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setViewMode('individual')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Class Schedules</button>
          <button onClick={() => setViewMode('roadmap')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'roadmap' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Lesson Roadmap</button>
        </div>
        
        <div className="flex gap-2 items-center">
          <button 
            onClick={checkClashes}
            disabled={isVerifying}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
              verificationResult?.type === 'clash' ? 'bg-rose-50 border-rose-200 text-rose-600' : 
              verificationResult?.type === 'clean' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
              'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200'
            }`}
          >
            {isVerifying ? (
              <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
            ) : verificationResult?.type === 'clash' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            ) : verificationResult?.type === 'clean' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            )}
            {isVerifying ? 'Scanning...' : verificationResult ? 'Rerun Audit' : 'Verify Integrity'}
          </button>

          <div className="w-px h-8 bg-slate-200 mx-2 hidden xl:block"></div>

          <div className="flex gap-2 overflow-x-auto max-w-full pb-2 xl:pb-0 scrollbar-hide">
            {classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'individual' ? (
        <div className="bg-white border-[3px] border-slate-900 rounded-[1rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)]">
          <table className="w-full border-collapse">
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

                    if (lock) {
                      return (
                        <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 min-w-[180px] bg-slate-100">
                          <div className="h-full flex items-center justify-center p-4 text-center">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{lock.name}</span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={dIdx} 
                        onClick={() => setEditingSlot({ day: dIdx, period: pIdx })}
                        className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 min-w-[180px] bg-white group hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {slot ? (
                          <div className="h-full flex flex-col relative">
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                              <span className="text-[13px] font-black text-slate-900 uppercase leading-tight">{getSubjectName(slot.subjectId)}</span>
                              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="h-12 flex items-center justify-center border-t-[3px] border-slate-900" style={{ backgroundColor: teacher?.color || '#cbd5e1' }}>
                              <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">{getTeacherName(slot.teacherId)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)] group-hover:opacity-10 transition-opacity flex items-center justify-center">
                             <span className="text-[8px] font-black uppercase text-slate-400 opacity-0 group-hover:opacity-100">Add Slot</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-8">
          {schedule.quarterlyPlan.weeks.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] text-center space-y-4 border border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">ROADMAP PENDING</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-[11px] font-bold uppercase tracking-widest">Synthesize a pacing roadmap based on textbook data</p>
              <button onClick={onGenerateRoadmap} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest mt-6 shadow-2xl hover:scale-105 transition-all">Generate Roadmap</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 12 }).map((_, i) => {
                const weekNum = i + 1;
                const targets = schedule.quarterlyPlan.weeks.filter(w => w.weekNumber === weekNum);
                return (
                  <div key={weekNum} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <h4 className="text-2xl font-black text-slate-900">WEEK {weekNum}</h4>
                    <div className="space-y-3">
                      {targets.map((t, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-1">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{t.subject}</p>
                          <p className="font-bold text-slate-800 text-xs">{t.unit}</p>
                          <p className="text-[10px] font-black text-slate-400 mt-2 uppercase">Target: pp. {t.pages}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleViewer;