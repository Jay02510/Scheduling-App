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
        id: Math.random().toString(36).substr(2, 9),
        day: editingSlot.day,
        period: editingSlot.period,
        classId: selectedClassId,
        subjectId: '',
        teacherId: '',
        isManualOverride: true
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
          teacherId: assignment.teacherId,
          isManualOverride: true
        });
      }
    }
    setEditingSlot(null);
  };

  // If we have no schedule data, show the builder CTA
  if (!schedule || (schedule.weeklySlots.length === 0 && !editingSlot)) {
      return (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-500 mb-8 shadow-inner">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">NO TIMETABLE GENERATED</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-sm mb-8 leading-loose">The school schedule hasn't been built yet. Return to the setup tab and click "Build Timetable" to generate it with AI or start manual editing.</p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <button onClick={() => window.location.hash = 'setup'} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Go to School Setup</button>
                <button onClick={() => setSelectedClassId(classes[0]?.id || '')} className="bg-white text-indigo-600 border border-indigo-200 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 transition-all">Manual Setup</button>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative pb-20">
      {/* Edit Overlay */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-slate-100 animate-fadeIn overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Edit Period</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 pb-4 border-b border-slate-100">
              {days[editingSlot.day]} • Period {editingSlot.period + 1} for {currentClass?.name}
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleSlotEdit('')}
                className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 mb-4"
              >
                Clear Period
              </button>

              <div className="space-y-2">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 block">Assigned Staff</span>
                 {currentClass?.assignments.length === 0 ? (
                     <p className="p-6 bg-slate-50 rounded-2xl text-[9px] font-black text-slate-300 uppercase text-center italic">No lessons assigned to this class in setup.</p>
                 ) : currentClass?.assignments.map(a => (
                    <button 
                      key={a.subjectId}
                      onClick={() => handleSlotEdit(a.subjectId)}
                      className="w-full py-5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-900 font-black text-[11px] uppercase tracking-widest hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-between px-6 group"
                    >
                      <span>{getSubjectName(a.subjectId)}</span>
                      <span className="text-[8px] text-slate-400 font-bold group-hover:text-indigo-500">{getTeacherName(a.teacherId)}</span>
                    </button>
                  ))}
              </div>
            </div>
            
            <button 
              onClick={() => setEditingSlot(null)}
              className="mt-10 w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setViewMode('individual')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Class Grids</button>
          <button onClick={() => setViewMode('roadmap')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'roadmap' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Syllabus Map</button>
        </div>
        
        <div className="flex gap-2 items-center flex-wrap justify-center">
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
            {isVerifying ? 'Scanning...' : verificationResult ? 'Rerun Scan' : 'Audit Data'}
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
        <div className="bg-white border-[3px] border-slate-900 rounded-[1.5rem] overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.05)] max-w-full overflow-x-auto">
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
                    const isLunch = pIdx === profile?.hours.lunchAfterPeriod;

                    if (lock) {
                      return (
                        <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 bg-slate-100">
                          <div className="h-full flex items-center justify-center p-4 text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lock.name}</span>
                          </div>
                        </td>
                      );
                    }

                    if (isLunch && !slot) {
                        return (
                          <td key={dIdx} className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 bg-slate-50">
                            <div className="h-full flex items-center justify-center p-4 text-center">
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Lunch Break</span>
                            </div>
                          </td>
                        );
                    }

                    return (
                      <td 
                        key={dIdx} 
                        onClick={() => setEditingSlot({ day: dIdx, period: pIdx })}
                        className="border-r-[3px] last:border-r-0 border-slate-900 p-0 h-36 bg-white group hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {slot && slot.subjectId ? (
                          <div className="h-full flex flex-col relative">
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                              <span className="text-[13px] font-black text-slate-900 uppercase leading-tight">{getSubjectName(slot.subjectId)}</span>
                              {slot.isManualOverride && (
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className="text-[6px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase">USER</span>
                                </div>
                              )}
                              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="h-12 flex items-center justify-center border-t-[3px] border-slate-900" style={{ backgroundColor: teacher?.color || '#cbd5e1' }}>
                              <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest truncate px-2">{getTeacherName(slot.teacherId)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_6px)] group-hover:opacity-20 transition-opacity flex items-center justify-center">
                             <span className="text-[9px] font-black uppercase text-slate-400 opacity-0 group-hover:opacity-100">+ Click to Edit</span>
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
            <div className="bg-white p-20 rounded-[3rem] text-center space-y-4 border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">SYLLABUS UNMAPPED</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-[11px] font-bold uppercase tracking-widest leading-loose">Synthesize a precise teaching roadmap based on institutional textbook configuration.</p>
              <button onClick={onGenerateRoadmap} className="bg-[#0f172a] text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest mt-6 shadow-2xl hover:scale-105 transition-all">Map Curriculum Now</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {schedule.quarterlyPlan.weeks.map((week, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:border-indigo-100 transition-all">
                    <div className="flex justify-between items-start">
                        <h4 className="text-2xl font-black text-slate-900">WEEK {week.weekNumber}</h4>
                        {week.isHolidayWeek && <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase">Holiday</span>}
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl space-y-1 border border-transparent group-hover:bg-indigo-50/50 transition-colors">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{week.subject}</p>
                      <p className="font-bold text-slate-800 text-xs leading-relaxed">{week.unit}</p>
                      <p className="text-[10px] font-black text-slate-400 mt-4 uppercase flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                        Target: pp. {week.pages}
                      </p>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleViewer;