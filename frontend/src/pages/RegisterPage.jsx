// Redirect shim — the real register pages now live under /register/:role
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
export default function RegisterPage() {
  return <Navigate to={ROUTES.CHOOSE_ROLE} replace />;
}
