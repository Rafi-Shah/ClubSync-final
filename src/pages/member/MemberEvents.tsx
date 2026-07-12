import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, Badge } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyRegistrations, getUpcomingEvents } from '../../lib/memberApi';
import { supabase } from '../../lib/supabase';

export default function MemberEvents() {
  const { member } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    if (!member) return;
    try {
      const [e, r] = await Promise.all([getUpcomingEvents(), getMyRegistrations(member.id)]);
      setEvents(e);
      setRegistrations(r);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [member]);

  const isRegistered = (eventId: string) => registrations.some(r => r.event_id === eventId && r.status !== 'cancelled');
  const myReg = (eventId: string) => registrations.find(r => r.event_id === eventId);

  const handleRegister = async (eventId: string) => {
    if (!member) return;
    await supabase.from('event_registrations').insert({ event_id: eventId, member_id: member.id, status: 'registered' });
    await load();
  };

  const handleCancel = async (eventId: string) => {
    if (!member) return;
    await supabase.from('event_registrations').update({ status: 'cancelled' }).eq('event_id', eventId).eq('member_id', member.id);
    await load();
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load events." />;

  return (
    <div>
      <PageTitle title="Events" subtitle="Browse and register for upcoming events" />

      {events.length === 0 ? (
        <EmptyState title="No upcoming events" message="Check back later for new events." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(e => {
            const registered = isRegistered(e.id);
            const reg = myReg(e.id);
            return (
              <div key={e.id} className="card overflow-hidden flex flex-col">
                <div className="h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {e.cover_image_url ? (
                    <img src={e.cover_image_url} alt={e.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-400">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">{new Date(e.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-2">{e.title}</h3>
                  {e.location && <p className="text-sm text-slate-500 mb-2">{e.location}</p>}
                  {e.description && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">{e.description}</p>}
                  <div className="mt-4">
                    {registered ? (
                      <div className="flex items-center justify-between">
                        <Badge status={reg?.status ?? 'registered'} />
                        <button onClick={() => handleCancel(e.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => handleRegister(e.id)} className="btn-primary w-full">Register</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
