import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';
import { ROUTES, ROLE_HOME_MAP, USER_ROLES } from '@/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ── Verify stored token on mount ─────────────────────────────── */
  useEffect(() => {
    const verify = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }
      try {
        // getMe merges server response with stored user (preserves name/email)
        const me = await authService.getMe();
        setUser(me);
      } catch {
        // Token invalid/expired — clear everything
        authService.clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  /* ── login ─────────────────────────────────────────────────────── */
  const login = useCallback(
    async ({ email, password, remember = false }) => {
      const data = await authService.login({ email, password }, remember);
      // Backend returns { user, accessToken, refreshToken, expiresIn }
      const authUser = data.user ?? data;
      setUser(authUser);
      const destination = ROLE_HOME_MAP[authUser?.role] ?? ROUTES.HOME;
      navigate(destination, { replace: true });
      return data;
    },
    [navigate],
  );

  /* ── register ──────────────────────────────────────────────────── */
  const register = useCallback(
    async (payload) => {
      const data = await authService.register(payload);
      const authUser = data.user ?? data;
      setUser(authUser);
      const destination = ROLE_HOME_MAP[authUser?.role] ?? ROUTES.HOME;
      navigate(destination, { replace: true });
      return data;
    },
    [navigate],
  );

  /* ── logout ────────────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if server call fails, clear local state
    } finally {
      setUser(null);
      navigate(ROUTES.CHOOSE_ROLE, { replace: true });
    }
  }, [navigate]);

  const isAuthenticated = Boolean(user);
  const isFarmer = user?.role === USER_ROLES.FARMER;
  const isDriver = user?.role === USER_ROLES.DRIVER;
  const isAdmin  = user?.role === USER_ROLES.ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user, loading, isAuthenticated,
        isFarmer, isDriver, isAdmin,
        login, register, logout, setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export default AuthContext;
