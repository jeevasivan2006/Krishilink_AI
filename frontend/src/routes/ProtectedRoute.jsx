import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, ROLE_HOME_MAP } from '@/constants';
import { PageSpinner } from '@/components/ui/Spinner';

/**
 * Guards routes that require authentication.
 * Optionally restricts access by role(s).
 *
 * @param {string|string[]} roles  - Allowed roles. If omitted, any auth user passes.
 * @param {string}          redirectTo - Where to send unauthenticated users
 */
export default function ProtectedRoute({
  roles,
  redirectTo = ROUTES.CHOOSE_ROLE,
}) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner message="Verifying session…" />;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user?.role)) {
      // Redirect to the user's correct dashboard rather than a 403 page.
      // e.g. a farmer visiting /driver/dashboard goes to /farmer/dashboard.
      const home = ROLE_HOME_MAP[user?.role] ?? ROUTES.HOME;
      return <Navigate to={home} replace />;
    }
  }

  return <Outlet />;
}
