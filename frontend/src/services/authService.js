/**
 * authService.js
 * ─────────────────────────────────────────────────────────────────
 * Thin orchestration layer between AuthContext and auth.api.js.
 * All network calls delegate to auth.api.js; this service handles
 * storage reads and boolean helpers so the context stays lean.
 */

import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe as apiGetMe,
  getStoredUser,
  clearSession,
} from '@/api/auth.api';
import { tokenStore } from '@/api/api';

const authService = {
  /**
   * Login with email + password.
   * @param {{ email, password, role }} credentials
   * @param {boolean} remember  If true, persists across sessions
   */
  async login({ email, password }, remember = false) {
    return apiLogin({ email, password }, remember);
  },

  /**
   * Register a new farmer or driver account.
   */
  async register(payload) {
    return apiRegister(payload);
  },

  /**
   * Verify the stored token and return the authenticated user.
   * Throws if the token is invalid / expired.
   */
  async getMe() {
    return apiGetMe();
  },

  /**
   * Logout — invalidates server session + clears storage.
   */
  async logout() {
    return apiLogout();
  },

  /**
   * Returns the stored user object without a network call (fast path).
   * Used for initial render before verification completes.
   */
  getStoredUser,

  /**
   * Returns the JWT access token from storage.
   */
  getToken() {
    return tokenStore.get();
  },

  /**
   * True if a token exists in storage (does not verify signature).
   */
  isAuthenticated() {
    return tokenStore.exists();
  },

  /**
   * Clear all auth state from storage without an API call.
   * Used by the Axios 401 interceptor.
   */
  clearSession,
};

export default authService;
