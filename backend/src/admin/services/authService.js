import bcrypt from 'bcryptjs';
import createError from 'http-errors';
import { query } from '../../database/index.js';
import { withTransaction } from '../../database/transaction.js';
import { signAccessToken, signRefreshToken, parseDuration } from '../../config/jwt.js';
import { isAdminRole } from '../constants/roles.js';
import { logAction } from './dashboardService.js';

const BCRYPT_ROUNDS = 12;

/**
 * Register a new farmer or driver account.
 * Admins are created manually — this endpoint is for public self-registration.
 */
export async function register({ name, email, phone, password, role, farmName, farmLocation, vehicleType, licenseNumber }) {
  // Only farmers and drivers may self-register
  const allowedRoles = ['farmer', 'driver'];
  if (!allowedRoles.includes(role)) {
    throw createError(400, 'Registration is only available for farmer and driver roles');
  }

  return withTransaction(async (client) => {
    // Check for duplicate email
    const { rows: existing } = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );
    if (existing.length > 0) {
      throw createError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const { rows } = await client.query(
      `INSERT INTO users (name, email, phone, role, password_hash, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
       RETURNING id, name, email, role, status`,
      [name, email, phone || null, role, passwordHash],
    );
    const user = rows[0];

    // Store optional profile fields using SAVEPOINTs so a missing table
    // doesn't abort the whole transaction (PostgreSQL transaction-level error).
    if (role === 'farmer' && (farmName || farmLocation)) {
      try {
        await client.query('SAVEPOINT sp_farmer_profile');
        await client.query(
          `INSERT INTO farmer_profiles (user_id, farm_name, farm_location, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (user_id) DO UPDATE SET farm_name = EXCLUDED.farm_name, farm_location = EXCLUDED.farm_location`,
          [user.id, farmName || null, farmLocation || null],
        );
        await client.query('RELEASE SAVEPOINT sp_farmer_profile');
      } catch {
        await client.query('ROLLBACK TO SAVEPOINT sp_farmer_profile');
      }
    }

    if (role === 'driver' && (vehicleType || licenseNumber)) {
      try {
        await client.query('SAVEPOINT sp_driver_profile');
        await client.query(
          `INSERT INTO driver_profiles (user_id, vehicle_type, license_number, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (user_id) DO UPDATE SET vehicle_type = EXCLUDED.vehicle_type, license_number = EXCLUDED.license_number`,
          [user.id, vehicleType || null, licenseNumber || null],
        );
        await client.query('RELEASE SAVEPOINT sp_driver_profile');
      } catch {
        await client.query('ROLLBACK TO SAVEPOINT sp_driver_profile');
      }
    }

    const accessToken  = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id, role: user.role });

    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const expiresAt = new Date(Date.now() + parseDuration(refreshExpiresIn));
    await client.query(
      `UPDATE users SET refresh_token = $1, refresh_token_expires_at = $2 WHERE id = $3`,
      [refreshToken, expiresAt, user.id],
    );

    return {
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    };
  });
}

/**
 * Authenticate any user by email + password (farmer, driver, admin).
 * Returns JWT access & refresh tokens.
 */
export async function login(email, password) {
  const { rows } = await query(
    `SELECT id, name, email, role, status, password_hash
     FROM users WHERE email = $1`,
    [email],
  );

  const user = rows[0];
  if (!user) throw createError(401, 'Invalid email or password');

  if (user.status !== 'active') {
    throw createError(403, 'Account is not active. Contact an administrator.');
  }

  if (!user.password_hash) {
    throw createError(401, 'Password not set. Contact an administrator.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw createError(401, 'Invalid email or password');

  const accessToken  = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });

  // Store refresh token in database
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const expiresAt = new Date(Date.now() + parseDuration(refreshExpiresIn));
  await query(
    `UPDATE users SET refresh_token = $1, refresh_token_expires_at = $2 WHERE id = $3`,
    [refreshToken, expiresAt, user.id],
  );

  return {
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  };
}


/**
 * Issue a new access token from a valid refresh token.
 */
export async function refreshAccessToken(token) {
  const { rows } = await query(
    `SELECT id, name, email, role, status, refresh_token, refresh_token_expires_at
     FROM users
     WHERE refresh_token = $1`,
    [token],
  );

  const user = rows[0];
  if (!user) throw createError(401, 'Invalid refresh token');

  if (user.refresh_token_expires_at && new Date(user.refresh_token_expires_at) < new Date()) {
    // Clear expired token
    await query(`UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE id = $1`, [user.id]);
    throw createError(401, 'Refresh token expired. Please log in again.');
  }

  if (user.status !== 'active') {
    throw createError(403, 'Account is not active');
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });

  return {
    accessToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  };
}

/**
 * Change the password for the authenticated user.
 */
export async function changePassword(userId, currentPassword, newPassword) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [userId],
    );

    const user = rows[0];
    if (!user) throw createError(404, 'User not found');

    if (!user.password_hash) {
      throw createError(400, 'No existing password set. Contact an administrator.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) throw createError(401, 'Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await client.query(
      `UPDATE users SET password_hash = $1, refresh_token = NULL, refresh_token_expires_at = NULL WHERE id = $2`,
      [newHash, userId],
    );

    await logAction(userId, 'auth.password_changed', 'user', userId, {});
    return { message: 'Password changed successfully' };
  });
}

/**
 * Logout — invalidate the refresh token.
 */
export async function logout(userId) {
  await query(
    `UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE id = $1`,
    [userId],
  );
  return { message: 'Logged out successfully' };
}

/**
 * Get full user profile by ID.
 * Used by GET /admin/auth/me to return complete user data (not just JWT claims).
 */
export async function getProfile(userId) {
  const { rows } = await query(
    `SELECT id, name, email, phone, role, status FROM users WHERE id = $1`,
    [userId],
  );
  const user = rows[0];
  if (!user) throw createError(404, 'User not found');

  return {
    id:     user.id,
    name:   user.name,
    email:  user.email,
    phone:  user.phone,
    role:   user.role,
    status: user.status,
  };
}

