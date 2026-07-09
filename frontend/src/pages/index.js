// ── Public / misc ─────────────────────────────────────────────────
export { default as HomePage }         from './HomePage';
export { default as DashboardPage }    from './DashboardPage';
export { default as NotFoundPage }     from './NotFoundPage';
export { default as ErrorPage }        from './ErrorPage';
export { default as UnauthorizedPage } from './UnauthorizedPage';
export { default as NotificationsPage } from './NotificationsPage';

// ── Auth shims (redirect to choose-role) ──────────────────────────
export { default as LoginPage }    from './LoginPage';
export { default as RegisterPage } from './RegisterPage';

// ── Auth module ───────────────────────────────────────────────────
export { default as ChooseRolePage }     from './auth/ChooseRolePage';
export { default as FarmerLoginPage }    from './auth/LoginPage';
export { default as DriverLoginPage }    from './auth/LoginPage';
export { default as AdminLoginPage }     from './auth/LoginPage';
export { default as FarmerRegisterPage } from './auth/FarmerRegisterPage';
export { default as DriverRegisterPage } from './auth/DriverRegisterPage';

// ── Farmer feature ────────────────────────────────────────────────
export { default as FarmerDashboardPage }     from './farmer/FarmerDashboardPage';
export { default as FarmerBookingsPage }      from './farmer/FarmerBookingsPage';
export { default as FarmerBookingDetailPage } from './farmer/FarmerBookingDetailPage';
export { default as NewBookingPage }          from './farmer/NewBookingPage';
export { default as FarmerProfilePage }       from './farmer/FarmerProfilePage';

// ── Driver feature ────────────────────────────────────────────────
export { default as DriverDashboardPage }   from './driver/DriverDashboardPage';
export { default as DriverTripsPage }       from './driver/DriverTripsPage';
export { default as DriverProfilePage }     from './driver/DriverProfilePage';
export { default as DriverMarketplacePage } from './driver/DriverMarketplacePage';

// ── Admin feature ─────────────────────────────────────────────────
export { default as AdminDashboardPage } from './admin/AdminDashboardPage';
export { default as AdminUsersPage }     from './admin/AdminUsersPage';
export { default as AdminBookingsPage }  from './admin/AdminBookingsPage';
export { default as AdminDriversPage }   from './admin/AdminDriversPage';
export { default as AdminAnalyticsPage } from './admin/AdminAnalyticsPage';
