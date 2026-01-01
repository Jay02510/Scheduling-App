
import React, { useState, useRef } from 'react';
import { SchoolEvent, SchoolProfile } from '../types';

interface SchoolCalendarProps {
  events: SchoolEvent[];
  onUpdate: (updated: SchoolEvent[]) => void;
}

const SchoolCalendar: React.FC<SchoolCalendarProps> = ({ events, onUpdate }) => {
  const [showAdd, setShowAdd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newEvent, setNewEvent] = useState<Partial<SchoolEvent>>({
    name: '', date: '', type: 'holiday'
  });

  const addEvent = () => {
    if (newEvent.name && newEvent.date) {
      onUpdate([...events, { ...newEvent, id: Math.random().toString(36).substr(2, 9) } as SchoolEvent]);
      setShowAdd(false);
      setNewEvent({ name: '', date: '', type: 'holiday' });
    }
  };

  const removeEvent = (id: string) => {
    onUpdate(events.filter(e => e.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        if (Array.isArray(content)) {
          // Map to SchoolEvent and add unique IDs
          const uploadedEvents = content.map(item => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            type: item.type || 'holiday'
          })) as SchoolEvent[];
          onUpdate([...events, ...uploadedEvents]);
        }
      } catch (err) {
        alert('Invalid calendar format. Please upload a valid JSON array of events.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Calendar</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage "Red Days" and institutional milestones.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".json"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
          >
            Upload JSON
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="px-6 py-3 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
          >
            + Add Event
          </button>
        </div>
      </header>

      {showAdd && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-xl space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Name</span>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold outline-none"
                placeholder="e.g. Winter Break"
                value={newEvent.name}
                onChange={e => setNewEvent({...newEvent, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold outline-none"
                value={newEvent.date}
                onChange={e => setNewEvent({...newEvent, date: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold outline-none"
                value={newEvent.type}
                onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
              >
                <option value="holiday">Holiday (Red Day)</option>
                <option value="event">Special Event</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-400 font-black text-[10px] uppercase">Cancel</button>
            <button onClick={addEvent} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Save Event</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase text-xs">No events registered in the institutional calendar.</div>
        ) : events.sort((a,b) => a.date.localeCompare(b.date)).map(event => (
          <div key={event.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm ${
                event.type === 'holiday' ? 'bg-rose-50 text-rose-500' : 
                event.type === 'half-day' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'
              }`}>
                {event.date.split('-')[2]}
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-slate-800 text-sm truncate">{event.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <span className={`text-[7px] font-black uppercase tracking-widest ${
                  event.type === 'holiday' ? 'text-rose-400' : 
                  event.type === 'half-day' ? 'text-amber-400' : 'text-indigo-400'
                }`}>
                  {event.type === 'holiday' ? 'Red Day' : event.type === 'half-day' ? 'Partial' : 'Standard'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => removeEvent(event.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-rose-300 hover:text-rose-500 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolCalendar;
