import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle } from '../../components/member/MemberUI';
import { LoadingState, ErrorState } from '../../components/States';
import { getUpcomingEvents, getUpcomingMeetings, getMyRoutines, getMyTasks } from '../../lib/memberApi';

interface CalItem { date: Date; title: string; type: string; time?: string; }

export default function CalendarPage() {
  const { member } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!member) return;
    Promise.all([getUpcomingEvents(), getUpcomingMeetings(), getMyRoutines(member.id), getMyTasks(member.id)])
      .then(([e, m, r, t]) => { setEvents(e); setMeetings(m); setRoutines(r); setTasks(t); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [member]);

  const allItems = useMemo<CalItem[]>(() => {
    const items: CalItem[] = [];
    events.forEach(e => items.push({ date: new Date(e.start_at), title: e.title, type: 'event', time: new Date(e.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }));
    meetings.forEach(m => items.push({ date: new Date(m.start_at), title: m.title, type: 'meeting', time: new Date(m.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }));
    tasks.filter(t => t.due_at).forEach(t => items.push({ date: new Date(t.due_at), title: t.title, type: 'task' }));
    return items;
  }, [events, meetings, tasks]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const itemsForDay = (day: number) => allItems.filter(item =>
    item.date.getFullYear() === year && item.date.getMonth() === month && item.date.getDate() === day
  );

  const routinesForDay = (dayIdx: number) => routines.filter(r => r.day_of_week === dayIdx && r.is_active);

  const typeColors: Record<string, string> = {
    event: 'bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300',
    meeting: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    task: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    routine: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load calendar." />;

  return (
    <div>
      <PageTitle title="Calendar" subtitle="Your events, meetings, and tasks at a glance" />

      <div className="card p-4 sm:p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">{monthName}</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayItems = itemsForDay(day);
            const dayRoutines = routinesForDay(new Date(year, month, day).getDay());
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            return (
              <div key={day} className={`min-h-[80px] sm:min-h-[100px] p-1.5 rounded-lg border ${isToday ? 'border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-950/20' : 'border-slate-100 dark:border-slate-800'}`}>
                <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`}>{day}</p>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item, idx) => (
                    <div key={idx} className={`text-xs px-1.5 py-0.5 rounded truncate ${typeColors[item.type]}`}>{item.title}</div>
                  ))}
                  {dayRoutines.slice(0, 2).map((r, idx) => (
                    <div key={`r${idx}`} className={`text-xs px-1.5 py-0.5 rounded truncate ${typeColors.routine}`}>{r.title}</div>
                  ))}
                  {dayItems.length + dayRoutines.length > 5 && (
                    <p className="text-xs text-slate-400 px-1">+{dayItems.length + dayRoutines.length - 5} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded ${color.split(' ')[0]}`} />
              <span className="text-xs text-slate-500 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
