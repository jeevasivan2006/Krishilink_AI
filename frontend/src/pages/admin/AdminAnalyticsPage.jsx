import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Package, Users, IndianRupee } from 'lucide-react';
import { getAnalytics, getBookingsAnalytics, getRevenue } from '@/api/admin.api';
import { usePageTitle } from '@/hooks';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/utils';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { SectionSpinner } from '@/components/ui/Spinner';

const PERIOD_OPTIONS = [
  { value: '7d',  label: 'Last 7 days'   },
  { value: '30d', label: 'Last 30 days'  },
  { value: '90d', label: 'Last 90 days'  },
  { value: '1y',  label: 'Last 12 months'},
];

/* Simple pure-CSS bar chart — no charting library dependency */
function BarChart({ data = [], valueKey = 'value', labelKey = 'label', color = 'bg-primary-500', height = 160 }) {
  if (!data.length) return <p className="text-sm text-gray-400 text-center py-8">No data available.</p>;
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1.5 w-full" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.round((Number(d[valueKey]) / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {d[valueKey]}
            </div>
            <div
              className={cn('w-full rounded-t-lg transition-all duration-500', color)}
              style={{ height: `${pct}%`, minHeight: pct > 0 ? 4 : 0 }}
            />
            <span className="text-[9px] text-gray-400 truncate max-w-full px-0.5">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  usePageTitle('Analytics — Admin');
  const [period, setPeriod] = useState('30d');

  const { data: analytics, isLoading: aLoading } = useQuery({
    queryKey: ['admin', 'analytics', period],
    queryFn:  () => getAnalytics({ period }),
    staleTime: 5 * 60_000,
  });

  const { data: bookingsChart, isLoading: bLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'bookings', period],
    queryFn:  () => getBookingsAnalytics({ period, group_by: period === '1y' ? 'month' : 'week' }),
    staleTime: 5 * 60_000,
  });

  const { data: revenueData, isLoading: rLoading } = useQuery({
    queryKey: ['admin', 'revenue', period],
    queryFn:  () => getRevenue({ period }),
    staleTime: 5 * 60_000,
  });

  const stats      = analytics?.stats      ?? {};
  const bChartData = bookingsChart?.data    ?? bookingsChart?.chart ?? [];
  const rChartData = revenueData?.data      ?? revenueData?.chart   ?? [];

  const statCards = [
    { label: 'Total Bookings',  value: stats.total_bookings  ? formatNumber(stats.total_bookings)    : '—', icon: <Package size={20} />,     iconBg: 'bg-blue-50 dark:bg-blue-900/20',     iconColor: 'text-blue-600 dark:text-blue-400'      },
    { label: 'Total Revenue',   value: stats.total_revenue   ? formatCurrency(stats.total_revenue)   : '—', icon: <IndianRupee size={20} />,  iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Active Users',    value: stats.active_users    ? formatNumber(stats.active_users)      : '—', icon: <Users size={20} />,        iconBg: 'bg-purple-50 dark:bg-purple-900/20',   iconColor: 'text-purple-600 dark:text-purple-400'   },
    { label: 'Avg. Trip Value', value: stats.avg_trip_value  ? formatCurrency(stats.avg_trip_value)  : '—', icon: <TrendingUp size={20} />,   iconBg: 'bg-amber-50 dark:bg-amber-900/20',     iconColor: 'text-amber-600 dark:text-amber-400'     },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform performance metrics.</p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setPeriod(value)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                period === value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200')}>
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      {aLoading ? <SectionSpinner message="Loading analytics…" /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <StatCard {...s} />
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Bookings chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <Card.Header>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Package size={14} className="text-primary-500" /> Bookings Over Time
                  </h2>
                </Card.Header>
                <Card.Body>
                  {bLoading ? <SectionSpinner /> : (
                    <BarChart data={bChartData} valueKey="count" labelKey="period" color="bg-primary-500" height={180} />
                  )}
                </Card.Body>
              </Card>
            </motion.div>

            {/* Revenue chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card>
                <Card.Header>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <IndianRupee size={14} className="text-emerald-500" /> Revenue Over Time
                  </h2>
                </Card.Header>
                <Card.Body>
                  {rLoading ? <SectionSpinner /> : (
                    <BarChart data={rChartData} valueKey="amount" labelKey="period" color="bg-emerald-500" height={180} />
                  )}
                </Card.Body>
              </Card>
            </motion.div>

            {/* Booking status breakdown */}
            {analytics?.status_breakdown && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                <Card>
                  <Card.Header>
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <BarChart3 size={14} className="text-purple-500" /> Booking Status Breakdown
                    </h2>
                  </Card.Header>
                  <Card.Body>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {Object.entries(analytics.status_breakdown).map(([status, count]) => (
                        <div key={status} className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                          <p className="text-xl font-display font-bold text-gray-900 dark:text-white">{count}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{status.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
