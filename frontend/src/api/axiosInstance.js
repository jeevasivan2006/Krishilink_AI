/**
 * axiosInstance.js
 * ─────────────────────────────────────────────────────────────────
 * Single Axios instance for all KrishiLink API calls.
 *
 * Features
 *   • Correct baseURL  → http://localhost:3000/api/v1
 *   • Request interceptor  – automatic JWT injection from localStorage
 *   • Response interceptor – ApiError normalisation, 401 handling, retry
 *   • Loading state counter – onLoadingChange() / isLoading()
 *   • Retry logic           – 1 auto-retry on network errors / 5xx
 *   • Global error hook     – setGlobalErrorHandler(fn) for toast wiring
 */

import axios from 'axios';
import { TOKEN_KEY } from '@/constants';

/* ─────────────────────────────────────────────────────────────────
 *  ApiError
 *  Every failed request is rejected with this instead of raw Axios
 *  errors, so callers always get a predictable { message, status }.
 * ───────────────────────────────────────────────────────────────── */
export class ApiError extends Error {
  constructor(message, status = 0, data = null, code = null) {
    super(message);
    this.name       = 'ApiError';
    this.status     = status;
    this.data       = data;
    this.code       = code;
    this.isApiError = true;
  }

  get isNetworkError()    { return this.status === 0;   }
  get isUnauthorized()    { return this.status === 401; }
  get isForbidden()       { return this.status === 403; }
  get isNotFound()        { return this.status === 404; }
  get isValidationError() { return this.status === 400 || this.status === 422; }
  get isServerError()     { return this.status >= 500;  }

  /** Field-level validation messages when the server sends them. */
  get validationErrors() {
    return this.data?.errors ?? this.data?.details ?? null;
  }
}
