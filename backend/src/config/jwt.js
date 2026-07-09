import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'krishilink-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Sign an access token for the given payload.
 * @param {{ id: string, role: string }} payload
 * @returns {string}
 */
export function signAccessToken(payload) {
  return jwt.sign(
    { id: payload.id, role: payload.role, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

/**
 * Sign a refresh token for the given payload.
 * @param {{ id: string, role: string }} payload
 * @returns {string}
 */
export function signRefreshToken(payload) {
  return jwt.sign(
    { id: payload.id, role: payload.role, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN },
  );
}

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Parse the expiry duration string into milliseconds.
 * Supports: '15m', '1h', '7d'
 * @param {string} duration
 * @returns {number}
 */
export function parseDuration(duration) {
  const match = duration.match(/^(\d+)(m|h|d)$/);
  if (!match) return 15 * 60 * 1000; // default 15 min
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { m: 60 * 1000, h: 3600 * 1000, d: 86400 * 1000 };
  return value * multipliers[unit];
}

export default {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  parseDuration,
};
