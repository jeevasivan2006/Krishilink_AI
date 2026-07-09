import { Outlet, Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants';

/**
 * Clean centered layout for Login and Register pages.
 * Two-column on desktop: decorative panel left, form right.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-dvh flex">
      {/* Left decorative panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] gradient-hero flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 left-16 h-56 w-56 rounded-full bg-white/5" />

        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-3 w-fit">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Sprout size={22} className="text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white">KrishiLink</span>
        </Link>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Connect Farms<br />to Markets,<br />Seamlessly.
          </h1>
          <p className="text-green-100 text-base leading-relaxed max-w-sm">
            KrishiLink intelligently matches farmers with verified transporters,
            ensuring fresh produce reaches its destination safely and on time.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="flex gap-8 relative z-10">
          {[
            { value: '10K+', label: 'Farmers' },
            { value: '3K+',  label: 'Drivers' },
            { value: '50K+', label: 'Deliveries' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-display font-bold text-white">{value}</p>
              <p className="text-green-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-gray-50 dark:bg-gray-950">
        {/* Mobile logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Sprout size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
            Krishi<span className="text-primary-600">Link</span>
          </span>
        </Link>

        {/* Form card */}
        <motion.div
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
