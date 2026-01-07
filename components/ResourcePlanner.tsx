import React, { useState } from 'react';
import { Textbook, SchoolProfile, ClassGroup } from '../types';

interface ResourcePlannerProps {
  textbooks: Textbook[];
  onUpdate: (updated: Textbook[]) => void;
  profile: SchoolProfile | null;
  classes: ClassGroup[];
}

const ResourcePlanner: React.FC<ResourcePlannerProps> = ({ textbooks, onUpdate, profile, classes }) => {
  const [activeClassId, setActiveClassId] = useState<string>(classes[0]?.id || 'general');

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

  const filteredTextbooks = textbooks.filter(t => 
    activeClassId === 'general' ? !t.classId : t.classId === activeClassId
  );

  return (
    <div className="space-y-10 animate-fadeIn max-w-full overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Curriculum Resources</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Class-Specific Textbook Mapping</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <button
          onClick={() => setActiveClassId('general')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            activeClassId === 'general' ? 'bg-[#0f172a] text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100'
          }`}
        >
          General Pool
        </button>
        {classes.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveClassId(c.id)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-4 ${
              activeClassId === c.id ? 'bg-white text-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent opacity-60'
            }`}
            style={activeClassId === c.id ? { borderBottomColor: c.color } : {}}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredTextbooks.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
             <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest">No textbooks assigned to this view</p>
          </div>
        ) : (
          filteredTextbooks.map((book) => (
            <div key={book.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md group">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="w-full lg:w-1/3 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div className="flex-1">
                      <input 
                        className="bg-transparent border-0 p-0 font-black text-xl text-slate-900 focus:ring-0 w-full"
                        value={book.title}
                        onChange={(e) => handleUpdate(book.id, 'title', e.target.value)}
                        placeholder="Resource Title..."
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          className="bg-transparent border-0 p-0 text-[10px] font-black text-slate-400 uppercase tracking-widest focus:ring-0 w-1/2"
                          value={book.subject}
                          onChange={(e) => handleUpdate(book.id, 'subject', e.target.value)}
                        />
                        <span className="text-slate-300">•</span>
                        <input 
                          className="bg-transparent border-0 p-0 text-[10px] font-black text-slate-400 uppercase tracking-widest focus:ring-0 w-1/4"
                          value={book.gradeLevel}
                          onChange={(e) => handleUpdate(book.id, 'gradeLevel', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full items-center">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Total Chapters</span>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={book.totalChapters}
                      onChange={(e) => handleUpdate(book.id, 'totalChapters', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Total Pages</span>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={book.totalPages}
                      onChange={(e) => handleUpdate(book.id, 'totalPages', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block ml-1">Current Page</span>
                    <input 
                      type="number"
                      className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={book.currentPage || 0}
                      onChange={(e) => handleUpdate(book.id, 'currentPage', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center justify-between lg:justify-end gap-4">
                    <div className="text-[9px] font-black text-slate-500 uppercase">
                      Pace: <span className="text-indigo-600">{Math.round(book.totalPages / 12)} pp/wk</span>
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
          )
        )}

        <button 
          onClick={() => {
            const newId = Math.random().toString(36).substr(2, 9);
            onUpdate([...textbooks, {
              id: newId, 
              title: 'New Textbook', 
              subject: 'General', 
              gradeLevel: 'G1', 
              totalChapters: 12, 
              totalPages: 120, 
              currentPage: 0,
              classId: activeClassId === 'general' ? undefined : activeClassId
            }]);
          }}
          className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 font-black text-[10px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-500 transition-all flex flex-col items-center justify-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          </div>
          <span>Assign New Resource to {activeClassId === 'general' ? 'General Pool' : classes.find(c => c.id === activeClassId)?.name}</span>
        </button>
      </div>
    </div>
  );
};

export default ResourcePlanner;