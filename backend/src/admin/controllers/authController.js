import * as authService from '../services/authService.js';
import { success, created } from '../../utils/apiResponse.js';

/**
 * POST /admin/auth/register
 * Public — farmer / driver self-registration
 */
export const registerUser = async (req, res) => {
  const result = await authService.register(req.body);
  created(res, result, 'Account created successfully');
};


export const login = async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  success(res, result, 'Login successful');
};

/**
 * POST /admin/auth/refresh
 */
export const refresh = async (req, res) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  success(res, result, 'Token refreshed');
};

/**
 * POST /admin/auth/change-password
 */
export const changePassword = async (req, res) => {
  const result = await authService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  success(res, result, 'Password changed');
};

/**
 * POST /admin/auth/logout
 */
export const logoutHandler = async (req, res) => {
  const result = await authService.logout(req.user.id);
  success(res, result, 'Logged out');
};

/**
 * GET /admin/auth/me
 * Returns the full user profile from the database (name, email, role, status).
 * This is used by the frontend on page refresh to verify the token is still valid
 * and to restore the full user object.
 */
export const getMe = async (req, res) => {
  const result = await authService.getProfile(req.user.id);
  success(res, result, 'Profile retrieved');
};
