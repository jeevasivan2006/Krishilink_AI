/**
 * api.js — KrishiLink HTTP Client
 * ─────────────────────────────────────────────────────────────────
 * Self-contained Axios instance with:
 *
 *  1. Axios Instance       baseURL = http://localhost:3000/api/v1
 *  2. Request Interceptor  automatic JWT injection
 *  3. Response Interceptor error normalisation, 401 redirect
 *  4. JWT Token Storage    tokenStore helpers
 *  5. Loading States       onLoadingChange() / isLoading()
 *  6. Retry Logic          1 auto-retry on network/5xx errors
 *  7. Global Error Hook    setGlobalErrorHandler(fn)
 *  8. ApiError class       predictable error shape for all callers
 */

import axios from 'axios';
import { TOKEN_KEY } from '@/constants';

/* ═══════════════════════════════════════════════════════════════
   1. ApiError class
   Every rejected request throws an ApiError instead of a raw
   Axios error — callers always receive { message, status, data }.
═══════════════════════════════════════════════════════════════ */
export class ApiError extends Error {
  /**
   * @param {string} message  Human-readable description
   * @param {number} status   HTTP status code (0 = network/timeout)
   * @param {*}      data     Raw server response body
   * @param {string} code     Optional machine-readable error code
   */
  constructor(message, status = 0, data = null, code = null) {
    super(message);
    this.name       = 'ApiError';
    this.status     = status;
    this.data       = data;
    this.code       = code;
    this.isApiError = true;
  }

  get isNetworkError()    { return this.status === 0;              }
  get isUnauthorized()    { return this.status === 401;            }
  get isForbidden()       { return this.status === 403;            }
  get isNotFound()        { return this.status === 404;            }
  get isValidationError() { return this.status === 400 || this.status === 422; }
  get isServerError()     { return this.status >= 500;             }

  /** Field-level errors when the server sends them in data.errors */
  get validationErrors()  { return this.data?.errors ?? this.data?.details ?? null; }
}

/* ═══════════════════════════════════════════════════════════════
   2. JWT Token Storage
   Thin wrappers over localStorage so every module imports from
   one place and switching to httpOnly cookies later is trivial.
═══════════════════════════════════════════════════════════════ */
export const tokenStore = {
  get: () =>
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  set: (token) => {
    // Mirror into both so interceptor always finds it regardless of storage choice
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
  exists: () =>
    Boolean(
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
    ),
};

/* ═══════════════════════════════════════════════════════════════
   3. Loading State
   Simple in-process request counter.
   Subscribe:  const unsub = onLoadingChange(fn)  — call unsub() to stop.
   Read:       isLoading()  → boolean
═══════════════════════════════════════════════════════════════ */
let _pending = 0;
const _loadingListeners = new Set();

function _notifyLoading(loading) {
  _loadingListeners.forEach((fn) => fn(loading));
}
function _inc() { _pending += 1; if (_pending === 1) _notifyLoading(true);  }
function _dec() { _pending  = Math.max(0, _pending - 1); if (_pending === 0) _notifyLoading(false); }

/** Subscribe to global loading changes. Returns unsubscribe function. */
export function onLoadingChange(fn) {
  _loadingListeners.add(fn);
  return () => _loadingListeners.delete(fn);
}

/** Returns true when at least one request is in-flight. */
export function isLoading() {
  return _pending > 0;
}

/* ═══════════════════════════════════════════════════════════════
   4. Global Error Handler
   Wire to toast in App.jsx:
     setGlobalErrorHandler((err) => toast.error(err.message));
   404s are intentionally excluded — treat them as data, not errors.
═══════════════════════════════════════════════════════════════ */
let _globalErrorHandler = null;

/** Register a handler that fires on every non-404, non-401 ApiError. */
export function setGlobalErrorHandler(fn) {
  _globalErrorHandler = fn;
}

/* ═══════════════════════════════════════════════════════════════
   5. Retry Logic
   One automatic retry on network failures and 5xx responses.
   Never retries: 400 · 401 · 403 · 404 · 409 · 422
═══════════════════════════════════════════════════════════════ */
const RETRY = {
  max:             1,
  baseDelayMs:     800,
  noRetryStatuses: new Set([400, 401, 403, 404, 409, 422]),
};

function _shouldRetry(error, config) {
  const count  = config._retryCount || 0;
  if (count >= RETRY.max) return false;
  const status = error.response?.status;
  if (!status && !error.response)                         return true; // network / timeout
  if (status >= 500 && !RETRY.noRetryStatuses.has(status)) return true; // 5xx
  return false;
}

const _wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ═══════════════════════════════════════════════════════════════
   6. Axios Instance
   baseURL already includes /api/v1.
   Every endpoint path is relative:
     api.get('/bookings')  →  GET http://localhost:3000/api/v1/bookings
═══════════════════════════════════════════════════════════════ */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1`,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

/* ── Request interceptor ─────────────────────────────────────── */
api.interceptors.request.use(
  (config) => {
    // Inject JWT Bearer token when present
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // Increment global loading counter
    _inc();
    return config;
  },
  (error) => { _dec(); return Promise.reject(error); },
);

/* ── Response interceptor ────────────────────────────────────── */
api.interceptors.response.use(
  (response) => {
    _dec();
    // The backend always wraps responses as:
    //   { status: 'success', message: '...', data: <payload>, timestamp }
    // We auto-unwrap so every API function receives the payload directly.
    // If there is no .data field (unexpected response), return as-is.
    const body = response.data;
    if (body && typeof body === 'object' && 'status' in body && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },

  async (error) => {
    _dec();

    const cfg    = error.config || {};
    const status = error.response?.status;

    // Auto-retry on transient failures
    if (_shouldRetry(error, cfg)) {
      cfg._retryCount = (cfg._retryCount || 0) + 1;
      await _wait(RETRY.baseDelayMs * cfg._retryCount);
      _inc();                    // account for the retry in loading counter
      return api(cfg);
    }

    // Build normalised ApiError
    const message =
      error.response?.data?.message ||
      error.response?.data?.error   ||
      error.message                 ||
      'An unexpected error occurred';

    const apiError = new ApiError(
      message,
      status ?? 0,
      error.response?.data ?? null,
      error.response?.data?.code ?? null,
    );

    // 401 — clear token + user + hard-redirect; no further handling needed
    if (status === 401) {
      tokenStore.remove();
      localStorage.removeItem('krishilink_user');
      sessionStorage.removeItem('krishilink_user');
      localStorage.removeItem('krishilink_remember');
      
      // Redirect to choose-role (not /login which itself redirects to /choose-role)
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/choose-role') &&
          !window.location.pathname.includes('/register')) {
        window.location.replace('/choose-role');
      }
      return Promise.reject(apiError);
    }

    // Fire global error handler for everything except 404 (silent)
    if (_globalErrorHandler && status !== 404) {
      _globalErrorHandler(apiError);
    }

    return Promise.reject(apiError);
  },
);

export default api;
