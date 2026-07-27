import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { signIn, user, hasPermission, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Wait for the roles/permissions fetch to actually finish
    // (profileLoading), then redirect regardless of whether roles came
    // back empty — previously this required roles.length > 0, so a
    // signed-in user with no roles assigned was left stuck on the login
    // screen forever. portal.admin is the actual permission
    // RoleManagement grants/revokes, not just a hardcoded role-slug list.
    if (loading || profileLoading || !user) return;
    navigate(hasPermission('portal.admin') ? '/admin' : '/portal', { replace: true });
  }, [loading, profileLoading, user, hasPermission, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      // Navigation handled by useEffect when roles load
    } catch (err: any) {
      setError(err.message ?? 'Invalid credentials. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 dark:from-slate-950 dark:to-primary-950/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl text-slate-900 dark:text-white">
            <span className="w-10 h-10 rounded-xl bg-primary-600 text-white grid place-items-center">CS</span>
            ClubSync
          </Link>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Member Portal Sign In</p>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">Welcome Back</h1>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm mb-4 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@university.edu" autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Not a member yet?{' '}
              <Link to="/recruitment" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Apply here</Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}