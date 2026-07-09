import { useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Truck, Bell, Menu, X,
  Sprout, LogOut, User, ChevronDown, Sun, Moon,
  MapPin, ShoppingBag, ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ROUTES, USER_ROLES } from '@/constants';
import { cn } from '@/utils';
import { useOutsideClick, useScrollTop } from '@/hooks';

/* ── Nav config per role ──────────────────────────────────────── */
const FARMER_NAV = [
  { to: ROUTES.FARMER_DASHBOARD,   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: ROUTES.FARMER_BOOKINGS,    icon: Package,          label: 'My Bookings' },
  { to: ROUTES.FARMER_BOOKING_NEW, icon: ShoppingBag,      label: 'New Booking' },
  { to: ROUTES.FARMER_PROFILE,     icon: User,             label: 'Profile'     },
];

const DRIVER_NAV = [
  { to: ROUTES.DRIVER_DASHBOARD,   icon: LayoutDashboard,  label: 'Dashboard'    },
  { to: ROUTES.DRIVER_TRIPS,       icon: Truck,            label: 'My Trips'     },
  { to: ROUTES.DRIVER_MARKETPLACE, icon: ArrowLeftRight,   label: 'Marketplace'  },
  { to: ROUTES.NOTIFICATIONS,      icon: Bell,             label: 'Notifications'},
  { to: ROUTES.DRIVER_PROFILE,     icon: User,             label: 'Profile'      },
];

export default function DashboardLayout() {
  useScrollTop();
  const { user, logout, isFarmer } = useAuth();
  const { isDark, toggleTheme }    = useTheme();
  const navigate = useNavigate();

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const profileRef = useRef(null);
  useOutsideClick(profileRef, () => setProfileOpen(false), profileOpen);

  const navItems  = isFarmer ? FARMER_NAV : DRIVER_NAV;
  const initials  = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';
  const roleLabel = isFarmer ? 'Farmer' : 'Driver';
  const roleColor = isFarmer ? 'text-primary-600' : 'text-earth-600 dark:text-earth-400';

  return (
    <div className="min-h-dvh flex bg-gray-50 dark:bg-gray-950">

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col w-64',
        'bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b
                        border-gray-100 dark:border-gray-800 shrink-0">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Sprout size={17} className="text-white" />
            </div>
            <span className="font-display font-bold text-base text-gray-900 dark:text-white">
              Krishi<span className="text-primary-600">Link</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:bg-gray-100
                       dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role pill */}
        <div className="px-5 py-3 shrink-0">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
            isFarmer
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
          )}>
            {isFarmer ? '🌾' : '🚛'} {roleLabel} Portal
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center
                            text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name ?? 'User'}
              </p>
              <p className={cn('text-xs truncate capitalize', roleColor)}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-sm
                       text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                       transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 sm:px-6
                           bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
                           border-b border-gray-100 dark:border-gray-800">

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100
                       dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Page title slot — filled by DashboardLayout consumers via window title */}
          <div className="hidden lg:block" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800
                         dark:text-gray-400 transition-colors"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications */}
            <Link
              to={ROUTES.NOTIFICATIONS}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100
                         dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500
                               ring-2 ring-white dark:ring-gray-900" />
            </Link>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
                           hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-expanded={profileOpen}
              >
                <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center
                                justify-center text-white text-xs font-semibold shrink-0">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700
                                 dark:text-gray-200 max-w-[100px] truncate">
                  {user?.name?.split(' ')[0] ?? 'Account'}
                </span>
                <ChevronDown size={13} className={cn(
                  'text-gray-400 transition-transform',
                  profileOpen && 'rotate-180',
                )} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{   opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800
                               rounded-2xl shadow-modal border border-gray-100
                               dark:border-gray-700 py-1 z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user?.name}
                      </p>
                      <p className={cn('text-xs truncate capitalize', roleColor)}>
                        {roleLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => { navigate(isFarmer ? ROUTES.FARMER_PROFILE : ROUTES.DRIVER_PROFILE); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                                 text-gray-700 dark:text-gray-200 hover:bg-gray-50
                                 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User size={14} /> Profile
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={() => { logout(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                                 text-red-600 dark:text-red-400 hover:bg-red-50
                                 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
