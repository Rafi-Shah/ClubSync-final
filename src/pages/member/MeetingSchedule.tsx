import { useEffect, useState } from 'react';
import { PageTitle, Badge } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getUpcomingMeetings } from '../../lib/memberApi';
import { supabase } from '../../lib/supabase';

export default function MeetingSchedule() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [pastMeetings, setPastMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const now = new Date().toISOString();
    Promise.all([
      supabase.from('meetings').select('*').gte('start_at', now).order('start_at', { ascending: true }),
      supabase.from('meetings').select('*').lt('start_at', now).order('start_at', { ascending: false }).limit(20),
    ])
      .then(([up, past]) => { setMeetings(up.data ?? []); setPastMeetings(past.data ?? []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load meetings." />;

  const display = tab === 'upcoming' ? meetings : pastMeetings;

  return (
    <div>
      <PageTitle title="Meeting Schedule" subtitle="View upcoming and past meetings" />

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('upcoming')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'upcoming' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Upcoming ({meetings.length})</button>
        <button onClick={() => setTab('past')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'past' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Past ({pastMeetings.length})</button>
      </div>

      {display.length === 0 ? (
        <EmptyState title={tab === 'upcoming' ? 'No upcoming meetings' : 'No past meetings'} />
      ) : (
        <div className="space-y-3">
          {display.map(m => (
            <div key={m.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-primary-100 dark:bg-primary-950/50 grid place-items-center text-center shrink-0">
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{new Date(m.start_at).toLocaleDateString('en-US', { month: 'short' })}</p>
                <p className="text-lg font-bold text-primary-700 dark:text-primary-300 leading-none">{new Date(m.start_at).getDate()}</p>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 dark:text-white">{m.title}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{new Date(m.start_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  {m.location && <span className="text-xs text-slate-500">{m.location}</span>}
                  <span className="text-xs text-slate-400 capitalize">{m.meeting_type}</span>
                </div>
                {m.agenda && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{m.agenda}</p>}
              </div>
              <Badge status={m.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
