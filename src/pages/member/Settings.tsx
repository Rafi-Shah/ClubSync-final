import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PageTitle } from '../../components/member/MemberUI';

export default function Settings() {
  const { member, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true, events: true, tasks: true });
  const [saved, setSaved] = useState(false);

  const handleSavePrefs = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageTitle title="Settings" subtitle="Manage your account preferences" />

      <div className="space-y-6 max-w-2xl">
        {/* Appearance */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Dark Mode</p>
              <p className="text-xs text-slate-500">Toggle between light and dark theme</p>
            </div>
            <button
              onClick={toggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notification preferences */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'push', label: 'Push Notifications', desc: 'In-app push notifications' },
              { key: 'events', label: 'Event Reminders', desc: 'Reminders for upcoming events' },
              { key: 'tasks', label: 'Task Deadlines', desc: 'Alerts for approaching task deadlines' },
            ].map(pref => (
              <div key={pref.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{pref.label}</p>
                  <p className="text-xs text-slate-500">{pref.desc}</p>
                </div>
                <button
                  onClick={() => setNotifPrefs(p => ({ ...p, [pref.key]: !p[pref.key as keyof typeof p] }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${(notifPrefs as any)[pref.key] ? 'bg-primary-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${(notifPrefs as any)[pref.key] ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSavePrefs} className="btn-primary mt-4">
            {saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>

        {/* Account info */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-900 dark:text-white">{member?.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Member Code</span><span className="font-medium text-slate-900 dark:text-white">{member?.member_code}</span></div>
          </div>
          <button onClick={signOut} className="mt-4 w-full btn text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
