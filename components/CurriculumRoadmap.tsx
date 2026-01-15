
import React, { useState, useRef, useEffect } from 'react';
import { Textbook, SubjectConfig, ClassGroup, ClassSubjectAssignment, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CurriculumRoadmapProps {
  textbooks: Textbook[];
  onUpdateTextbooks: (books: Textbook[]) => void;
  subjects: SubjectConfig[];
  classes: ClassGroup[];
  onUpdateClasses?: (classes: ClassGroup[]) => void;
  language: Language;
}

const BOOK_ACCENT_COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

const CurriculumRoadmap: React.FC<CurriculumRoadmapProps> = ({ 
  textbooks, 
  onUpdateTextbooks, 
  subjects, 
  classes,
  onUpdateClasses,
  language
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  
  const t = (key: string) => TRANSLATIONS[language][key] || key;
  const [selectingSlot, setSelectingSlot] = useState<{ quarterId: number, subjectName: string } | null>(null);

  const quarters = [
    { id: 0, label: t('quarter_1'), semester: 'S1', months: 'Mar - May' },
    { id: 1, label: t('quarter_2'), semester: 'S1', months: 'Jun - Aug' },
    { id: 2, label: t('quarter_3'), semester: 'S2', months: 'Sep - Nov' },
    { id: 3, label: t('quarter_4'), semester: 'S2', months: 'Dec - Feb' },
  ];

  const currentClass = classes.find(c => c.id === selectedClassId);

  const updateBook = (id: string, updates: Partial<Textbook>) => {
    onUpdateTextbooks(textbooks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const assignBookToSlot = (bookId: string, quarterId: number, subjectName: string) => {
    const updated = textbooks.map(t => 
      t.id === bookId ? { ...t, assignedQuarter: quarterId, subject: subjectName, classId: selectedClassId } : t
    );
    onUpdateTextbooks(updated);
    setSelectingSlot(null);
    setEditingBookId(null);
  };

  const removeBookFromSlot = (bookId: string) => {
    const updated = textbooks.map(t => 
      t.id === bookId ? { ...t, assignedQuarter: undefined } : t
    );
    onUpdateTextbooks(updated);
  };

  const handleAddBook = (autoAssign?: { quarterId: number, subjectName: string }) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const assignedSubjects = currentClass?.assignments.map(a => subjects.find(s => s.id === a.subjectId)?.name).filter(Boolean) || [];
    
    const subjectToSet = autoAssign?.subjectName || assignedSubjects[0] || 'General';
    const randomColor = BOOK_ACCENT_COLORS[Math.floor(Math.random() * BOOK_ACCENT_COLORS.length)];

    const newBook: Textbook = {
      id: newId,
      title: 'New Resource',
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
  };

  const TextbookCard: React.FC<{ book: Textbook, onAssign?: () => void, isModalView?: boolean }> = ({ book, onAssign, isModalView = false }) => {
    const isEditing = editingBookId === book.id;
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);

    return (
      <div 
        className={`p-5 rounded-[2rem] border-2 transition-all group relative overflow-hidden flex flex-col justify-between h-full ${
          isEditing 
            ? 'border-indigo-600 bg-white shadow-2xl scale-[1.02] z-[50]' 
            : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-lg'
        }`}
        style={{ borderLeftColor: book.color || '#e2e8f0', borderLeftWidth: '10px' }}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Resource Name</span>
                  <input 
                    ref={inputRef}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-black text-slate-900 text-sm uppercase outline-none focus:border-indigo-500"
                    value={book.title}
                    onChange={(e) => updateBook(book.id, { title: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingBookId(null)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unit Count</span>
                  <input 
                    type="number"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-black text-indigo-600 text-sm outline-none focus:border-indigo-500"
                    value={book.totalChapters}
                    onChange={(e) => updateBook(book.id, { totalChapters: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <button onClick={() => setEditingBookId(null)} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">{t('confirm_setup')}</button>
              </div>
            ) : (
              <div className="text-left w-full">
                <p className="font-black text-slate-900 text-sm uppercase leading-tight line-clamp-2 tracking-tight">
                  {book.title}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {book.assignedQuarter !== undefined ? `Mapping: Q${book.assignedQuarter + 1}` : 'Unmapped Resource'}
                </p>
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditingBookId(book.id)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => onUpdateTextbooks(textbooks.filter(t => t.id !== book.id))} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{book.totalChapters} Units</span>
              <input type="color" value={book.color || '#6366f1'} onChange={e => updateBook(book.id, { color: e.target.value })} className="w-4 h-4 rounded-full overflow-hidden cursor-pointer border-0 p-0 bg-transparent ring-1 ring-slate-100" />
            </div>
            {onAssign && (
              <button onClick={onAssign} className="px-3 py-1.5 bg-[#0f172a] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">Assign</button>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleFinishOnboarding = () => {
    if (!onUpdateClasses || !currentClass) return;
    onUpdateClasses(classes.map(c => c.id === selectedClassId ? { ...c, isCurriculumOnboarded: true } : c));
    setIsConfigMode(false);
  };

  if (!currentClass) return null;

  if (!currentClass.isCurriculumOnboarded || isConfigMode) {
    return (
      <div className="space-y-10 animate-fadeIn pb-24 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{t('setup')}</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Subjects for {currentClass.name}</p>
          </div>
          <button onClick={handleFinishOnboarding} className="px-8 py-4 bg-[#0f172a] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl border border-indigo-500/30">{t('confirm_setup')}</button>
        </header>
        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(sub => {
                const assignment = currentClass.assignments.find(a => a.subjectId === sub.id);
                const isActive = !!assignment;
                return (
                  <div key={sub.id} className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${isActive ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-50 bg-slate-50/50 opacity-60'}`}>
                    <div className="flex items-center gap-4">
                       <button onClick={() => {
                          if (!currentClass || !onUpdateClasses) return;
                          const updated = isActive ? currentClass.assignments.filter(a => a.subjectId !== sub.id) : [...currentClass.assignments, { subjectId: sub.id, teacherId: '', semesterFocus: 'Both' } as ClassSubjectAssignment];
                          onUpdateClasses(classes.map(c => c.id === selectedClassId ? { ...c, assignments: updated } : c));
                       }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 shadow-lg' : 'border-slate-200 bg-white'}`}>
                          {isActive && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                       </button>
                       <span className="font-black text-slate-900 uppercase text-xs">{sub.name}</span>
                    </div>
                    {isActive && (
                      <div className="flex bg-white p-1 rounded-xl shadow-inner gap-1">
                        {['S1', 'S2', 'Both'].map(f => (
                          <button key={f} onClick={() => {
                            if (!currentClass || !onUpdateClasses) return;
                            const updated = currentClass.assignments.map(a => a.subjectId === sub.id ? { ...a, semesterFocus: f as any } : a);
                            onUpdateClasses(classes.map(c => c.id === selectedClassId ? { ...c, assignments: updated } : c));
                          }} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${assignment.semesterFocus === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
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
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{t('curriculum')}</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">{currentClass.name} Annual Sequence</p>
          </div>
          <button onClick={() => setIsConfigMode(true)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          </button>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsLibraryOpen(true)} className="px-6 py-4 bg-[#0f172a] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 border border-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            {t('resource_pool')}
          </button>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
            {classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all ${selectedClassId === c.id ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </header>

      {/* MODAL: SELECTOR OVERLAY */}
      {selectingSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6 no-print">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeInUp border-4 border-slate-900 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('modify_lesson')} {selectingSlot.subjectName}</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Q{selectingSlot.quarterId + 1} Mapping • {currentClass.name}</p>
                 </div>
                 <button onClick={() => setSelectingSlot(null)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-8 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                 <button onClick={() => handleAddBook(selectingSlot)} className="w-full py-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-500 bg-white transition-all">+ {t('register_resource')}</button>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {textbooks.filter(t => (t.classId === selectedClassId || !t.classId) && t.subject === selectingSlot.subjectName).map(book => (
                     <TextbookCard key={book.id} book={book} isModalView onAssign={() => assignBookToSlot(book.id, selectingSlot.quarterId, selectingSlot.subjectName)} />
                   ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* DRAWER: LIBRARY */}
      {isLibraryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-end no-print">
           <div className="bg-white h-full w-full max-w-xl flex flex-col shadow-2xl animate-fadeIn border-l-8 border-slate-900">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <div><h3 className="text-xl font-black text-slate-900 uppercase">{t('resource_pool')}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available for {currentClass.name}</p></div>
                 <button onClick={() => setIsLibraryOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                 <button onClick={() => handleAddBook()} className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[2rem] text-slate-300 font-black text-[10px] uppercase hover:text-indigo-500 transition-all">+ {t('register_resource')}</button>
                 <div className="grid grid-cols-1 gap-4">
                   {textbooks.filter(t => t.classId === selectedClassId || !t.classId).map(book => (
                     <TextbookCard key={book.id} book={book} />
                   ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* SEQUENTIAL GRID */}
      <div className="bg-white border-[4px] border-slate-900 rounded-[3rem] overflow-hidden shadow-sm max-w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b-[4px] border-slate-900 text-slate-900">
              <th rowSpan={3} className="border-r-[4px] border-slate-900 p-8 w-64 text-[12px] font-black uppercase bg-white">{t('academic_stream')}</th>
              <th colSpan={2} className="border-r-[4px] border-slate-900 p-4 bg-indigo-50 text-indigo-900 font-black text-[10px] uppercase tracking-widest text-center">{t('semester_1')}</th>
              <th colSpan={2} className="p-4 bg-emerald-50 text-emerald-900 font-black text-[10px] uppercase tracking-widest text-center">{t('semester_2')}</th>
            </tr>
            <tr className="bg-white border-b-[2px] border-slate-900">
              {quarters.map(q => <th key={q.id} className="border-r-[4px] last:border-r-0 border-slate-900 p-4 text-[11px] font-black uppercase tracking-widest">{q.label}</th>)}
            </tr>
            <tr className="bg-slate-100 border-b-[4px] border-slate-900">
              {quarters.map(q => <th key={q.id} className="border-r-[4px] last:border-r-0 border-slate-900 p-2 text-[9px] font-black text-slate-500 uppercase tracking-tighter">{q.months}</th>)}
            </tr>
          </thead>
          <tbody>
            {rowSubjects.map((sub: any) => {
              const assignment = currentClass.assignments.find(a => a.subjectId === sub.id);
              return (
                <tr key={sub.id} className="border-b-[3px] border-slate-900 last:border-b-0">
                  <td className="border-r-[4px] border-slate-900 p-6 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                       <div className="w-3 h-12 rounded-full" style={{ backgroundColor: sub.color || '#6366f1' }}></div>
                       <div>
                          <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{sub.name}</span>
                          {assignment?.semesterFocus && assignment.semesterFocus !== 'Both' && (
                            <span className="text-[7px] font-black text-indigo-600 uppercase block tracking-widest mt-1 bg-white px-2 py-0.5 rounded border border-indigo-100 w-fit">{assignment.semesterFocus} Only</span>
                          )}
                       </div>
                    </div>
                  </td>
                  {quarters.map(q => {
                    const assignedBooks = textbooks.filter(t => t.subject === sub.name && t.assignedQuarter === q.id && t.classId === selectedClassId);
                    const isVisibleInQuarter = !assignment || assignment.semesterFocus === 'Both' || assignment.semesterFocus === q.semester;
                    
                    return (
                      <td key={q.id} className={`border-r-[4px] last:border-r-0 border-slate-900 p-4 min-h-[160px] align-top relative group transition-all ${!isVisibleInQuarter ? 'bg-slate-50/50 grayscale opacity-40' : 'hover:bg-indigo-50/20'}`}>
                        {isVisibleInQuarter ? (
                          <div className="space-y-3">
                            {assignedBooks.map(book => (
                              <div key={book.id} onClick={() => { setSelectingSlot({ quarterId: q.id, subjectName: sub.name }); setEditingBookId(book.id); }} className="p-4 rounded-[1.8rem] border-2 border-slate-900 shadow-md bg-white cursor-pointer hover:translate-y-[-4px] transition-all relative overflow-hidden" style={{ borderLeftColor: book.color || '#e2e8f0', borderLeftWidth: '8px' }}>
                                 <p className="text-[11px] font-black text-slate-900 uppercase leading-tight line-clamp-2 tracking-tight pr-4">{book.title}</p>
                                 <div className="flex items-center justify-between mt-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{book.totalChapters} Units</span>
                                    <button onClick={(e) => { e.stopPropagation(); removeBookFromSlot(book.id); }} className="text-rose-300 hover:text-rose-500 transition-opacity opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                 </div>
                              </div>
                            ))}
                            <button onClick={() => setSelectingSlot({ quarterId: q.id, subjectName: sub.name })} className="w-full h-16 rounded-[1.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-indigo-500 hover:bg-white transition-all cursor-pointer"><span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">+ Assign</span></button>
                          </div>
                        ) : <div className="h-full flex items-center justify-center"><span className="text-[9px] font-black text-slate-300 uppercase rotate-[-45deg] tracking-widest">Off-Cycle</span></div>}
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
