
import React from 'react';
import { Textbook, SchoolProfile } from '../types';

interface ResourcePlannerProps {
  textbooks: Textbook[];
  onUpdate: (updated: Textbook[]) => void;
  profile: SchoolProfile | null;
}

const ResourcePlanner: React.FC<ResourcePlannerProps> = ({ textbooks, onUpdate, profile }) => {
  const handleUpdate = (id: string, field: keyof Textbook, value: any) => {
    const updated = textbooks.map(t => t.id === id ? { ...t, [field]: value } : t);
    onUpdate(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this textbook and all associated page data?")) {
      const updated = textbooks.filter(t => t.id !== id);
      onUpdate(updated);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-full overflow-hidden">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Curriculum Resources</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">Map textbooks and page distributions for AI planning.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {textbooks.map((book) => (
          <div key={book.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md group">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="w-full lg:w-1/3 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div className="flex-1">
                    <input 
                      className="bg-transparent border-0 p-0 font-black text-xl text-slate-900 focus:ring-0 w-full"
                      value={book.title}
                      onChange={(e) => handleUpdate(book.id, 'title', e.target.value)}
                    />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{book.subject} • {book.gradeLevel}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full items-center">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Chapters</span>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-900 outline-none focus:bg-white"
                    value={book.totalChapters}
                    onChange={(e) => handleUpdate(book.id, 'totalChapters', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Pages</span>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-900 outline-none focus:bg-white"
                    value={book.totalPages}
                    onChange={(e) => handleUpdate(book.id, 'totalPages', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Current Page</span>
                  <input 
                    type="number"
                    className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 font-bold text-emerald-900 outline-none focus:bg-white"
                    value={book.currentPage || 0}
                    onChange={(e) => handleUpdate(book.id, 'currentPage', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase">
                    Pace: <span className="text-indigo-600">{Math.round(book.totalPages / 10)} pp/mo</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(book.id)}
                    className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={() => {
            const newId = Math.random().toString(36).substr(2, 9);
            onUpdate([...textbooks, {
              id: newId, title: 'New Textbook', subject: 'General', gradeLevel: 'G1', totalChapters: 10, totalPages: 100, currentPage: 0
            }]);
          }}
          className="w-full py-6 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          Add New Resource
        </button>
      </div>
    </div>
  );
};

export default ResourcePlanner;
