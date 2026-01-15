
import React, { useState } from 'react';
import { Textbook, SubjectConfig, ClassGroup } from '../types';

interface CurriculumRoadmapProps {
  textbooks: Textbook[];
  onUpdateTextbooks: (books: Textbook[]) => void;
  subjects: SubjectConfig[];
  classes: ClassGroup[];
}

const CurriculumRoadmap: React.FC<CurriculumRoadmapProps> = ({ textbooks, onUpdateTextbooks, subjects, classes }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const quarters = [
    { id: 0, label: '1st Quarter', semester: '1st Semester' },
    { id: 1, label: '2nd Quarter', semester: '1st Semester' },
    { id: 2, label: '3rd Quarter', semester: '2nd Semester' },
    { id: 3, label: '4th Quarter', semester: '2nd Semester' },
  ];

  const handleDragStart = (id: string) => setDraggedBookId(id);

  const handleDrop = (quarterId: number, subjectName: string) => {
    if (draggedBookId === null) return;
    const updated = textbooks.map(t => t.id === draggedBookId ? { ...t, assignedQuarter: quarterId, subject: subjectName, classId: selectedClassId } : t);
    onUpdateTextbooks(updated);
    setDraggedBookId(null);
  };

  const handleAddBook = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newBook: Textbook = {
      id: newId,
      title: 'New Book Title',
      subject: subjects[0]?.name || 'General',
      gradeLevel: classes.find(c => c.id === selectedClassId)?.grade || 'G1',
      totalChapters: 10,
      totalPages: 100,
      classId: selectedClassId
    };
    onUpdateTextbooks([...textbooks, newBook]);
  };

  const currentClass = classes.find(c => c.id === selectedClassId);
  const classSpecificBooks = textbooks.filter(t => t.classId === selectedClassId);

  // Rows for the grid
  const rowSubjects = [...subjects, { id: 'hw', name: 'Homework Tracker' }];

  return (
    <div className="space-y-10 animate-fadeIn pb-24 max-w-full">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Curriculum Master</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Annual Learning Sequence • {currentClass?.name}</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setIsLibraryOpen(true)}
            className="px-6 py-4 bg-white border border-slate-200 text-indigo-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Book Repository
          </button>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200 overflow-x-auto">
            {classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Book Library Modal/Drawer */}
      {isLibraryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
           <div className="bg-white rounded-[4rem] w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-white/20 animate-fadeIn">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase">Class Repository</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage all textbooks assigned to {currentClass?.name}</p>
                 </div>
                 <button onClick={() => setIsLibraryOpen(false)} className="w-12 h-12 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
                 {classSpecificBooks.map(book => (
                   <div key={book.id} draggable onDragStart={() => handleDragStart(book.id)} className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing group">
                      <div className="flex justify-between items-start mb-4">
                         <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg">LIB</div>
                         <button onClick={() => onUpdateTextbooks(textbooks.filter(t => t.id !== book.id))} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                      <input className="w-full bg-transparent border-0 p-0 font-black text-slate-900 text-lg focus:ring-0 uppercase tracking-tight mb-2" value={book.title} onChange={e => onUpdateTextbooks(textbooks.map(t => t.id === book.id ? {...t, title: e.target.value} : t))} />
                      <div className="flex items-center gap-4">
                         <select className="bg-white border rounded-lg px-2 py-1 text-[9px] font-black uppercase" value={book.subject} onChange={e => onUpdateTextbooks(textbooks.map(t => t.id === book.id ? {...t, subject: e.target.value} : t))}>
                            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            <option value="Homework Tracker">Homework</option>
                         </select>
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{book.assignedQuarter !== undefined ? `Assigned: Q${book.assignedQuarter + 1}` : 'Unassigned'}</span>
                      </div>
                   </div>
                 ))}
                 <button onClick={handleAddBook} className="h-[180px] border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 hover:text-indigo-400 hover:border-indigo-100 transition-all">
                    <span className="text-4xl font-light mb-2">+</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Register New Textbook</span>
                 </button>
              </div>
              <div className="p-8 bg-slate-900 text-white flex justify-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Drag items from repository directly onto the grid behind this menu</p>
              </div>
           </div>
        </div>
      )}

      {/* The Master Grid */}
      <div className="bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[24px_24px_0px_rgba(0,0,0,0.03)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th rowSpan={2} className="border-r-[3px] border-slate-900 p-8 w-64 text-[12px] font-black uppercase text-slate-400 bg-white">Instructional Streams</th>
              <th colSpan={2} className="border-r-[3px] border-slate-900 p-4 text-[11px] font-black uppercase tracking-[0.2em] bg-indigo-50 text-indigo-900">1st Semester</th>
              <th colSpan={2} className="p-4 text-[11px] font-black uppercase tracking-[0.2em] bg-emerald-50 text-emerald-900">2nd Semester</th>
            </tr>
            <tr className="bg-white border-b-[3px] border-slate-900">
              {quarters.map(q => (
                <th key={q.id} className={`border-r-[3px] last:border-r-0 border-slate-900 p-4 text-[10px] font-black uppercase tracking-widest ${q.id < 2 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                  {q.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowSubjects.map((sub, sIdx) => (
              <tr key={sub.id} className={`border-b-[2px] border-slate-900 last:border-b-0 ${sub.id === 'hw' ? 'bg-amber-50/20' : ''}`}>
                <td className="border-r-[3px] border-slate-900 p-6 bg-slate-50/20">
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-10 rounded-full" style={{ backgroundColor: sub.id === 'hw' ? '#f59e0b' : (subjects.find(s => s.id === sub.id)?.color || '#6366f1') }}></div>
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{sub.name}</span>
                  </div>
                </td>
                {quarters.map(q => {
                  const assignedBooks = textbooks.filter(t => t.subject === sub.name && t.assignedQuarter === q.id && t.classId === selectedClassId);
                  return (
                    <td 
                      key={q.id} 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(q.id, sub.name)}
                      className="border-r-[3px] last:border-r-0 border-slate-900 p-4 min-h-[140px] align-top relative group"
                    >
                      <div className="space-y-4">
                        {assignedBooks.map(book => (
                          <div 
                            key={book.id} 
                            draggable 
                            onDragStart={() => handleDragStart(book.id)}
                            className="p-5 rounded-[1.8rem] border-2 border-slate-900 shadow-sm bg-white cursor-grab active:cursor-grabbing hover:scale-[1.03] transition-all relative overflow-hidden group/book"
                          >
                             <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: sub.id === 'hw' ? '#f59e0b' : (subjects.find(s => s.id === sub.id)?.color || '#6366f1') }}></div>
                             <p className="text-[12px] font-black text-slate-900 uppercase leading-tight line-clamp-2 tracking-tight">{book.title}</p>
                             <div className="flex items-center justify-between mt-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{book.totalChapters} Units</span>
                                <button onClick={() => onUpdateTextbooks(textbooks.map(t => t.id === book.id ? {...t, assignedQuarter: undefined} : t))} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover/book:opacity-100 transition-opacity">
                                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                             </div>
                          </div>
                        ))}
                        <div className="h-12 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                          <span className="text-[9px] font-black text-slate-300 uppercase">Drop to Sequence</span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-8 no-print">
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructional Units</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Homework Strategy</span>
         </div>
      </div>
    </div>
  );
};

export default CurriculumRoadmap;
