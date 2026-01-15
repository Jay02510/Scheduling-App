
import React, { useState } from 'react';
import { Textbook, SubjectConfig, ClassGroup, ClassSubjectAssignment } from '../types';

interface CurriculumRoadmapProps {
  textbooks: Textbook[];
  onUpdateTextbooks: (books: Textbook[]) => void;
  subjects: SubjectConfig[];
  classes: ClassGroup[];
  onUpdateClasses?: (classes: ClassGroup[]) => void;
}

const BOOK_ACCENT_COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

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
  
  // Selection Engine State
  const [selectingSlot, setSelectingSlot] = useState<{ quarterId: number, subjectName: string } | null>(null);

  const quarters = [
    { id: 0, label: '1st Quarter', semester: 'S1', months: 'Mar-May' },
    { id: 1, label: '2nd Quarter', semester: 'S1', months: 'Jun-Aug' },
    { id: 2, label: '3rd Quarter', semester: 'S2', months: 'Sep-Nov' },
    { id: 3, label: '4th Quarter', semester: 'S2', months: 'Dec-Feb' },
  ];

  const currentClass = classes.find(c => c.id === selectedClassId);

  // --- LOGIC: ASSIGNMENT ---
  const assignBookToSlot = (bookId: string, quarterId: number, subjectName: string) => {
    const updated = textbooks.map(t => 
      t.id === bookId ? { ...t, assignedQuarter: quarterId, subject: subjectName, classId: selectedClassId } : t
    );
    onUpdateTextbooks(updated);
    setSelectingSlot(null);
  };

  const removeBookFromSlot = (bookId: string) => {
    const updated = textbooks.map(t => 
      t.id === bookId ? { ...t, assignedQuarter: undefined } : t
    );
    onUpdateTextbooks(updated);
  };

  // --- LOGIC: ASSET CREATION ---
  const handleAddBook = (autoAssign?: { quarterId: number, subjectName: string }) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const assignedSubjects = currentClass?.assignments.map(a => subjects.find(s => s.id === a.subjectId)?.name).filter(Boolean) || [];
    
    const subjectToSet = autoAssign?.subjectName || assignedSubjects[0] || 'General';
    const randomColor = BOOK_ACCENT_COLORS[Math.floor(Math.random() * BOOK_ACCENT_COLORS.length)];

    const newBook: Textbook = {
      id: newId,
      title: 'New Textbook',
      subject: subjectToSet,
      gradeLevel: currentClass?.grade || 'G1',
      totalChapters: 12,
      totalPages: 120,
      classId: selectedClassId,
      assignedQuarter: autoAssign?.quarterId,
      color: randomColor
    };

    onUpdateTextbooks([...textbooks, newBook]);
    setEditingBookId(newId);
    if (autoAssign) setSelectingSlot(null);
  };

  // --- LOGIC: DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, quarterId: number, subjectName: string) => {
    e.preventDefault();
    const bookId = e.dataTransfer.getData('text/plain');
    if (!bookId) return;
    
    // Safety Check: Verify if book is allowed for this subject
    const book = textbooks.find(t => t.id === bookId);
    if (book && book.subject !== subjectName) {
      if (!window.confirm(`This book is registered under ${book.subject}. Move it to ${subjectName}?`)) return;
    }

    assignBookToSlot(bookId, quarterId, subjectName);
  };

  // --- LOGIC: ONBOARDING ---
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

  const handleFinishOnboarding = () => {
    if (!onUpdateClasses || !currentClass) return;
    onUpdateClasses(classes.map(c => c.id === selectedClassId ? { ...c, isCurriculumOnboarded: true } : c));
    setIsConfigMode(false);
  };

  if (!currentClass) return null;

  // --- VIEW: ONBOARDING WIZARD ---
  if (!currentClass.isCurriculumOnboarded || isConfigMode) {
    return (
      <div className="space-y-10 animate-fadeIn pb-24 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Class Setup</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Designating Subjects for {currentClass.name}</p>
          </div>
          <button 
            onClick={handleFinishOnboarding} 
            className="px-8 py-4 bg-[#0f172a] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all border border-indigo-500/30"
          >
            Confirm & Access Map
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
                       <button onClick={() => toggleSubjectForClass(sub.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200' : 'border-slate-200 bg-white'}`}>
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
                          <button key={f} onClick={() => updateSemesterFocus(sub.id, f as any)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${assignment.semesterFocus === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
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
    <div className="space-y-10 animate-fadeIn pb-24 max-w-full relative">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Curriculum Map</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">{currentClass.name} Annual Sequence</p>
          </div>
          <button onClick={() => setIsConfigMode(true)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all hover:bg-white hover:shadow-md" title="Modify Subject Streams">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          </button>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setIsLibraryOpen(true)}
            className="px-6 py-4 bg-[#0f172a] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 border border-slate-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Textbook Pool
          </button>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
            {classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </header>

      {/* --- MODAL: SELECTOR OVERLAY (Fixed Unresponsiveness) --- */}
      {selectingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-6 no-print">
           <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-fadeInUp border-4 border-slate-900">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Assign {selectingSlot.subjectName}</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Classroom: {currentClass.name} • Quarter {selectingSlot.quarterId + 1}</p>
                 </div>
                 <button onClick={() => setSelectingSlot(null)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-8 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
                 {textbooks
                    .filter(t => t.classId === selectedClassId && t.subject === selectingSlot.subjectName)
                    .map(book => (
                       <button 
                          key={book.id} 
                          onClick={() => assignBookToSlot(book.id, selectingSlot.quarterId, selectingSlot.subjectName)}
                          className="w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group bg-white hover:shadow-lg"
                          style={{ borderLeftColor: book.color || '#e2e8f0', borderLeftWidth: '10px' }}
                       >
                          <div>
                             <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{book.title}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sequence: {book.totalChapters} Units</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                          </div>
                       </button>
                    ))}
                 
                 <button 
                    onClick={() => handleAddBook(selectingSlot)} 
                    className="w-full py-12 border-4 border-dashed border-slate-100 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] hover:border-indigo-100 hover:text-indigo-500 transition-all flex flex-col items-center gap-3"
                 >
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 transition-colors">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span>Register New Book for this Slot</span>
                 </button>
              </div>
              <div className="p-6 bg-[#0f172a] flex justify-center border-t border-slate-800">
                 <button onClick={() => setSelectingSlot(null)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Discard Selection</button>
              </div>
           </div>
        </div>
      )}

      {/* --- VIEW: ASSET REPOSITORY (Drawer) --- */}
      {isLibraryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-end no-print">
           <div className="bg-white h-full w-full max-w-xl flex flex-col shadow-2xl animate-fadeIn border-l-8 border-slate-900">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase">Class Resources</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Available to assign in {currentClass.name}</p>
                 </div>
                 <button onClick={() => setIsLibraryOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                 <button onClick={() => handleAddBook()} className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-500 transition-all flex flex-col items-center gap-2">
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
                        style={{ borderLeftColor: book.color || '#e2e8f0', borderLeftWidth: '10px' }}
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
                               <p className="font-black text-slate-900 text-sm uppercase leading-tight tracking-tight">{book.title}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{book.assignedQuarter !== undefined ? `Allocated: Q${book.assignedQuarter + 1}` : 'Unmapped Stream'}</p>
                             </div>
                           )}
                           <div className="flex gap-1">
                             <button onClick={() => setEditingBookId(book.id === editingBookId ? null : book.id)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                             </button>
                             <button onClick={() => onUpdateTextbooks(textbooks.filter(t => t.id !== book.id))} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Units: {book.totalChapters}</span>
                           <select 
                             className="bg-white border rounded-lg px-2 py-1 text-[8px] font-black uppercase outline-none focus:ring-1 focus:ring-indigo-500"
                             value={book.subject}
                             onChange={e => onUpdateTextbooks(textbooks.map(t => t.id === book.id ? {...t, subject: e.target.value} : t))}
                           >
                              {rowSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                           </select>
                           <input 
                              type="color" 
                              value={book.color || '#6366f1'} 
                              onChange={e => onUpdateTextbooks(textbooks.map(t => t.id === book.id ? {...t, color: e.target.value} : t))}
                              className="w-5 h-5 rounded overflow-hidden cursor-pointer border-0 bg-transparent"
                           />
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* --- VIEW: SEQUENTIAL GRID --- */}
      <div className="bg-white border-[4px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[32px_32px_0px_rgba(0,0,0,0.03)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b-[4px] border-slate-900">
              <th rowSpan={2} className="border-r-[4px] border-slate-900 p-8 w-64 text-[12px] font-black uppercase text-slate-400 bg-white shadow-inner">Academic Stream</th>
              <th colSpan={2} className="border-r-[4px] border-slate-900 p-4 text-[11px] font-black uppercase tracking-[0.3em] bg-indigo-50 text-indigo-900">1st Semester Cycle</th>
              <th colSpan={2} className="p-4 text-[11px] font-black uppercase tracking-[0.3em] bg-emerald-50 text-emerald-900">2nd Semester Cycle</th>
            </tr>
            <tr className="bg-white border-b-[4px] border-slate-900">
              {quarters.map(q => (
                <th key={q.id} className="border-r-[4px] last:border-r-0 border-slate-900 p-4 bg-slate-50/20">
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
                  <td className="border-r-[4px] border-slate-900 p-6 bg-slate-50/30 relative">
                    <div className="flex items-center gap-4">
                       <div className="w-3 h-12 rounded-full" style={{ backgroundColor: sub.color || '#6366f1' }}></div>
                       <div>
                          <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{sub.name}</span>
                          {assignment?.semesterFocus && assignment.semesterFocus !== 'Both' && (
                            <span className="text-[7px] font-black text-indigo-600 uppercase block tracking-widest mt-1 bg-white px-1.5 py-0.5 rounded border border-indigo-100 w-fit">Window: {assignment.semesterFocus}</span>
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
                        className={`border-r-[4px] last:border-r-0 border-slate-900 p-4 min-h-[140px] align-top relative group transition-all ${!isVisibleInQuarter ? 'bg-slate-50/50 grayscale opacity-40' : 'hover:bg-indigo-50/20'}`}
                      >
                        {isVisibleInQuarter ? (
                          <div className="space-y-3">
                            {assignedBooks.map(book => (
                              <div 
                                key={book.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, book.id)}
                                className="p-4 rounded-[1.5rem] border-2 border-slate-900 shadow-md bg-white cursor-grab active:cursor-grabbing hover:translate-y-[-4px] transition-all relative overflow-hidden group/book"
                                style={{ borderLeftColor: book.color || '#e2e8f0', borderLeftWidth: '8px' }}
                              >
                                 <p className="text-[11px] font-black text-slate-900 uppercase leading-tight line-clamp-2 tracking-tight pr-4">{book.title}</p>
                                 <div className="flex items-center justify-between mt-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{book.totalChapters} Units Planned</span>
                                    <button onClick={() => removeBookFromSlot(book.id)} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover/book:opacity-100 transition-opacity">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                 </div>
                              </div>
                            ))}
                            
                            <button 
                               onClick={() => setSelectingSlot({ quarterId: q.id, subjectName: sub.name })}
                               className="w-full h-16 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 hover:border-indigo-500 hover:bg-white transition-all cursor-pointer shadow-sm"
                            >
                               <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">+ Add Asset</span>
                               <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">Click to Select or Create</span>
                            </button>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                             <span className="text-[8px] font-black text-slate-300 uppercase rotate-[-45deg] tracking-widest">Window Inactive</span>
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

      <div className="flex justify-center gap-12 no-print">
         <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border">
            <div className="w-3 h-3 rounded-full bg-slate-100 border-2 border-dashed border-slate-300"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Available Slots (Click Trigger)</span>
         </div>
         <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-200"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Allocated Resource Unit</span>
         </div>
      </div>
    </div>
  );
};

export default CurriculumRoadmap;
