import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Truck, TrendingUp, CheckCircle2, ArrowRight, Plus, AlertCircle,
  User, MapPin, Calendar, DollarSign, Calculator, RefreshCw, Users, Check, X, Info
} from 'lucide-react';
import { getFarmerDashboard, getFarmerProfile, getFarmerBookingHistory, getEstimatedCost } from '@/api/farmer.api';
import { listSharedGroups, joinSharedGroup } from '@/api/sharedMatching.api';
import { listSuggestions, acceptSuggestion, rejectSuggestion } from '@/api/returnTrip.api';
import { queryKeys, ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import { formatCurrency, formatDate } from '@/utils/formatters';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import BookingStatusBadge from '@/components/ui/BookingStatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

/* ── Greeting helper ─────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function FarmerDashboardPage() {
  usePageTitle('Farmer Dashboard');
  const queryClient = useQueryClient();

  /* ── State for local widgets ─────────────────────────────────── */
  const [estDist, setEstDist] = useState('');
  const [estVehicle, setEstVehicle] = useState('standard');
  const [estimating, setEstimating] = useState(false);
  const [estimatedVal, setEstimatedVal] = useState(null);
  const [selectedBookingForJoin, setSelectedBookingForJoin] = useState({}); // groupId -> bookingId

  /* ── Queries ─────────────────────────────────────────────────── */

  // 1. Farmer Profile Summary
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['farmer', 'profile'],
    queryFn: getFarmerProfile,
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  // 2. Stats & Alerts
  const {
    data: dashboardData,
    isLoading: dashLoading,
    isError: dashError,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['farmer', 'dashboard'],
    queryFn: getFarmerDashboard,
    staleTime: 60_000,
  });

  // 3. Bookings History (used for history widget + active booking matching)
  const {
    data: bookingsResponse,
    isLoading: bookingsLoading,
    isError: bookingsError,
    refetch: refetchBookings
  } = useQuery({
    queryKey: queryKeys.bookings.list({ page: 1, limit: 10 }),
    queryFn: () => getFarmerBookingHistory({ page: 1, limit: 10 }),
  });

  // 4. Shared Truck Suggestions
  const {
    data: sharedGroupsData,
    isLoading: sharedLoading,
    isError: sharedError,
    refetch: refetchShared
  } = useQuery({
    queryKey: ['sharedGroups', 'list'],
    queryFn: () => listSharedGroups({ status: 'open', limit: 5 }),
    staleTime: 30_000,
  });

  // 5. Return Trip Suggestions
  const {
    data: returnTripData,
    isLoading: returnLoading,
    isError: returnError,
    refetch: refetchReturn
  } = useQuery({
    queryKey: ['returnTrips', 'suggestions'],
    queryFn: () => listSuggestions({ status: 'suggested', limit: 5 }),
    staleTime: 30_000,
  });

  /* ── Mutations ─────────────────────────────────────────────────── */

  // Join shared group
  const joinGroupMutation = useMutation({
    mutationFn: ({ groupId, bookingId }) => joinSharedGroup(groupId, bookingId),
    onSuccess: () => {
      toast.success('Successfully requested to join shared truck! 🚛');
      queryClient.invalidateQueries({ queryKey: ['sharedGroups'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
      queryClient.invalidateQueries({ queryKey: ['farmer', 'dashboard'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Could not join shared group.');
    }
  });

  // Accept return trip suggestion
  const acceptReturnMutation = useMutation({
    mutationFn: (suggestionId) => acceptSuggestion(suggestionId),
    onSuccess: () => {
      toast.success('Return trip suggestion accepted! 🎉');
      queryClient.invalidateQueries({ queryKey: ['returnTrips'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
      queryClient.invalidateQueries({ queryKey: ['farmer', 'dashboard'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Could not accept return trip.');
    }
  });

  // Reject return trip suggestion
  const rejectReturnMutation = useMutation({
    mutationFn: (suggestionId) => rejectSuggestion(suggestionId, { reason: 'Farmer rejected from dashboard quick action' }),
    onSuccess: () => {
      toast.success('Suggestion rejected.');
      queryClient.invalidateQueries({ queryKey: ['returnTrips'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Could not reject suggestion.');
    }
  });

  /* ── Data Mapping ────────────────────────────────────────────── */
  const stats = dashboardData?.stats ?? {};
  const bookings = bookingsResponse?.bookings ?? [];
  
  // Find current active booking: the most recent booking in progress
  const activeStatuses = ['searching_truck', 'shared_matching', 'accepted', 'pickup_started', 'in_transit'];
  const currentBooking = bookings.find(b => activeStatuses.includes(b.status));

  // Find pending bookings that can join a shared group
  const joinableBookings = bookings.filter(b => b.status === 'pending' && !b.shared_group_id);

  // Shared matches & Return suggestions
  const sharedGroups = sharedGroupsData?.groups ?? sharedGroupsData?.data ?? [];
  const returnSuggestions = returnTripData?.suggestions ?? [];

  /* ── Cost estimation local calculation handler ───────────────── */
  const handleEstimateCost = async (e) => {
    e.preventDefault();
    if (!estDist || estDist <= 0) {
      toast.error('Please enter a valid distance.');
      return;
    }
    setEstimating(true);
    setEstimatedVal(null);
    try {
      const data = await getEstimatedCost({
        distance_km: Number(estDist),
        vehicle_type: estVehicle
      });
      setEstimatedVal(data.estimatedCost ?? (Number(estDist) * (estVehicle === 'truck' ? 5 : 3)));
      toast.success('Cost estimated successfully!');
    } catch (err) {
      toast.error(err.message || 'Could not estimate cost.');
    } finally {
      setEstimating(false);
    }
  };

  /* ── Shared Group Join trigger ─────────────────────────────────── */
  const triggerJoinGroup = (groupId) => {
    const bookingId = selectedBookingForJoin[groupId];
    if (!bookingId) {
      toast.error('Please select a booking to join this group.');
      return;
    }
    joinGroupMutation.mutate({ groupId, bookingId });
  };

  /* ── Refetch All helper ────────────────────────────────────────── */
  const refetchAll = () => {
    refetchProfile();
    refetchDashboard();
    refetchBookings();
    refetchShared();
    refetchReturn();
    toast.success('Dashboard data refreshed!');
  };

  /* ── Stat items setup ─────────────────────────────────────────── */
  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.total_bookings ?? 0,
      icon: <Package size={20} />,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Active Shipments',
      value: stats.active_shipments ?? 0,
      icon: <Truck size={20} />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Delivered',
      value: stats.delivered ?? 0,
      icon: <CheckCircle2 size={20} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Spent',
      value: stats.total_spent ? formatCurrency(stats.total_spent) : formatCurrency(0),
      icon: <TrendingUp size={20} />,
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  const anyError = profileError || dashError || bookingsError || sharedError || returnError;

  return (
    <PageContainer>
      {/* ── Top Bar / Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {greeting()}
          </span>
          <h1 className="text-3xl font-display font-black text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            {profile?.name?.split(' ')[0] ?? 'Farmer'} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back to KrishiLink. Manage your logistics, view stats, and access shared trucks here.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            leftIcon={<RefreshCw size={14} />}
            className="border-gray-200 dark:border-gray-700"
            title="Refresh dashboard data"
          >
            Refresh
          </Button>
          <Link to={ROUTES.FARMER_BOOKING_NEW}>
            <Button leftIcon={<Plus size={16} />} size="sm" className="gradient-primary">
              Book Transport
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Global Error banner ──────────────────────────────────────── */}
      {anyError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900 rounded-2xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
              Data Sync Interrupted
            </h3>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              Some widgets failed to load fresh details. You can continue, or click to refresh connection.
            </p>
          </div>
          <Button size="xs" variant="outline" onClick={refetchAll} className="border-red-200 text-red-800 hover:bg-red-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/40">
            Retry Connection
          </Button>
        </div>
      )}

      {/* ── Main Layout Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* WELCOME PROFILE WIDGET */}
          {profileLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm animate-pulse border border-gray-150 dark:border-gray-755">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ) : profileError ? (
            <Card className="border border-red-100 dark:border-red-950">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <AlertCircle size={16} />
                <span className="font-semibold text-sm">Failed to load profile</span>
              </div>
              <p className="text-xs text-gray-500">Please check your internet connection and refresh.</p>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="relative overflow-hidden border border-gray-100 dark:border-gray-700 bg-gradient-to-br from-white via-white to-primary-50/10 dark:from-gray-800 dark:via-gray-800 dark:to-primary-950/5 p-6">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-primary-500/5 blur-xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                      <User size={28} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {profile?.name || 'Farmer Account'}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Farmer Partner
                        </span>
                        <span>•</span>
                        <span>{profile?.email || '—'}</span>
                        <span>•</span>
                        <span>{profile?.phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={ROUTES.FARMER_PROFILE}>
                      <Button size="xs" variant="outline" className="border-gray-200 dark:border-gray-700">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* QUICK STATS WIDGET */}
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <StatCard
                  key={s.label}
                  {...s}
                  loading={dashLoading}
                  className="border border-gray-100 dark:border-gray-750 shadow-sm"
                />
              ))}
            </div>
            
            {/* Embedded Custom SVG Sparkline / Spent Trend Chart */}
            <div className="mt-4">
              <Card className="p-4 border border-gray-100 dark:border-gray-750 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-550 dark:text-gray-400">Monthly Spending Trend</h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                      {stats.total_spent ? formatCurrency(stats.total_spent) : formatCurrency(0)}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md font-medium">
                    +14.2% MoM
                  </span>
                </div>
                
                {/* SVG Curve Line */}
                <div className="h-16 w-full mt-2">
                  <svg className="h-full w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Background Area */}
                    <path
                      d="M0,20 Q15,12 30,16 T60,5 T90,8 T100,2 L100,20 Z"
                      fill="url(#chartGrad)"
                    />
                    {/* Trend Line */}
                    <path
                      d="M0,20 Q15,12 30,16 T60,5 T90,8 T100,2"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-gray-450 dark:text-gray-500 mt-1">
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul (Current)</span>
                </div>
              </Card>
            </div>
          </div>

          {/* CURRENT BOOKING WIDGET */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-450 dark:text-gray-500">
                Current Booking Status
              </h2>
              {currentBooking && (
                <Link
                  to={ROUTES.FARMER_BOOKING_DETAIL(currentBooking.id)}
                  className="text-xs text-primary-605 hover:underline flex items-center gap-0.5 font-medium"
                >
                  Full Tracking details <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {bookingsLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-150 dark:border-gray-750 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ) : bookingsError ? (
              <Card className="border border-red-500/20 text-center p-6">
                <AlertCircle className="mx-auto text-red-500 mb-2" size={24} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load active shipments.</p>
              </Card>
            ) : !currentBooking ? (
              <EmptyState
                icon={<Truck size={36} className="text-gray-300 dark:text-gray-600" />}
                title="No active shipments"
                description="Your produce is currently stationary. Create a transport request to get moving."
                action={
                  <Link to={ROUTES.FARMER_BOOKING_NEW}>
                    <Button size="sm" leftIcon={<Plus size={14} />} className="gradient-primary">
                      Book Transport Now
                    </Button>
                  </Link>
                }
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border border-primary-100 dark:border-primary-950 bg-gradient-to-r from-primary-50/5 via-white to-white dark:from-primary-950/5 dark:via-gray-800 dark:to-gray-800 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                          Active Shipment
                        </span>
                        <BookingStatusBadge status={currentBooking.status} />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {currentBooking.start_location}
                        <span className="text-gray-400 font-normal">→</span>
                        {currentBooking.end_location}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Scheduled: <span className="font-medium text-gray-700 dark:text-gray-200">{formatDate(currentBooking.scheduled_at)}</span>
                      </p>
                      {currentBooking.notes && (
                        <p className="text-xs italic text-gray-400 dark:text-gray-500">
                          &ldquo;{currentBooking.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 text-right shrink-0">
                      <span className="text-xs text-gray-450">Estimated Cost</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white">
                        {currentBooking.estimated_cost ? formatCurrency(currentBooking.estimated_cost) : 'Pending Quote'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ID: {currentBooking.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  {/* Stepper Progress Bar */}
                  <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex justify-between text-[10px] text-gray-405 font-semibold mb-2">
                      <span className={['searching_truck', 'shared_matching', 'accepted', 'pickup_started', 'in_transit', 'delivered'].includes(currentBooking.status) ? 'text-primary-600 dark:text-primary-400' : ''}>BOOKED</span>
                      <span className={['accepted', 'pickup_started', 'in_transit', 'delivered'].includes(currentBooking.status) ? 'text-primary-600 dark:text-primary-400' : ''}>ASSIGNED</span>
                      <span className={['pickup_started', 'in_transit', 'delivered'].includes(currentBooking.status) ? 'text-primary-600 dark:text-primary-400' : ''}>PICKUP</span>
                      <span className={['in_transit', 'delivered'].includes(currentBooking.status) ? 'text-primary-600 dark:text-primary-400' : ''}>IN TRANSIT</span>
                      <span className={currentBooking.status === 'delivered' ? 'text-primary-600 dark:text-primary-400' : ''}>DELIVERED</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{
                          width: currentBooking.status === 'searching_truck' || currentBooking.status === 'shared_matching' ? '20%'
                            : currentBooking.status === 'accepted' ? '40%'
                            : currentBooking.status === 'pickup_started' ? '60%'
                            : currentBooking.status === 'in_transit' ? '80%'
                            : currentBooking.status === 'delivered' ? '100%'
                            : '10%'
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* RECENT BOOKINGS WIDGET */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-450 dark:text-gray-500">
                Recent Bookings History
              </h2>
              <Link
                to={ROUTES.FARMER_BOOKINGS}
                className="text-xs text-primary-600 hover:underline flex items-center gap-0.5"
              >
                All Booking History <ArrowRight size={12} />
              </Link>
            </div>

            <Card padding={false} className="border border-gray-100 dark:border-gray-750 overflow-hidden">
              {bookingsLoading ? (
                <div className="p-6 space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <EmptyState
                  icon={<Package size={28} className="text-gray-300 dark:text-gray-600" />}
                  title="No bookings recorded"
                  description="Your booking history will be kept safe here once you place a request."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left px-4 py-3 font-semibold text-gray-500">ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500">Route</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500">Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500">Status</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {bookings.slice(0, 5).map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-[10px] text-primary-600">
                            <Link to={ROUTES.FARMER_BOOKING_DETAIL(b.id)} className="hover:underline">
                              {b.id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {b.start_location} <span className="text-gray-400 mx-1">→</span> {b.end_location}
                          </td>
                          <td className="px-4 py-3 text-gray-550">
                            {formatDate(b.scheduled_at || b.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <BookingStatusBadge status={b.status} />
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                            {b.final_cost || b.estimated_cost
                              ? formatCurrency(b.final_cost ?? b.estimated_cost)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

        </div>

        {/* Right Side Column (Estimation, Match Suggestions) */}
        <div className="space-y-6">

          {/* QUICK ESTIMATE COST WIDGET */}
          <Card className="border border-gray-100 dark:border-gray-750">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Calculator size={16} className="text-primary-500" />
              Quick Transport Estimator
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Get an instant cost estimation based on distance and vehicle configurations.
            </p>

            <form onSubmit={handleEstimateCost} className="space-y-3.5">
              <Input
                label="Estimated Distance (km)"
                type="number"
                placeholder="e.g. 150"
                value={estDist}
                onChange={(e) => setEstDist(e.target.value)}
                required
                min="1"
                className="text-xs"
              />

              <Select
                label="Required Truck Type"
                value={estVehicle}
                onChange={(e) => setEstVehicle(e.target.value)}
                options={[
                  { value: 'standard', label: 'Standard Pickup (up to 1.5 Tons)' },
                  { value: 'truck', label: 'Heavy Open Truck (up to 5 Tons)' },
                  { value: 'reefer', label: 'Refrigerated Cold Truck' },
                ]}
                className="text-xs"
              />

              <Button
                type="submit"
                size="sm"
                loading={estimating}
                className="w-full gradient-primary text-xs"
              >
                {estimating ? 'Calculating...' : 'Estimate Cost'}
              </Button>
            </form>

            <AnimatePresence>
              {estimatedVal !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Estimated Price:</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(estimatedVal)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    *Estimated rates subject to fuel pricing and real route alignments.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* SHARED TRUCK MATCHES WIDGET */}
          <Card className="border border-gray-100 dark:border-gray-750">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Users size={16} className="text-blue-500" />
              Shared Truck Suggestions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Join active trucks going along your route to split costs (up to 40% discount).
            </p>

            {sharedLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                ))}
              </div>
            ) : sharedError ? (
              <p className="text-xs text-gray-450 dark:text-gray-500">Failed to load shared trucks.</p>
            ) : sharedGroups.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-100 dark:border-gray-750 rounded-2xl">
                <Users className="mx-auto text-gray-300 dark:text-gray-600 mb-1" size={24} />
                <p className="text-xs text-gray-400 dark:text-gray-500">No active shared routes matching today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedGroups.map((g) => {
                  const usedPct = Math.round((Number(g.used_capacity_kg) / Number(g.total_capacity_kg)) * 100);
                  const isFull = usedPct >= 100;
                  return (
                    <div
                      key={g.id}
                      className="p-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {g.start_location} → {g.end_location}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Date: {formatDate(g.scheduled_date)}
                          </p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isFull ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'}`}>
                          {isFull ? 'Full' : `${100 - usedPct}% Left`}
                        </span>
                      </div>

                      {/* Progress Line */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-gray-400">
                          <span>Capacity Loaded: {usedPct}%</span>
                          <span>{g.used_capacity_kg}kg / {g.total_capacity_kg}kg</span>
                        </div>
                        <div className="h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(usedPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Joining form */}
                      {!isFull && joinableBookings.length > 0 && (
                        <div className="flex gap-1.5 pt-1">
                          <div className="flex-1">
                            <Select
                              value={selectedBookingForJoin[g.id] || ''}
                              onChange={(e) => setSelectedBookingForJoin(prev => ({
                                ...prev,
                                [g.id]: e.target.value
                              }))}
                              options={[
                                { value: '', label: 'Select pending booking...' },
                                ...joinableBookings.map(b => ({
                                  value: b.id,
                                  label: `${b.start_location.slice(0, 8)} (${b.cargo_weight_kg ?? '?'}kg)`
                                }))
                              ]}
                              className="text-[10px] h-8 py-0 border-gray-200 dark:border-gray-700"
                            />
                          </div>
                          <Button
                            size="xs"
                            onClick={() => triggerJoinGroup(g.id)}
                            loading={joinGroupMutation.isPending && joinGroupMutation.variables?.groupId === g.id}
                            className="text-[10px] h-8 shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Join
                          </Button>
                        </div>
                      )}

                      {!isFull && joinableBookings.length === 0 && (
                        <p className="text-[10px] text-gray-400 italic">
                          No pending bookings to match into this group.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* RETURN TRIP SUGGESTIONS WIDGET */}
          <Card className="border border-gray-100 dark:border-gray-750">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Truck size={16} className="text-emerald-500" />
              Return Trip Savings
            </h3>
            <p className="text-xs text-gray-550 dark:text-gray-400 mb-4">
              Book drivers returning empty on your route for heavily discounted shipping rates.
            </p>

            {returnLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                ))}
              </div>
            ) : returnError ? (
              <p className="text-xs text-gray-450 dark:text-gray-500">Failed to load return trips.</p>
            ) : returnSuggestions.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-100 dark:border-gray-750 rounded-2xl">
                <Truck className="mx-auto text-gray-300 dark:text-gray-600 mb-1" size={24} />
                <p className="text-xs text-gray-400 dark:text-gray-500">No return route offers active right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {returnSuggestions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-950/20 rounded-xl space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {s.booking?.start_location} → {s.booking?.end_location}
                        </p>
                        <p className="text-[10px] text-gray-450 mt-0.5 flex items-center gap-1">
                          <MapPin size={10} className="text-emerald-500" />
                          Driver Pickup: {s.pickup_distance_km}km away
                        </p>
                      </div>
                      <span className="text-[10px] bg-emerald-100/60 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                        Score: {Math.round(s.match_score)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 border-t border-emerald-100/20 pt-2">
                      <div>
                        Rate: <span className="font-bold text-gray-900 dark:text-white">{s.booking?.estimated_cost ? formatCurrency(s.booking?.estimated_cost) : '—'}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => rejectReturnMutation.mutate(s.id)}
                          loading={rejectReturnMutation.isPending && rejectReturnMutation.variables === s.id}
                          className="h-6 w-6 p-0 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900"
                        >
                          <X size={10} />
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => acceptReturnMutation.mutate(s.id)}
                          loading={acceptReturnMutation.isPending && acceptReturnMutation.variables === s.id}
                          className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-0.5"
                        >
                          <Check size={10} /> Book
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

      </div>
    </PageContainer>
  );
}
