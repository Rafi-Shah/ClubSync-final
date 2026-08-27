import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageSlider from '../components/ImageSlider';
import FeaturesSection from '../components/FeaturesSection';
import StatsSection from '../components/StatsSection';
import CtaSection from '../components/CtaSection';
import Section, { SectionHeader } from '../components/Section';
import EventCard from '../components/EventCard';
import { LoadingState, ErrorState } from '../components/States';
import { getPublicEvents, getSiteSettings, getAchievements } from '../lib/api';
import type { ClubEvent, SiteSettings, Achievement } from '../types';

const heroSlides = [
  { image_url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1600', title: 'Where Passion Meets Purpose', subtitle: 'Join a community of innovators, builders, and leaders shaping the future of our campus.' },
  { image_url: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1600', title: 'Build. Learn. Grow.', subtitle: 'Hands-on projects, workshops, and events that turn ideas into impact.' },
  { image_url: 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=1600', title: 'Your Community Awaits', subtitle: 'Connect with 500+ members across six departments and dozens of teams.' },
];

const stats = [
  { value: '500+', label: 'Active Members' },
  { value: '6', label: 'Departments' },
  { value: '100+', label: 'Events Hosted' },
  { value: '2,000+', label: 'Volunteer Hours' },
];

export default function Home() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      getPublicEvents().then(d => setEvents(d.slice(0, 3))),
      getSiteSettings().then(setSettings),
      getAchievements().then(setAchievements),
    ])
      .then(() => setLoading(false))
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load page content." />;

  return (
    <>
      <ImageSlider slides={heroSlides} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Interactive Stats Section */}
      <StatsSection stats={stats} />

      {/* About preview */}
      <Section id="about-preview">
        <div className="container-page grid md:grid-cols-2 gap-8 items-center">
          <div>
            <SectionHeader title="About ClubSync" subtitle="A premier university club dedicated to technology, innovation, and community." />
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              {settings?.description ?? 'ClubSync empowers students to build, lead, and grow together through real-world projects, workshops, and community service.'}
            </p>
            <Link to="/about" className="btn-primary">Learn more</Link>
          </div>
          <div className="relative">
            <img src="https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800" alt="ClubSync team" className="rounded-xl shadow-lg w-full h-64 object-cover" loading="lazy" />
            <div className="absolute -bottom-4 -left-4 bg-primary-600 text-white rounded-xl p-4 shadow-lg hidden sm:block animate-float">
              <p className="text-2xl font-bold">7+ Years</p>
              <p className="text-sm text-primary-100">of excellence</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Featured events */}
      <Section className="bg-slate-50 dark:bg-slate-900/50">
        <div className="container-page">
          <SectionHeader title="Upcoming Events" subtitle="Join us at our next gathering." center />
          {events.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((e, i) => (
                <div key={e.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-6">No upcoming events. Check back soon!</p>
          )}
          <div className="text-center mt-6">
            <Link to="/events" className="btn-outline">View all events</Link>
          </div>
        </div>
      </Section>

      {/* Achievements preview */}
      {achievements.length > 0 && (
        <Section>
          <div className="container-page">
            <SectionHeader title="Our Achievements" subtitle="Recognized for excellence in innovation and community impact." center />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {achievements.slice(0, 3).map((a, i) => (
                <div key={a.id} className="card p-5 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 grid place-items-center mb-3">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-1.5">{a.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{a.description}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/achievements" className="btn-outline">See all achievements</Link>
            </div>
          </div>
        </Section>
      )}



      {/* SaaS Conversion CTA Section */}
      <CtaSection />
    </>
  );
}

