/**
 * LoginPage.jsx
 * Shared login form rendered for three roles:
 *   /login/farmer  → farmerConfig
 *   /login/driver  → driverConfig
 *   /login/admin   → adminConfig
 *
 * The `role` prop is injected by the route (see AppRouter).
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Sprout, Truck, ShieldCheck,
  ArrowLeft, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { farmerLoginSchema, driverLoginSchema, adminLoginSchema } from '@/utils/validators';
import { ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import { cn } from '@/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

/* ── Role config ─────────────────────────────────────────────── */
const ROLE_CONFIG = {
  farmer: {
    schema:       farmerLoginSchema,
    icon:         Sprout,
    emoji:        '🌾',
    title:        'Farmer Sign In',
    subtitle:     'Access your KrishiLink farmer account',
    accentClass:  'text-primary-600',
    iconBg:       'bg-primary-600',
    ring:         'focus-visible:ring-primary-500',
    registerTo:   ROUTES.FARMER_REGISTER,
    backTo:       ROUTES.CHOOSE_ROLE,
    welcomeMsg:   'Welcome back, Farmer! 🌾',
    role:         'farmer',
  },
  driver: {
    schema:       driverLoginSchema,
    icon:         Truck,
    emoji:        '🚛',
    title:        'Driver Sign In',
    subtitle:     'Access your KrishiLink driver account',
    accentClass:  'text-earth-600 dark:text-earth-400',
    iconBg:       'bg-earth-600',
    ring:         'focus-visible:ring-earth-500',
    registerTo:   ROUTES.DRIVER_REGISTER,
    backTo:       ROUTES.CHOOSE_ROLE,
    welcomeMsg:   'Welcome back, Driver! 🚛',
    role:         'driver',
  },
  admin: {
    schema:       adminLoginSchema,
    icon:         ShieldCheck,
    emoji:        '⚙️',
    title:        'Admin Sign In',
    subtitle:     'KrishiLink administration portal',
    accentClass:  'text-gray-700 dark:text-gray-300',
    iconBg:       'bg-gray-800',
    ring:         'focus-visible:ring-gray-500',
    registerTo:   null,
    backTo:       ROUTES.CHOOSE_ROLE,
    welcomeMsg:   'Welcome back, Admin!',
    role:         'admin',
  },
};

export default function LoginPage({ role = 'farmer' }) {
  usePageTitle(ROLE_CONFIG[role]?.title ?? 'Sign In');
  const config  = ROLE_CONFIG[role] ?? ROLE_CONFIG.farmer;
  const Icon    = config.icon;
  const { login } = useAuth();
  const location  = useLocation();

  const [serverError, setServerError] = useState('');
  const [remember,    setRemember]    = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(config.schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    try {
      await login({ email, password, remember });
      toast.success(config.welcomeMsg);
    } catch (err) {
      const msg = err.message || 'Sign in failed. Please try again.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center gap-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'h-14 w-14 rounded-2xl flex items-center justify-center',
            'shadow-lg shadow-black/10',
            config.iconBg,
          )}
        >
          <Icon size={26} className="text-white" strokeWidth={1.75} />
        </motion.div>

        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            {config.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* ── Server error banner ──────────────────────────────────── */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{   opacity: 0, y: -8 }}
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                       bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-400">{serverError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          leftIcon={<Lock size={16} />}
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600
                         focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
          </label>
          <Link
            to={ROUTES.HOME}
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          fullWidth
          size="lg"
          className={cn(
            'mt-1',
            role === 'driver' && 'bg-earth-600 hover:bg-earth-700 focus-visible:ring-earth-500',
            role === 'admin'  && 'bg-gray-800 hover:bg-gray-900 focus-visible:ring-gray-500',
          )}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {/* ── Footer links ─────────────────────────────────────────── */}
      {config.registerTo && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            to={config.registerTo}
            className="text-primary-600 font-medium hover:underline"
          >
            Register free
          </Link>
        </p>
      )}

      <div className="flex items-center justify-center">
        <Link
          to={config.backTo}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400
                     hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to role selection
        </Link>
      </div>

    </div>
  );
}
