import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, DollarSign, Calendar, MapPin, CheckCircle2, TrendingUp,
  ArrowRight, Check, X, Clock, AlertCircle, RefreshCw, Star, Info, Shield, ShieldCheck, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getDriverDashboard, acceptBooking, rejectBooking, updateAvailability } from '@/api/driver.api';
import { queryKeys, ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import { useAuth } from '@/context/AuthContext';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import BookingStatusBadge from '@/components/ui/BookingStatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DriverDashboardPage() {
  usePageTitle('Driver Dashboard');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  /* ── TanStack Query ─────────────────────────────────────────── */

  // 1. Fetch complete Driver Dashboard
  const {
    data: dash,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['driver', 'dashboard'],
    queryFn: getDriverDashboard,
    staleTime: 30_000,
  });

  // 2. Accept Booking Mutation
  const acceptMutation = useMutation({
    mutationFn: (id) => acceptBooking(id),
    onSuccess: () => {
      toast.success('Booking accepted! Drive safely 🚛');
      queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
    },
    onError: (err) => {
      toast.error(err.message || 'Could not accept booking.');
    },
  });

  // 3. Reject Booking Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectBooking(id, { reason }),
    onSuccess: () => {
      toast.success('Booking request rejected.');
      setRejectTarget(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Could not reject booking.');
    },
  });

  // 4. Update Availability Mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: (status) => updateAvailability(status),
    onSuccess: (data) => {
      toast.success(`You are now ${data.availability === 'available' ? 'Online' : 'Offline'}`);
      queryClient.invalidateQueries({ queryKey: ['driver', 'dashboard'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Could not update availability.');
    },
  });

  /* ── Data Mapping ────────────────────────────────────────────── */
  const profile = dash?.profile ?? {};
  const vehicle = dash?.vehicle ?? {};
  const earnings = dash?.earnings ?? {};
  const todaysTrips = dash?.todaysTrips ?? [];
  const activeTrips = dash?.activeTrips ?? [];
  const availableRequests = dash?.availableRequests ?? [];
  const sharedRequests = dash?.sharedRequests ?? [];
  const returnTrips = dash?.returnTrips ?? [];

  // Toggle availability action
  const handleToggleAvailability = () => {
    const nextStatus = vehicle.availability === 'available' ? 'offline' : 'available';
    toggleAvailabilityMutation.mutate(nextStatus);
  };

  /* ── Stat items setup ─────────────────────────────────────────── */
  const statCards = [
    {
      label: 'Completed Trips',
      value: earnings.completedTrips ?? 0,
      icon: <CheckCircle2 size={20} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Active Trips',
      value: activeTrips.length ?? 0,
      icon: <Truck size={20} />,
      iconBg: 'bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50',
      iconColor: 'text-primary-600 dark:text-primary-400',
    },
    {
      label: 'Today\'s Trips',
      value: todaysTrips.length ?? 0,
      icon: <Calendar size={20} />,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total Earnings',
      value: earnings.total ? formatCurrency(earnings.total) : formatCurrency(0),
      icon: <TrendingUp size={20} />,
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  /* ── Loading Skeleton UI ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ── Error boundary handler ──────────────────────────────────── */
  if (isError) {
    return (
      <PageContainer>
        <div className="text-center py-16 max-w-md mx-auto">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Could not sync driver logs</h2>
          <p className="text-sm text-gray-500 mt-2">
            There was a problem syncing with the logistics network. Verify your connection and click retry.
          </p>
          <Button onClick={() => refetch()} className="gradient-primary mt-6" leftIcon={<RefreshCw size={16} />}>
            Retry Sync
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* ── Top Bar / Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {greeting()}
          </span>
          <h1 className="text-3xl font-display font-black text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            {profile.name?.split(' ')[0] ?? 'Driver'} 🚛
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
            <span>License: <span className="font-semibold">{profile.licenseNumber || '—'}</span></span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="font-semibold">{profile.rating ? profile.rating.toFixed(1) : '5.0'}</span> rating
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw size={14} />}
            className="border-gray-200 dark:border-gray-700"
          >
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <StatCard
            key={s.label}
            {...s}
            className="border border-gray-100 dark:border-gray-750 shadow-sm"
          />
        ))}
      </div>

      {/* ── Main Layout Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Columns (Trips, Bookings marketplace) */}
        <div className="lg:col-span-2 space-y-6">

          {/* ACTIVE TRIPS WIDGET */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Active Trips
            </h2>
            {activeTrips.length === 0 ? (
              <EmptyState
                icon={<Truck size={36} className="text-gray-300 dark:text-gray-600" />}
                title="No active trips in transit"
                description="Accept cargo booking requests below or toggle your availability to get matching route suggestions."
              />
            ) : (
              <div className="space-y-4">
                {activeTrips.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border border-primary-100 dark:border-primary-950 p-5 bg-gradient-to-r from-primary-50/5 via-white to-white dark:from-primary-950/5 dark:via-gray-800 dark:to-gray-800">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                              Active Shipment
                            </span>
                            <BookingStatusBadge status={b.status} />
                          </div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            {b.startLocation} <span className="text-gray-400 font-normal">→</span> {b.endLocation}
                          </h3>
                          <p className="text-xs text-gray-550 dark:text-gray-400 font-medium">
                            Farmer: <span className="text-gray-950 dark:text-white font-bold">{b.farmerName}</span> ({b.farmerPhone || '—'})
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Scheduled: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatDate(b.scheduledAt)}</span>
                          </p>
                          {b.notes && (
                            <p className="text-xs italic text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg mt-2">
                              &ldquo;{b.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 text-right shrink-0">
                          <span className="text-xs text-gray-400">Payout</span>
                          <span className="text-base font-black text-gray-900 dark:text-white">
                            {b.finalCost || b.estimatedCost ? formatCurrency(b.finalCost ?? b.estimatedCost) : '—'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ID: {b.id.slice(0, 8)}
                          </span>
                          <Link to={ROUTES.DRIVER_TRIPS} className="mt-3">
                            <Button size="xs" variant="outline" rightIcon={<ArrowRight size={10} />}>
                              Manage Trip
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* TODAY'S TRIPS WIDGET */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Today&apos;s Trips Schedule
            </h2>
            <Card padding={false} className="border border-gray-150 dark:border-gray-750 overflow-hidden">
              {todaysTrips.length === 0 ? (
                <div className="p-6 text-center text-gray-450 dark:text-gray-550">
                  No trips scheduled for today.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {todaysTrips.map((b) => (
                    <div key={b.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <div>
                        <p className="font-bold text-xs text-gray-900 dark:text-white">
                          {b.startLocation} → {b.endLocation}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Farmer: {b.farmerName} · Scheduled: {formatDateTime(b.scheduledAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookingStatusBadge status={b.status} />
                        <span className="font-semibold text-xs text-gray-900 dark:text-white">
                          {b.finalCost || b.estimatedCost ? formatCurrency(b.finalCost ?? b.estimatedCost) : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* AVAILABLE REQUESTS (BOOKING MARKETPLACE) */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Available Requests (Marketplace)
            </h2>
            <Card padding={false} className="border border-gray-100 dark:border-gray-750 overflow-hidden">
              {availableRequests.length === 0 ? (
                <EmptyState
                  icon={<Clock size={28} className="text-gray-300 dark:text-gray-600" />}
                  title="No requests pending"
                  description="New booking requests from farmers will appear here. Toggle online status to receive instant match alerts."
                />
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-750/50">
                  {availableRequests.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-gray-900 dark:text-white">
                            {b.startLocation} → {b.endLocation}
                          </span>
                          {b.wantsShared && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold">
                              Shared
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1 text-[10px] text-gray-450 dark:text-gray-400">
                          <span>Date: {formatDate(b.scheduledAt)}</span>
                          <span>•</span>
                          <span>Cargo: {b.cargoWeightKg ? `${b.cargoWeightKg} kg` : 'Weight undisclosed'}</span>
                          <span>•</span>
                          <span className="font-semibold text-primary-600 dark:text-primary-400">
                            Est: {b.estimatedCost ? formatCurrency(b.estimatedCost) : '—'}
                          </span>
                        </div>
                        {b.notes && (
                          <p className="text-[10px] italic text-gray-400 dark:text-gray-500 mt-1 max-w-lg truncate">
                            &ldquo;{b.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => { setRejectTarget(b); setRejectReason(''); }}
                          leftIcon={<X size={12} />}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                        >
                          Reject
                        </Button>
                        <Button
                          size="xs"
                          variant="success"
                          onClick={() => acceptMutation.mutate(b.id)}
                          loading={acceptMutation.isPending && acceptMutation.variables === b.id}
                          leftIcon={<Check size={12} />}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>

        {/* Right Sidebar Columns (Vehicle, Earnings, Suggestions) */}
        <div className="space-y-6">

          {/* VEHICLE INFO WIDGET */}
          <Card className="border border-gray-100 dark:border-gray-750">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Truck size={16} className="text-primary-500" />
                Active Vehicle Info
              </h3>
              <button
                onClick={handleToggleAvailability}
                disabled={toggleAvailabilityMutation.isPending}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${vehicle.availability === 'available' ? 'bg-emerald-500' : 'bg-gray-250 dark:bg-gray-700'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${vehicle.availability === 'available' ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-100/50 dark:border-gray-800">
                <span className="text-gray-400">Availability:</span>
                <span className={`font-semibold flex items-center gap-1 ${vehicle.availability === 'available' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vehicle.availability === 'available' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {vehicle.availability === 'available' ? 'Online (Available)' : 'Offline'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-gray-50/20 dark:bg-gray-900/10 rounded-lg">
                  <span className="text-gray-400 block mb-0.5">Truck Plate:</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{vehicle.number || '—'}</span>
                </div>
                <div className="p-2 bg-gray-50/20 dark:bg-gray-900/10 rounded-lg">
                  <span className="text-gray-400 block mb-0.5">Vehicle Type:</span>
                  <span className="font-bold text-gray-900 dark:text-white capitalize">{vehicle.type || 'standard'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-750 flex items-center justify-between text-xs">
              <span className="text-gray-455">Update documents:</span>
              <Link to={ROUTES.DRIVER_PROFILE}>
                <Button size="xs" variant="outline" className="h-7 text-[10px]">
                  Driver Profile
                </Button>
              </Link>
            </div>
          </Card>

          {/* EARNINGS SUMMARY WIDGET */}
          <Card className="border border-gray-100 dark:border-gray-750 bg-white dark:bg-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
              <DollarSign size={16} className="text-emerald-500" />
              Earnings Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Monitor your payouts, completed trips, and monthly trends.
            </p>

            <div className="space-y-3.5 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Total Earnings:</span>
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  {earnings.total ? formatCurrency(earnings.total) : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Earnings this Month:</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {earnings.thisMonth ? formatCurrency(earnings.thisMonth) : formatCurrency(0)}
                </span>
              </div>
            </div>

            {/* Embedded custom SVG Earnings Line Chart */}
            <div className="h-16 w-full mt-2">
              <svg className="h-full w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,20 Q10,18 25,12 T55,6 T80,10 T100,3 L100,20 Z"
                  fill="url(#earningsGrad)"
                />
                <path
                  d="M0,20 Q10,18 25,12 T55,6 T80,10 T100,3"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 mt-1">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </Card>

          {/* SHARED REQUESTS (CARGO GROUPS LIST) */}
          <Card className="border border-gray-100 dark:border-gray-750">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Users size={16} className="text-blue-500" />
              Shared Route Groups
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Consolidated cargo loads looking for heavy vehicles.
            </p>

            {sharedRequests.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-100 dark:border-gray-750 rounded-2xl">
                <Users className="mx-auto text-gray-300 dark:text-gray-600 mb-1" size={20} />
                <p className="text-[10px] text-gray-400">No active shared group matching today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedRequests.map((sg) => {
                  const filledPct = Math.round((Number(sg.usedCapacityKg) / Number(sg.totalCapacityKg)) * 100);
                  return (
                    <div key={sg.id} className="p-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-start font-bold text-gray-900 dark:text-white">
                        <span>{sg.startLocation} → {sg.endLocation}</span>
                        <span className="text-blue-600 dark:text-blue-400">{sg.memberCount} Farmers</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-450">
                        <span>Load: {sg.usedCapacityKg} kg</span>
                        <span>Group Date: {formatDate(sg.scheduledDate)}</span>
                      </div>
                      <div className="h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(filledPct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* RETURN TRIPS WIDGET */}
          <Card className="border border-gray-100 dark:border-gray-750">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
              <Truck size={16} className="text-emerald-500" />
              Return Trips Marketplace
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Return trips accepted on your return route.
            </p>

            {returnTrips.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-100 dark:border-gray-750 rounded-2xl">
                <Truck className="mx-auto text-gray-300 dark:text-gray-600 mb-1" size={20} />
                <p className="text-[10px] text-gray-400">No return route reservations yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {returnTrips.map((rt) => (
                  <div key={rt.id} className="p-3 bg-emerald-50/10 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-900/10 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-start font-bold text-gray-900 dark:text-white">
                      <span>{rt.startLocation} → {rt.endLocation}</span>
                      <span className="text-[10px] px-1.5 rounded font-bold bg-emerald-100/50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {rt.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      Farmer: <span className="font-semibold text-gray-700 dark:text-gray-200">{rt.farmerName}</span>
                    </div>
                    {rt.pickupDistanceKm && (
                      <div className="text-[9px] text-gray-400">
                        Pickup detour: {rt.pickupDistanceKm} km
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

      </div>

      {/* Reject request modal */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Booking Request"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ id: rejectTarget?.id, reason: rejectReason })}
            >
              Reject Booking
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-450 leading-relaxed">
            Please tell us why you are rejecting this request from {rejectTarget?.farmerName}. Your feedback helps improve routing matching.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Schedule mismatch, weight capacity exceeded..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100
                       placeholder:text-gray-450 focus:outline-none focus:ring-1
                       focus:ring-primary-500 resize-none font-sans"
          />
        </div>
      </Modal>

    </PageContainer>
  );
}
