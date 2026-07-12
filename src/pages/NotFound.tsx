import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-7xl sm:text-9xl font-display font-bold text-primary-600 dark:text-primary-500">404</p>
      <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-4 mb-2">Page Not Found</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
