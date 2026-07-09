import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLE_HOME_MAP, ROUTES } from '@/constants';
import { PageSpinner } from '@/components/ui/Spinner';

/**
 * Guards public-only routes (Login, Register).
 * Redirects already-authenticated users to their role dashboard.
 */
export default function PublicRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <PageSpinner message="Loading…" />;

  if (isAuthenticated) {
    const destination = ROLE_HOME_MAP[user?.role] ?? ROUTES.HOME;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
