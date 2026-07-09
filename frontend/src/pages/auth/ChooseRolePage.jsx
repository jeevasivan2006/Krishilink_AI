import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, Truck, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import { cn } from '@/utils';

const ROLES = [
  {
    key:         'farmer',
    icon:        Sprout,
    emoji:       '🌾',
    title:       'Farmer',
    subtitle:    'I grow produce and need transport',
    color:       'primary',
    loginTo:     ROUTES.FARMER_LOGIN,
    registerTo:  ROUTES.FARMER_REGISTER,
    features: [
      'Book verified transporters instantly',
      'Live GPS tracking for every shipment',
      'AI-powered cost estimates',
      'Return-trip discounts',
    ],
    gradient: 'from-primary-600 to-primary-700',
    bg:       'bg-primary-50 dark:bg-primary-900/20',
    border:   'border-primary-200 dark:border-primary-800',
    iconBg:   'bg-primary-100 dark:bg-primary-900/40',
    iconText: 'text-primary-600 dark:text-primary-400',
    badgeBg:  'bg-primary-600',
  },
  {
    key:         'driver',
    icon:        Truck,
    emoji:       '🚛',
    title:       'Lorry Owner / Driver',
    subtitle:    'I own vehicles and offer transport',
    color:       'earth',
    loginTo:     ROUTES.DRIVER_LOGIN,
    registerTo:  ROUTES.DRIVER_REGISTER,
    features: [
      'Receive booking requests nearby',
      'Return-trip marketplace earnings',
      'Shared-load optimisation',
      'Real-time route navigation',
    ],
    gradient: 'from-earth-600 to-earth-700',
    bg:       'bg-earth-50 dark:bg-earth-900/20',
    border:   'border-earth-200 dark:border-earth-800',
    iconBg:   'bg-earth-100 dark:bg-earth-900/40',
    iconText: 'text-earth-600 dark:text-earth-400',
    badgeBg:  'bg-earth-600',
  },
];

/* Animation variants */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function ChooseRolePage() {
  usePageTitle('Get Started');
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-primary-50/30
                    dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/20
                    flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center
                          group-hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/25">
            <Sprout size={19} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
            Krishi<span className="text-primary-600">Link</span>
          </span>
        </Link>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <button
            onClick={() => navigate(ROUTES.FARMER_LOGIN)}
            className="text-primary-600 font-medium hover:underline"
          >
            Sign in
          </button>
        </span>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center px-4 pt-6 pb-10"
      >
        <span className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30
                         text-primary-700 dark:text-primary-400 text-xs font-semibold
                         px-3.5 py-1.5 rounded-full border border-primary-100
                         dark:border-primary-800 mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
          Join 13,000+ users on KrishiLink
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 dark:text-white
                       leading-tight mb-3 text-balance">
          How would you like to join?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-base leading-relaxed">
          Choose your role to get started. You can always create additional accounts later.
        </p>
      </motion.div>

      {/* ── Role cards ───────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 px-4 pb-12 max-w-4xl mx-auto w-full"
      >
        <div className="grid sm:grid-cols-2 gap-5 items-start">
          {ROLES.map((role) => (
            <RoleCard key={role.key} role={role} navigate={navigate} />
          ))}
        </div>

        {/* Admin sign-in link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => navigate(ROUTES.ADMIN_LOGIN_PAGE)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400
                       hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ShieldCheck size={14} />
            Admin portal sign-in
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Role card component ──────────────────────────────────────── */
function RoleCard({ role, navigate }) {
  const Icon = role.icon;

  return (
    <motion.div
      variants={cardVariant}
      className={cn(
        'relative rounded-3xl border-2 p-6 flex flex-col gap-5',
        'bg-white dark:bg-gray-800 shadow-card',
        'transition-all duration-200 group',
        role.border,
      )}
    >
      {/* Icon + title */}
      <div className="flex items-start gap-4">
        <div className={cn(
          'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0',
          'shadow-sm transition-transform duration-200 group-hover:scale-105',
          role.iconBg,
        )}>
          <Icon size={26} className={role.iconText} strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white leading-snug">
            {role.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            {role.subtitle}
          </p>
        </div>
      </div>

      {/* Feature list */}
      <ul className="flex flex-col gap-2">
        {role.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <CheckCircle2 size={15} className={cn('shrink-0 mt-0.5', role.iconText)} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA buttons */}
      <div className="flex flex-col gap-2.5 mt-1">
        <button
          onClick={() => navigate(role.registerTo)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
            'font-semibold text-sm text-white transition-all duration-150',
            'hover:brightness-110 active:scale-[0.98] shadow-sm',
            `bg-gradient-to-r ${role.gradient}`,
          )}
        >
          Create {role.title.split(' ')[0]} account
          <ArrowRight size={15} />
        </button>

        <button
          onClick={() => navigate(role.loginTo)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
            'font-medium text-sm border-2 transition-all duration-150',
            'hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-[0.98]',
            role.border,
            role.iconText,
          )}
        >
          Sign in as {role.title.split(' ')[0]}
        </button>
      </div>
    </motion.div>
  );
}
