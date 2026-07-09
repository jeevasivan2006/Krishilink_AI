// Redirect shim — the real login pages now live under /login/:role
// This keeps any old /login links working.
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
export default function LoginPage() {
  return <Navigate to={ROUTES.CHOOSE_ROLE} replace />;
}
