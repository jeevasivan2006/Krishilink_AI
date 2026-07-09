import { forbidden, unauthorized } from '../utils/apiResponse.js';
import {
  ADMIN_ROLES,
  hasAnyPermission,
  isAdminRole,
} from '../admin/constants/roles.js';

/**
 * Restrict access to admin panel roles (admin, manager, support).
 */
export function requireAdmin() {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }
    if (!isAdminRole(req.user.role)) {
      return forbidden(res, 'Admin access required');
    }
    next();
  };
}

/**
 * Role-based permission guard.
 * Usage: authorize(PERMISSIONS.USERS_LIST)
 */
export function authorize(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }
    if (!isAdminRole(req.user.role)) {
      return forbidden(res, 'Admin access required');
    }
    if (!hasAnyPermission(req.user.role, permissions)) {
      return forbidden(res, `Insufficient permissions. Required: ${permissions.join(' or ')}`);
    }
    next();
  };
}

/**
 * Restrict to specific roles.
 * Usage: requireRole('admin', 'manager')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Role '${req.user.role}' is not authorized for this action`);
    }
    next();
  };
}

export { ADMIN_ROLES };
