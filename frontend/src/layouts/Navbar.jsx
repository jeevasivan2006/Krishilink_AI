import { useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Sprout, Bell, ChevronDown,
  LayoutDashboard, Package, Truck, LogOut,
  User, Sun, Moon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';
import Button from '@/components/ui/Button';
import { useOutsideClick } from '@/hooks';

const navLinks = [
  { label: 'Home',         to: ROUTES.HOME      },
  { label: 'Features',     to: '/#features'     },
  { label: 'How it Works', to: '/#how-it-works' },
  { label: 'About',        to: '/#about'        },
  { label: 'Contact',      to: '/#contact'      },
];

export default function Navbar() {
  const { user, isAuthenticated, logout, isFarmer, isDriver, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useOutsideClick(profileRef, () => setProfileOpen(false), profileOpen);

  const dashboardRoute = isFarmer
    ? ROUTES.FARMER_DASHBOARD
    : isDriver
    ? ROUTES.DRIVER_DASHBOARD
    : isAdmin
    ? ROUTES.ADMIN_DASHBOARD
    : ROUTES.HOME;

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2 shrink-0 group">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center group-hover:bg-primary-700 transition-colors">
              <Sprout size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
              Krishi<span className="text-primary-600">Link</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link
                  to={ROUTES.NOTIFICATIONS}
                  aria-label="Notifications"
                  className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                >
                  <Bell size={18} />
                  {/* Unread dot — wired to real data in a notification feature later */}
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
                </Link>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {userInitials}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                      {user?.name?.split(' ')[0] ?? 'Account'}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn('text-gray-400 transition-transform', profileOpen && 'rotate-180')}
                    />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1   }}
                        exit={{   opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-modal border border-gray-100 dark:border-gray-700 py-1 z-50 origin-top-right"
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role}</p>
                        </div>

                        <DropdownItem icon={<LayoutDashboard size={15} />} onClick={() => { navigate(dashboardRoute); setProfileOpen(false); }}>
                          Dashboard
                        </DropdownItem>
                        <DropdownItem icon={<User size={15} />} onClick={() => { navigate(`/${user?.role}/profile`); setProfileOpen(false); }}>
                          Profile
                        </DropdownItem>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                        <DropdownItem icon={<LogOut size={15} />} onClick={() => { logout(); setProfileOpen(false); }} danger>
                          Sign out
                        </DropdownItem>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.CHOOSE_ROLE)}>
                  Sign in
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.CHOOSE_ROLE)}>
                  Get started
                </Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{   height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'px-3 py-2.5 rounded-xl text-sm font-medium',
                      isActive
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-200',
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}

              {!isAuthenticated && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" fullWidth onClick={() => { navigate(ROUTES.CHOOSE_ROLE); setMobileOpen(false); }}>
                    Sign in
                  </Button>
                  <Button variant="primary" size="sm" fullWidth onClick={() => { navigate(ROUTES.CHOOSE_ROLE); setMobileOpen(false); }}>
                    Register
                  </Button>
                </div>
              )}

              {isAuthenticated && (
                <Button variant="ghost" size="sm" leftIcon={<LogOut size={15} />} onClick={() => { logout(); setMobileOpen(false); }}>
                  Sign out
                </Button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function DropdownItem({ icon, children, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
