/**
 * auth.api.js — Authentication API
 * ─────────────────────────────────────────────────────────────────
 * All auth calls (farmer, driver, admin) go through the unified
 * /admin/auth/* endpoints which are role-aware and serve all user types.
 *
 * NOTE: The api.js response interceptor auto-unwraps the backend envelope:
 *   { status, message, data: <payload>, timestamp }  →  <payload>
 * So `const { data } = await api.post(...)` gives the payload directly.
 *
 * Backend endpoints (all mounted under /api/v1/admin/auth):
 *   POST  /admin/auth/register         Register farmer or driver (public)
 *   POST  /admin/auth/login            Login — all roles
 *   POST  /admin/auth/refresh          Refresh access token
 *   POST  /admin/auth/change-password  Change password (authenticated)
 *   POST  /admin/auth/logout           Logout (authenticated)
 *   GET   /admin/auth/me               Current profile (authenticated)
 */

import api, { tokenStore } from './api';
import { USER_KEY, TOKEN_KEY } from '@/constants';

const REMEMBER_KEY = 'krishilink_remember';

/**
 * Store session data from the auth payload.
 * @param {{ accessToken, user }} payload  — unwrapped payload from backend
 * @param {boolean} remember
 */
export function storeSession({ accessToken, user } = {}, remember = false) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }

  if (accessToken) {
    // tokenStore.set writes to localStorage so the request interceptor always finds it
    tokenStore.set(accessToken);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  tokenStore.remove();
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(USER_KEY);
    s.removeItem(REMEMBER_KEY);
  });
}

export function getStoredUser() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const raw = store.getItem(USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* continue */ }
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────
 *  Register (farmer | driver — admins are created manually)
 *  POST /api/v1/admin/auth/register
 *  Response payload: { user, accessToken, refreshToken, expiresIn }
 * ───────────────────────────────────────────────────────────────── */
export const register = async (payload) => {
  const { data } = await api.post('/admin/auth/register', payload);
  // data is the auto-unwrapped payload: { user, accessToken, refreshToken, expiresIn }
  storeSession(data, false);
  return data;
};

/* ─────────────────────────────────────────────────────────────────
 *  Login (farmer | driver | admin)
 *  POST /api/v1/admin/auth/login
 *  Response payload: { user, accessToken, refreshToken, expiresIn }
 * ───────────────────────────────────────────────────────────────── */
export const login = async ({ email, password }, remember = false) => {
  const { data } = await api.post('/admin/auth/login', { email, password });
  // data is the auto-unwrapped payload
  storeSession(data, remember);
  return data;
};

/* ─────────────────────────────────────────────────────────────────
 *  Token refresh
 *  POST /api/v1/admin/auth/refresh
 *  Response payload: { accessToken, expiresIn }
 * ───────────────────────────────────────────────────────────────── */
export const refreshToken = async (refreshTokenValue) => {
  const { data } = await api.post('/admin/auth/refresh', { refreshToken: refreshTokenValue });
  if (data?.accessToken) tokenStore.set(data.accessToken);
  return data;
};

/* ─────────────────────────────────────────────────────────────────
 *  Password management
 * ───────────────────────────────────────────────────────────────── */
export const changePassword = async (payload) => {
  const { data } = await api.post('/admin/auth/change-password', payload);
  return data;
};

/* ─────────────────────────────────────────────────────────────────
 *  Logout
 * ───────────────────────────────────────────────────────────────── */
export const logout = async () => {
  try {
    await api.post('/admin/auth/logout');
  } finally {
    clearSession();
  }
};

/* ─────────────────────────────────────────────────────────────────
 *  Get current user profile
 *  GET /api/v1/admin/auth/me
 *  Response payload: { id, name, email, phone, role, status }
 * ───────────────────────────────────────────────────────────────── */
export const getMe = async () => {
  const { data } = await api.get('/admin/auth/me');
  // data = { id, name, email, phone, role, status } (full profile from DB)
  // Merge with stored user to be resilient to any missing fields
  const stored = getStoredUser();
  const merged = { ...stored, ...data };

  // Persist fresh profile
  if (merged && merged.id) {
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
  }

  return merged;
};

/* ─────────────────────────────────────────────────────────────────
 *  Admin-specific aliases (used by admin panel)
 * ───────────────────────────────────────────────────────────────── */
export const adminLogin          = login;
export const adminRefreshToken   = refreshToken;
export const adminChangePassword = changePassword;
export const adminLogout         = logout;
export const adminGetMe          = getMe;
