
import React, { useState, useRef } from 'react';
import { SchoolEvent, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface SchoolCalendarProps {
  events: SchoolEvent[];
  onUpdate: (updated: SchoolEvent[]) => void;
  language: Language;
}

const SchoolCalendar: React.FC<SchoolCalendarProps> = ({ events, onUpdate, language }) => {
  const [showAdd, setShowAdd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newEvent, setNewEvent] = useState<Partial<SchoolEvent>>({
    name: '', date: '', type: 'holiday'
  });

  const t = (key: string) => TRANSLATIONS[language][key] || key;
  const isKo = language === 'ko';

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
          const uploadedEvents = content.map(item => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            type: item.type || 'holiday'
          })) as SchoolEvent[];
          onUpdate([...events, ...uploadedEvents]);
        }
      } catch (err) {
        alert(isKo ? '잘못된 파일 형식입니다.' : 'Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{isKo ? '학사 일정' : 'Institutional Calendar'}</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Manage holidays and institutional milestones</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">Import JSON</button>
          <button onClick={() => setShowAdd(true)} className="px-8 py-4 bg-[#0f172a] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">+ {isKo ? '일정 추가' : 'Add Event'}</button>
        </div>
      </header>

      {showAdd && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl space-y-8 animate-fadeInUp">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isKo ? '이름' : 'Event Name'}</span>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all" placeholder={isKo ? '일정 이름을 입력하세요' : 'Holiday name...'} value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isKo ? '날짜' : 'Date'}</span>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{isKo ? '분류' : 'Type'}</span>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all appearance-none" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}>
                <option value="holiday">{isKo ? '공휴일' : 'Holiday'}</option>
                <option value="event">{isKo ? '행사' : 'Event'}</option>
                <option value="half-day">{isKo ? '단축 수업' : 'Half Day'}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">{isKo ? '취소' : 'Cancel'}</button>
            <button onClick={addEvent} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">{isKo ? '일정 저장' : 'Save Event'}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-300 font-black uppercase text-[11px] tracking-widest">No institutional events mapped to the calendar</p>
          </div>
        ) : events.sort((a,b) => a.date.localeCompare(b.date)).map(event => (
          <div key={event.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-5 overflow-hidden">
              <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center font-black shadow-lg ${
                event.type === 'holiday' ? 'bg-rose-500 text-white' : 
                event.type === 'half-day' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
              }`}>
                <span className="text-xl leading-none">{event.date.split('-')[2]}</span>
                <span className="text-[7px] uppercase tracking-tighter opacity-70">{new Date(event.date).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { month: 'short' })}</span>
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-slate-800 text-xs uppercase tracking-tight truncate pr-2">{event.name}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {event.type}
                </p>
              </div>
            </div>
            <button onClick={() => removeEvent(event.id)} className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 hover:text-rose-500 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolCalendar;
