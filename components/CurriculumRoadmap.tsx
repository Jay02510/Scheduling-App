
import React, { useState } from 'react';
import { Textbook, SubjectConfig, ClassGroup, ClassSubjectAssignment } from '../types';

interface CurriculumRoadmapProps {
  textbooks: Textbook[];
  onUpdateTextbooks: (books: Textbook[]) => void;
  subjects: SubjectConfig[];
  classes: ClassGroup[];
  onUpdateClasses?: (classes: ClassGroup[]) => void;
}

const CurriculumRoadmap: React.FC<CurriculumRoadmapProps> = ({ 
  textbooks, 
  onUpdateTextbooks, 
  subjects, 
  classes,
  onUpdateClasses 
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  const quarters = [
    { id: 0, label: '1st Quarter', semester: 'S1', months: 'Mar-May' },
    { id: 1, label: '2nd Quarter', semester: 'S1', months: 'Jun-Aug' },
    { id: 2, label: '3rd Quarter', semester: 'S2', months: 'Sep-Nov' },
    { id: 3, label: '4th Quarter', semester: 'S2', months: 'Dec-Feb' },
  ];

  const currentClass = classes.find(c => c.id === selectedClassId);
  
  // FIX: Proper HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, quarterId: number, subjectName: string) => {
    e.preventDefault();
    const bookId = e.dataTransfer.getData('text/plain');
    if (!bookId) return;

    const updated = textbooks.map(t => 
      t.id === bookId ? { ...t, assignedQuarter: quarterId, subject: subjectName, classId: selectedClassId } : t
    );
    onUpdateTextbooks(updated);
  };

  const toggleSubjectForClass = (subId: string) => {
    if (!currentClass || !onUpdateClasses) return;
    const isAssigned = currentClass.assignments.some(a => a.subjectId === subId);
    
    const updatedAssignments = isAssigned
      ? currentClass.assignments.filter(a => a.subjectId !== subId)
      : [...currentClass.assignments, { subjectId: subId, teacherId: '', semesterFocus: 'Both' } as ClassSubjectAssignment];

    onUpdateClasses(classes.map(c => c.id === selectedClassId ? { ...c, assignments: updatedAssignments } : c));
  };

  const updateSemesterFocus = (subId: string, focus: 'S1' | 'S2' | 'Both') => {
    if (!currentClass || !onUpdateClasses) return;
    const updatedAssignments = currentClass.assignments.map(a => 
      a.subjectId === subId ? { ...a, semesterFocus: focus } : a
    );
    onUpdateClasses(classes.map(c => c.id === selectedClassId ? { ...c, assignments: updatedAssignments } : c));
  };

  const handleAddBook = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const assignedSubjects = currentClass?.assignments.map(a => subjects.find(s => s.id === a.subjectId)?.name).filter(Boolean) || [];
    
    const newBook: Textbook = {
      id: newId,
      title: 'New Textbook Title',
      subject: assignedSubjects[0] || 'General',
      gradeLevel: currentClass?.grade || 'G1',
      totalChapters: 12,
      totalPages: 120,
      classId: selectedClassId
    };
    onUpdateTextbooks([...textbooks, newBook]);
    setEditingBookId(newId);
  };

  if (!currentClass) return null;

  // Onboarding View: If class has no subjects or user enters Config Mode
  if (!currentClass.isCurriculumOnboarded || isConfigMode) {
    return (
      <div className="space-y-10 animate-fadeIn pb-24 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Class Onboarding</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Designating Instructional Streams for {currentClass.name}</p>
          </div>
          <button 
            onClick={() => {
               if (onUpdateClasses) onUpdateClasses(classes.map(c => c.id === selectedClassId ? { ...c, isCurriculumOnboarded: true } : c));
               setIsConfigMode(false);
            }} 
            className="px-8 py-4 bg-[#0f172a] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
          >
            Confirm & View Map
          </button>
        </header>

        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(sub => {
                const assignment = currentClass.assignments.find(a => a.subjectId === sub.id);
                const isActive = !!assignment;
                return (
                  <div key={sub.id} className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${isActive ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-50 bg-slate-50/50 opacity-60'}`}>
                    <div className="flex items-center gap-4">
                       <button onClick={() => toggleSubjectForClass(sub.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 bg-white'}`}>
                          {isActive && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                       </button>
                       <div>
                          <p className="font-black text-slate-900 uppercase text-xs">{sub.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sub.frequencyPerWeek} Periods/Week</p>
                       </div>
                    </div>
                    {isActive && (
                      <div className="flex bg-white p-1 rounded-xl shadow-inner gap-1">
                        {['S1', 'S2', 'Both'].map(f => (
                          <button key={f} onClick={() => updateSemesterFocus(sub.id, f as any)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${assignment.semesterFocus === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    );
  }

  const rowSubjects = [
    ...currentClass.assignments.map(a => subjects.find(s => s.id === a.subjectId)).filter(Boolean),
    { id: 'hw', name: 'Homework Tracker', color: '#f59e0b', semesterFocus: 'Both' }
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-24 max-w-full">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Curriculum Map</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">{currentClass.name} Annual Sequence</p>
          </div>
          <button onClick={() => setIsConfigMode(true)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Class Streams">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          </button>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setIsLibraryOpen(true)}
            className="px-6 py-4 bg-[#0f172a] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Book Repository
          </button>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
            {classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </header>

      {/* FIXED: Drag & Drop Sidebar Repository */}
      {isLibraryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-end">
           <div className="bg-white h-full w-full max-w-xl flex flex-col shadow-2xl animate-fadeIn">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase">Class Repository</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Resources for {currentClass.name}</p>
                 </div>
                 <button onClick={() => setIsLibraryOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                 <button onClick={handleAddBook} className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-500 transition-all flex flex-col items-center gap-2">
                    <span className="text-3xl font-light">+</span>
                    <span>New Physical Resource</span>
                 </button>

                 {textbooks.filter(t => t.classId === selectedClassId).map(book => {
                   const isEditing = editingBookId === book.id;
                   return (
                     <div 
                        key={book.id} 
                        draggable 
                        onDragStart={(e) => handleDragStart(e, book.id)}
                        className={`bg-slate-50 p-6 rounded-[2rem] border-2 transition-all cursor-grab active:cursor-grabbing group ${isEditing ? 'border-indigo-500 bg-white shadow-xl' : 'border-transparent hover:border-indigo-100'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                           {isEditing ? (
                             <input 
                               autoFocus
                               className="bg-transparent border-0 p-0 font-black text-slate-900 text-lg focus:ring-0 uppercase w-full"
                               value={book.title} 
                               onChange={e => onUpdateTextbooks(textbooks.map(t => t.id === book.id ? {...t, title: e.target.value} : t))}
                               onBlur={() => setEditingBookId(null)}
                             />
                           ) : (
                             <div className="flex-1">
                               <p className="font-black text-slate-900 text-lg uppercase leading-tight tracking-tight">{book.title}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{book.assignedQuarter !== undefined ? `Assigned to Q${book.assignedQuarter + 1}` : 'Unmapped Sequence'}</p>
                             </div>
                           )}
                           <button onClick={() => setEditingBookId(book.id === editingBookId ? null : book.id)} className="text-slate-300 hover:text-indigo-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                           </button>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chapters: {book.totalChapters}</span>
                           <select 
                             className="bg-white border rounded-lg px-2 py-1 text-[8px] font-black uppercase"
                             value={book.subject}
                             onChange={e => onUpdateTextbooks(textbooks.map(t => t.id === book.id ? {...t, subject: e.target.value} : t))}
                           >
                              {rowSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                           </select>
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* Annual Grid */}
      <div className="bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[32px_32px_0px_rgba(0,0,0,0.03)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th rowSpan={2} className="border-r-[3px] border-slate-900 p-8 w-64 text-[12px] font-black uppercase text-slate-400 bg-white">Resource Stream</th>
              <th colSpan={2} className="border-r-[3px] border-slate-900 p-4 text-[11px] font-black uppercase tracking-[0.3em] bg-indigo-50 text-indigo-900">1st Semester</th>
              <th colSpan={2} className="p-4 text-[11px] font-black uppercase tracking-[0.3em] bg-emerald-50 text-emerald-900">2nd Semester</th>
            </tr>
            <tr className="bg-white border-b-[3px] border-slate-900">
              {quarters.map(q => (
                <th key={q.id} className="border-r-[3px] last:border-r-0 border-slate-900 p-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{q.label}</span>
                    <span className="text-[8px] font-bold uppercase text-slate-400 tracking-tighter mt-0.5">{q.months}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowSubjects.map((sub: any) => {
              const assignment = currentClass.assignments.find(a => a.subjectId === sub.id);
              return (
                <tr key={sub.id} className={`border-b-[2px] border-slate-900 last:border-b-0 ${sub.id === 'hw' ? 'bg-amber-50/10' : ''}`}>
                  <td className="border-r-[3px] border-slate-900 p-6 bg-slate-50/20 relative">
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-10 rounded-full" style={{ backgroundColor: sub.color || '#6366f1' }}></div>
                       <div>
                          <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{sub.name}</span>
                          {assignment?.semesterFocus && assignment.semesterFocus !== 'Both' && (
                            <span className="text-[7px] font-black text-indigo-500 uppercase block tracking-widest mt-1">Focus: {assignment.semesterFocus}</span>
                          )}
                       </div>
                    </div>
                  </td>
                  {quarters.map(q => {
                    const assignedBooks = textbooks.filter(t => t.subject === sub.name && t.assignedQuarter === q.id && t.classId === selectedClassId);
                    const isVisibleInQuarter = !assignment || assignment.semesterFocus === 'Both' || assignment.semesterFocus === q.semester;
                    
                    return (
                      <td 
                        key={q.id} 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, q.id, sub.name)}
                        className={`border-r-[3px] last:border-r-0 border-slate-900 p-4 min-h-[140px] align-top relative group ${!isVisibleInQuarter ? 'bg-slate-50/50 grayscale opacity-40' : ''}`}
                      >
                        {isVisibleInQuarter ? (
                          <div className="space-y-3">
                            {assignedBooks.map(book => (
                              <div 
                                key={book.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, book.id)}
                                className="p-4 rounded-[1.5rem] border-2 border-slate-900 shadow-sm bg-white cursor-grab active:cursor-grabbing hover:scale-[1.03] transition-all relative overflow-hidden group/book"
                              >
                                 <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: sub.color || '#6366f1' }}></div>
                                 <p className="text-[11px] font-black text-slate-900 uppercase leading-tight line-clamp-2 tracking-tight">{book.title}</p>
                                 <div className="flex items-center justify-between mt-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{book.totalChapters} Units</span>
                                    <button onClick={() => onUpdateTextbooks(textbooks.map(t => t.id === book.id ? {...t, assignedQuarter: undefined} : t))} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover/book:opacity-100 transition-opacity">
                                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                 </div>
                              </div>
                            ))}
                            <div className="h-16 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                              <span className="text-[9px] font-black text-slate-300 uppercase">Drop into Sequence</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                             <span className="text-[8px] font-black text-slate-300 uppercase rotate-[-45deg]">Inactive Semester</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurriculumRoadmap;
