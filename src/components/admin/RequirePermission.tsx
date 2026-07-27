import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps an admin route element and requires the given permission slug.
 * Hiding a nav item (see AdminLayout's visibleSections) only stops someone
 * from clicking into a page they don't have permission for — it does
 * nothing to stop them typing the URL directly. This closes that gap by
 * checking the same permission at the route level and redirecting to the
 * admin dashboard if it's missing.
 */
export default function RequirePermission({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { hasPermission, loading, profileLoading } = useAuth();

  // AdminLayout already blocks rendering (with a spinner) while
  // loading/profileLoading is true, so by the time this renders the
  // permission set is settled — but guard anyway in case of future reuse
  // outside AdminLayout.
  if (loading || profileLoading) return null;
  if (!hasPermission(slug)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}