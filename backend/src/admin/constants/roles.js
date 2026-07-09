export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPPORT: 'support',
  FARMER: 'farmer',
  DRIVER: 'driver',
};

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPPORT];

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  USERS_LIST: 'users:list',
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  DRIVERS_LIST: 'drivers:list',
  DRIVERS_VIEW: 'drivers:view',
  DRIVERS_UPDATE: 'drivers:update',
  BOOKINGS_LIST: 'bookings:list',
  BOOKINGS_VIEW: 'bookings:view',
  BOOKINGS_UPDATE: 'bookings:update',
  ANALYTICS_VIEW: 'analytics:view',
  REVENUE_VIEW: 'revenue:view',
  REPORTS_VIEW: 'reports:view',
  MONITORING_VIEW: 'monitoring:view',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ALL_PERMISSIONS,
  [ROLES.MANAGER]: ALL_PERMISSIONS.filter(p => p !== PERMISSIONS.USERS_DELETE),
  [ROLES.SUPPORT]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.USERS_LIST,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.DRIVERS_LIST,
    PERMISSIONS.DRIVERS_VIEW,
    PERMISSIONS.BOOKINGS_LIST,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.MONITORING_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.FARMER]: [],
  [ROLES.DRIVER]: [],
};

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role, permission) {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAnyPermission(role, permissions) {
  const rolePerms = getPermissionsForRole(role);
  return permissions.some(p => rolePerms.includes(p));
}

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}
