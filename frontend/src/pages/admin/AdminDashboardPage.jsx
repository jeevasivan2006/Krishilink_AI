import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Truck, Package, TrendingUp, AlertCircle, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminDashboard, getActiveTrips, getAttentionRequired } from '@/api/admin.api';
import { ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import BookingStatusBadge from '@/components/ui/BookingStatusBadge';
import { SectionSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminDashboardPage() {
  usePageTitle('Admin Dashboard');

  const { data: dash, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn:  getAdminDashboard,
    staleTime: 60_000,
  });
  const { data: activeData } = useQuery({
    queryKey: ['admin', 'active-trips'],
    queryFn:  getActiveTrips,
    refetchInterval: 30_000,
  });
  const { data: attentionData } = useQuery({
    queryKey: ['admin', 'attention'],
    queryFn:  getAttentionRequired,
    refetchInterval: 60_000,
  });

  const stats = dash?.stats ?? {};
  const recentBookings = dash?.recent_bookings ?? [];
  const activeTrips = activeData?.trips ?? activeData?.data ?? [];
  const attention = attentionData?.bookings ?? attentionData?.data ?? [];

  const statCards = [
    { label: 'Total Users',     value: stats.total_users    ?? '—', icon: <Users size={20} />,     iconBg: 'bg-blue-50 dark:bg-blue-900/20',     iconColor: 'text-blue-600 dark:text-blue-400'     },
    { label: 'Active Drivers',  value: stats.active_drivers ?? '—', icon: <Truck size={20} />,     iconBg: 'bg-primary-50 dark:bg-primary-900/20', iconColor: 'text-primary-600 dark:text-primary-400' },
    { label: 'Total Bookings',  value: stats.total_bookings ?? '—', icon: <Package size={20} />,   iconBg: 'bg-amber-50 dark:bg-amber-900/20',     iconColor: 'text-amber-600 dark:text-amber-400'     },
    { label: 'Total Revenue',   value: stats.total_revenue ? formatCurrency(stats.total_revenue) : '—', icon: <TrendingUp size={20} />, iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform overview and live monitoring.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard {...s} loading={isLoading} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attention required */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500" /> Needs Attention
              {attention.length > 0 && <span className="h-5 min-w-[1.25rem] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1.5">{attention.length}</span>}
            </h2>
            <Link to={ROUTES.ADMIN_BOOKINGS} className="text-xs text-primary-600 hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <Card padding={false}>
            {attention.length === 0
              ? <EmptyState icon={<AlertCircle size={22} />} title="No issues" description="All bookings are running smoothly." />
              : <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {attention.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{b.start_location} → {b.end_location}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(b.scheduled_at)}</p>
                      </div>
                      <BookingStatusBadge status={b.status} />
                    </div>
                  ))}
                </div>}
          </Card>
        </motion.div>

        {/* Active trips */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity size={15} className="text-primary-500 animate-pulse" /> Live Trips
              {activeTrips.length > 0 && <span className="h-5 min-w-[1.25rem] flex items-center justify-center rounded-full bg-primary-500 text-white text-xs font-bold px-1.5">{activeTrips.length}</span>}
            </h2>
          </div>
          <Card padding={false}>
            {activeTrips.length === 0
              ? <EmptyState icon={<Truck size={22} />} title="No active trips" description="In-transit deliveries will appear here." />
              : <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {activeTrips.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{b.start_location} → {b.end_location}</p>
                        <p className="text-xs text-gray-400">{b.cargo_weight_kg ? `${b.cargo_weight_kg} kg` : ''}</p>
                      </div>
                      <BookingStatusBadge status="in_transit" />
                    </div>
                  ))}
                </div>}
          </Card>
        </motion.div>
      </div>
    </PageContainer>
  );
}
