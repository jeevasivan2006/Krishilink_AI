import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout, AuthLayout, DashboardLayout, AdminLayout } from '@/layouts';
import { ProtectedRoute, PublicRoute } from '@/routes';
import { PageSpinner } from '@/components/ui/Spinner';
import { ROUTES, USER_ROLES } from '@/constants';

// Live Tracking Page
const LiveTrackingPage = lazy(() => import('@/pages/LiveTrackingPage'));


/* ── Public ────────────────────────────────────────────────────── */
const HomePage           = lazy(() => import('@/pages/HomePage'));
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'));
const ErrorPage          = lazy(() => import('@/pages/ErrorPage'));
const UnauthorizedPage   = lazy(() => import('@/pages/UnauthorizedPage'));

/* ── Auth ──────────────────────────────────────────────────────── */
const ChooseRolePage     = lazy(() => import('@/pages/auth/ChooseRolePage'));
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'));
const FarmerRegisterPage = lazy(() => import('@/pages/auth/FarmerRegisterPage'));
const DriverRegisterPage = lazy(() => import('@/pages/auth/DriverRegisterPage'));

/* ── Shared protected ──────────────────────────────────────────── */
const NotificationsPage  = lazy(() => import('@/pages/NotificationsPage'));

/* ── Farmer ────────────────────────────────────────────────────── */
const FarmerDashboardPage    = lazy(() => import('@/pages/farmer/FarmerDashboardPage'));
const FarmerBookingsPage     = lazy(() => import('@/pages/farmer/FarmerBookingsPage'));
const FarmerBookingDetailPage = lazy(() => import('@/pages/farmer/FarmerBookingDetailPage'));
const NewBookingPage         = lazy(() => import('@/pages/farmer/NewBookingPage'));
const FarmerProfilePage      = lazy(() => import('@/pages/farmer/FarmerProfilePage'));

/* ── Driver ────────────────────────────────────────────────────── */
const DriverDashboardPage   = lazy(() => import('@/pages/driver/DriverDashboardPage'));
const DriverTripsPage       = lazy(() => import('@/pages/driver/DriverTripsPage'));
const DriverProfilePage     = lazy(() => import('@/pages/driver/DriverProfilePage'));
const DriverMarketplacePage = lazy(() => import('@/pages/driver/DriverMarketplacePage'));
const BookingPage           = lazy(() => import('@/pages/BookingPage'));
const ReturnTripMarketplace = lazy(() => import('@/pages/ReturnTripMarketplace'));
const SharedTrucksPage      = lazy(() => import('@/pages/SharedTrucksPage'));
const AiRecommendationPage  = lazy(() => import('@/pages/AiRecommendationPage'));
const BookingHistoryPage    = lazy(() => import('@/pages/BookingHistoryPage'));

/* ── Admin ─────────────────────────────────────────────────────── */
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage     = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminBookingsPage  = lazy(() => import('@/pages/admin/AdminBookingsPage'));
const AdminDriversPage   = lazy(() => import('@/pages/admin/AdminDriversPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));

/* ── Admin fallback ────────────────────────────────────────────── */
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));

const Loading = <PageSpinner />;

export default function AppRouter() {
  return (
    <Suspense fallback={Loading}>
      <Routes>

        {/* ══════════════════════════════════════════════════════
            Public
        ══════════════════════════════════════════════════════ */}
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          <Route path={ROUTES.ERROR}         element={<ErrorPage />} />

          <Route element={<PublicRoute />}>
            <Route path={ROUTES.CHOOSE_ROLE} element={<ChooseRolePage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route element={<PublicRoute />}>
              <Route path={ROUTES.LOGIN}    element={<Navigate to={ROUTES.CHOOSE_ROLE} replace />} />
              <Route path={ROUTES.REGISTER} element={<Navigate to={ROUTES.CHOOSE_ROLE} replace />} />
              <Route path={ROUTES.FARMER_LOGIN}     element={<LoginPage role="farmer" />} />
              <Route path={ROUTES.FARMER_REGISTER}  element={<FarmerRegisterPage />} />
              <Route path={ROUTES.DRIVER_LOGIN}     element={<LoginPage role="driver" />} />
              <Route path={ROUTES.DRIVER_REGISTER}  element={<DriverRegisterPage />} />
              <Route path={ROUTES.ADMIN_LOGIN_PAGE} element={<LoginPage role="admin" />} />
            </Route>
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════════════
            Farmer (DashboardLayout — sidebar + topbar)
        ══════════════════════════════════════════════════════ */}
        <Route element={<ProtectedRoute roles={USER_ROLES.FARMER} />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.FARMER_DASHBOARD}         element={<FarmerDashboardPage />} />
            <Route path={ROUTES.FARMER_BOOKINGS}          element={<FarmerBookingsPage />} />
            <Route path={ROUTES.FARMER_BOOKING_NEW}       element={<NewBookingPage />} />
            <Route path={ROUTES.BOOKING}                  element={<BookingPage />} />
            <Route path={ROUTES.FARMER_BOOKING_DETAIL()}  element={<FarmerBookingDetailPage />} />
            <Route path={ROUTES.SHARED_TRUCKS}            element={<SharedTrucksPage />} />
            <Route path={ROUTES.AI_RECOMMENDATION}        element={<AiRecommendationPage />} />
            <Route path={ROUTES.BOOKING_HISTORY}          element={<BookingHistoryPage />} />
            <Route path={ROUTES.FARMER_PROFILE}           element={<FarmerProfilePage />} />
            <Route path={ROUTES.NOTIFICATIONS}            element={<NotificationsPage />} />
            <Route path={ROUTES.TRACKING(':bookingId')} element={<LiveTrackingPage />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════════════
            Driver (DashboardLayout)
        ══════════════════════════════════════════════════════ */}
        <Route element={<ProtectedRoute roles={USER_ROLES.DRIVER} />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DRIVER_DASHBOARD}   element={<DriverDashboardPage />} />
            <Route path={ROUTES.DRIVER_TRIPS}        element={<DriverTripsPage />} />
            <Route path={ROUTES.DRIVER_PROFILE}      element={<DriverProfilePage />} />
            <Route path={ROUTES.DRIVER_MARKETPLACE}  element={<DriverMarketplacePage />} />
            <Route path={ROUTES.RETURN_TRIPS}        element={<ReturnTripMarketplace />} />
            <Route path={ROUTES.NOTIFICATIONS}       element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════════════
            Admin (AdminLayout — dark sidebar)
        ══════════════════════════════════════════════════════ */}
        <Route element={<ProtectedRoute roles={USER_ROLES.ADMIN} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
            <Route path={ROUTES.ADMIN_USERS}     element={<AdminUsersPage />} />
            <Route path={ROUTES.ADMIN_BOOKINGS}  element={<AdminBookingsPage />} />
            <Route path={ROUTES.ADMIN_DRIVERS}   element={<AdminDriversPage />} />
            <Route path={ROUTES.ADMIN_ANALYTICS} element={<AdminAnalyticsPage />} />
            <Route path={ROUTES.NOTIFICATIONS}   element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* ── Redirects ─────────────────────────────────────── */}
        <Route path="/dashboard"         element={<Navigate to={ROUTES.FARMER_DASHBOARD} replace />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<Navigate to={ROUTES.ADMIN_LOGIN_PAGE} replace />} />

        {/* ── 404 ───────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}
