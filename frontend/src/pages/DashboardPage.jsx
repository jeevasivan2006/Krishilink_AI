import { motion } from 'framer-motion';
import {
  Package, Truck, TrendingUp, Clock,
  ArrowRight, MapPin, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, USER_ROLES } from '@/constants';
import { usePageTitle } from '@/hooks';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageContainer from '@/layouts/PageContainer';

/* ── Mock data (replace with TanStack Query calls in feature modules) ── */
const FARMER_STATS = [
  { label: 'Total Bookings',    value: '24',      icon: <Package size={20} />, color: 'text-blue-600',    bg: 'bg-blue-50'    },
  { label: 'Active Shipments',  value: '3',       icon: <Truck size={20} />,   color: 'text-primary-600', bg: 'bg-primary-50' },
  { label: 'Delivered',         value: '19',      icon: <CheckCircle2 size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Total Spent',       value: '₹48,200', icon: <TrendingUp size={20} />, color: 'text-purple-600', bg: 'bg-purple-50'  },
];

const DRIVER_STATS = [
  { label: 'Total Trips',       value: '156',     icon: <Truck size={20} />,      color: 'text-blue-600',    bg: 'bg-blue-50'    },
  { label: 'Active Trip',       value: '1',       icon: <MapPin size={20} />,     color: 'text-primary-600', bg: 'bg-primary-50' },
  { label: 'Completed',         value: '154',     icon: <CheckCircle2 size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Total Earned',      value: '₹1.2L',   icon: <TrendingUp size={20} />, color: 'text-purple-600',  bg: 'bg-purple-50'  },
];

const RECENT_BOOKINGS = [
  { id: 'BK001', produce: 'Tomatoes',  from: 'Nashik',  to: 'Mumbai',     date: '2026-07-07', status: 'in_transit', amount: 3200 },
  { id: 'BK002', produce: 'Onions',    from: 'Pune',    to: 'Delhi',      date: '2026-07-06', status: 'delivered',  amount: 8500 },
  { id: 'BK003', produce: 'Potatoes',  from: 'Agra',    to: 'Lucknow',    date: '2026-07-05', status: 'confirmed',  amount: 2800 },
  { id: 'BK004', produce: 'Cabbage',   from: 'Shimla',  to: 'Chandigarh', date: '2026-07-04', status: 'delivered',  amount: 1900 },
];

const STATUS_BADGE = {
  pending:    { variant: 'yellow', label: 'Pending'    },
  confirmed:  { variant: 'blue',   label: 'Confirmed'  },
  in_transit: { variant: 'green',  label: 'In Transit' },
  delivered:  { variant: 'green',  label: 'Delivered'  },
  cancelled:  { variant: 'red',    label: 'Cancelled'  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isDriver = user?.role === USER_ROLES.DRIVER;

  usePageTitle(`${isDriver ? 'Driver' : 'Farmer'} Dashboard`);

  const stats = isDriver ? DRIVER_STATS : FARMER_STATS;
  const greeting = getGreeting();

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{greeting}</p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
          {user?.name?.split(' ')[0] ?? 'Welcome'} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {isDriver
            ? "Here's your driver activity summary."
            : "Here's what's happening with your produce today."}
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="p-5">
              <div className={`inline-flex h-10 w-10 rounded-xl ${bg} items-center justify-center mb-3 ${color}`}>
                {icon}
              </div>
              <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      {!isDriver && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <Card className="gradient-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-lg mb-1">Need transport today?</h2>
              <p className="text-sm text-gray-500">Book a verified transporter in under 3 minutes.</p>
            </div>
            <Link to={ROUTES.FARMER_BOOKING_NEW}>
              <Button size="md" rightIcon={<ArrowRight size={16} />}>
                New Booking
              </Button>
            </Link>
          </Card>
        </motion.div>
      )}

      {/* Recent bookings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent {isDriver ? 'Trips' : 'Bookings'}
          </h2>
          <Link
            to={isDriver ? ROUTES.DRIVER_TRIPS : ROUTES.FARMER_BOOKINGS}
            className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produce</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Route</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {RECENT_BOOKINGS.map(({ id, produce, from, to, date, status, amount }) => {
                  const badge = STATUS_BADGE[status];
                  return (
                    <tr key={id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">{id}</td>
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{produce}</td>
                      <td className="px-5 py-4 text-gray-500 hidden md:table-cell">
                        {from} → {to}
                      </td>
                      <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{formatDate(date)}</td>
                      <td className="px-5 py-4">
                        <Badge variant={badge.variant} dot>{badge.label}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Pending alert */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-secondary-50 border border-secondary-200 dark:bg-secondary-900/10 dark:border-secondary-800"
      >
        <AlertCircle size={18} className="text-secondary-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-secondary-800 dark:text-secondary-300">
            2 bookings awaiting confirmation
          </p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">
            Drivers have responded to your requests.{' '}
            <Link to={ROUTES.FARMER_BOOKINGS} className="underline font-medium">Review now →</Link>
          </p>
        </div>
      </motion.div>
    </PageContainer>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
