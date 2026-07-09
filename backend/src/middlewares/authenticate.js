import { unauthorized } from '../utils/apiResponse.js';
import { verifyToken } from '../config/jwt.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * JWT-based authentication middleware.
 *
 * Reads a Bearer token from the Authorization header, verifies it,
 * and sets `req.user = { id, role }`.
 *
 * In non-production environments, the legacy X-User-Id / X-User-Role
 * header fallback is preserved for dev/testing convenience.
 */
export default function authenticate(req, res, next) {
  // --- 1. Try JWT Bearer token ---
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = verifyToken(token);
      if (decoded.type !== 'access') {
        return unauthorized(res, 'Invalid token type. Use an access token.');
      }
      req.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Token expired. Please refresh or log in again.'
          : 'Invalid or malformed token.';
      return unauthorized(res, message);
    }
  }

  // --- 2. Dev-only fallback: X-User-Id header ---
  if (process.env.NODE_ENV !== 'production') {
    const userId = req.headers['x-user-id'];
    if (userId) {
      if (!UUID_RE.test(userId)) {
        return unauthorized(res, 'Invalid X-User-Id format');
      }
      req.user = { id: userId, role: req.headers['x-user-role'] || 'farmer' };
      return next();
    }
  }

  return unauthorized(res, 'Authentication required. Provide a Bearer token.');
}
