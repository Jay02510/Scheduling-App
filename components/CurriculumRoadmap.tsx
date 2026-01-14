
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

  const quarters = [
    { id: 0, label: '1st Quarter', semester: '1st Semester' },
    { id: 1, label: '2nd Quarter', semester: '1st Semester' },
    { id: 2, label: '3rd Quarter', semester: '2nd Semester' },
    { id: 3, label: '4th Quarter', semester: '2nd Semester' },
  ];

  const handleDragStart = (id: string) => setDraggedBookId(id);

  const handleDrop = (quarterId: number) => {
    if (draggedBookId === null) return;
    const updated = textbooks.map(t => t.id === draggedBookId ? { ...t, assignedQuarter: quarterId } : t);
    onUpdateTextbooks(updated);
    setDraggedBookId(null);
  };

  const currentClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-10 animate-fadeIn pb-24 max-w-full">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Curriculum Map</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Annual Learning Trajectory</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
          {classes.map(c => (
            <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-5 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all ${selectedClassId === c.id ? 'bg-[#0f172a] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{c.name}</button>
          ))}
        </div>
      </header>

      {/* High-Fidelity Roadmap Table */}
      <div className="bg-white border-[3px] border-slate-900 rounded-[3rem] overflow-hidden shadow-[20px_20px_0px_rgba(0,0,0,0.03)] max-w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            {/* Semesters Header */}
            <tr className="bg-slate-50 border-b-[3px] border-slate-900">
              <th rowSpan={2} className="border-r-[3px] border-slate-900 p-8 w-64 text-[12px] font-black uppercase text-slate-400 bg-white">Subject Stream</th>
              <th colSpan={2} className="border-r-[3px] border-slate-900 p-4 text-[11px] font-black uppercase tracking-[0.2em] bg-indigo-50 text-indigo-900">1st Semester</th>
              <th colSpan={2} className="p-4 text-[11px] font-black uppercase tracking-[0.2em] bg-emerald-50 text-emerald-900">2nd Semester</th>
            </tr>
            {/* Quarters Header */}
            <tr className="bg-white border-b-[3px] border-slate-900">
              {quarters.map(q => (
                <th key={q.id} className={`border-r-[3px] last:border-r-0 border-slate-900 p-4 text-[10px] font-black uppercase tracking-widest ${q.id < 2 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                  {q.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, sIdx) => (
              <tr key={sub.id} className={`border-b-[2px] border-slate-900 last:border-b-0 ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="border-r-[3px] border-slate-900 p-6">
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-10 rounded-full" style={{ backgroundColor: sub.color || '#cbd5e1' }}></div>
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{sub.name}</span>
                  </div>
                </td>
                {quarters.map(q => {
                  const assignedBooks = textbooks.filter(t => t.subject === sub.name && t.assignedQuarter === q.id && (t.classId === selectedClassId || !t.classId));
                  return (
                    <td 
                      key={q.id} 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(q.id)}
                      className="border-r-[3px] last:border-r-0 border-slate-900 p-4 min-h-[120px] align-top relative group"
                    >
                      <div className="space-y-3">
                        {assignedBooks.map(book => (
                          <div 
                            key={book.id} 
                            draggable 
                            onDragStart={() => handleDragStart(book.id)}
                            className="p-4 rounded-2xl border-2 border-slate-900 shadow-sm bg-white cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all relative overflow-hidden group"
                          >
                             <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: sub.color || '#cbd5e1' }}></div>
                             <p className="text-[11px] font-black text-slate-900 uppercase leading-tight line-clamp-2">{book.title}</p>
                             <div className="flex items-center justify-between mt-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{book.totalChapters} Chaps</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
                             </div>
                          </div>
                        ))}
                        {assignedBooks.length === 0 && (
                          <div className="h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black text-slate-300 uppercase">Drop Book Here</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Legend/Help */}
      <div className="fixed bottom-10 right-10 flex gap-4 no-print">
         <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-slate-900"></div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Quarterly Strategy: Drag to assign</span>
         </div>
      </div>
    </div>
  );
};

export default CurriculumRoadmap;
