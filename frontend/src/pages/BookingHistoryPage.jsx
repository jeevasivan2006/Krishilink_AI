import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFarmerBookingHistory, farmerCancelBooking } from '@/api/farmer.api';
import { getBookingTimeline } from '@/api/bookings.api';
import toast from 'react-hot-toast';
import {
  Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  FileText, Clock, MapPin, Package, Truck, X, Download, Eye,
  Calendar, ArrowUpDown, RefreshCw, AlertCircle, CheckCircle,
  XCircle, Loader2, TrendingUp, IndianRupee, ArrowRight
} from 'lucide-react';

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'bg-amber-100 text-amber-700 border-amber-200',    dot: 'bg-amber-500',   icon: Clock },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500',    icon: CheckCircle },
  in_transit: { label: 'In Transit', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500',  icon: Truck },
  completed:  { label: 'Completed',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-500',     icon: XCircle },
  failed:     { label: 'Failed',     color: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400',    icon: AlertCircle },
};

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'in_transit', 'completed', 'cancelled'];
const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest First' },
  { value: 'oldest',   label: 'Oldest First' },
  { value: 'cost_high',label: 'Cost: High → Low' },
  { value: 'cost_low', label: 'Cost: Low → High' },
];
const LIMIT = 8;

/* ─── Status Badge ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Timeline Modal ─────────────────────────────────────────────── */
function TimelineModal({ bookingId, booking, onClose }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking-timeline', bookingId],
    queryFn: () => getBookingTimeline(bookingId),
    enabled: !!bookingId,
  });

  const events = data?.timeline || data?.events || data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Booking Timeline</h3>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">#{bookingId?.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/80 rounded-xl transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {/* Route summary */}
          {booking && (
            <div className="bg-gray-50 rounded-xl p-4 mb-5 flex items-center gap-3">
              <MapPin size={14} className="text-emerald-600 shrink-0" />
              <span className="text-sm text-gray-700 truncate">{booking.start_location}</span>
              <ArrowRight size={12} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 truncate">{booking.end_location}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={28} className="animate-spin text-emerald-500" />
              <p className="text-sm text-gray-500">Loading timeline…</p>
            </div>
          )}

          {isError && (
            <div className="text-center py-8 text-red-500 text-sm">
              <AlertCircle size={24} className="mx-auto mb-2" />
              Failed to load timeline. Please try again.
            </div>
          )}

          {!isLoading && !isError && Array.isArray(events) && events.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No timeline events yet.</div>
          )}

          {!isLoading && !isError && Array.isArray(events) && events.length > 0 && (
            <ol className="relative border-l-2 border-emerald-100 space-y-6 ml-3">
              {events.map((ev, i) => {
                const cfg = STATUS_CONFIG[ev.status] || {};
                return (
                  <li key={i} className="relative pl-6">
                    <span className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white ${cfg.dot || 'bg-gray-300'}`} />
                    <div className="bg-gray-50 hover:bg-white rounded-xl p-3 transition-colors border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-800 capitalize">
                          {(ev.status || ev.event || ev.action || '').replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {ev.created_at || ev.timestamp
                            ? new Date(ev.created_at || ev.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                            : '—'}
                        </span>
                      </div>
                      {ev.note && <p className="text-xs text-gray-500">{ev.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Booking Detail Modal ──────────────────────────────────────── */
function BookingDetailModal({ booking, onClose, onCancel, cancelling }) {
  if (!booking) return null;
  const canCancel = ['pending', 'confirmed'].includes(booking.status);

  const handleInvoice = () => {
    const rows = [
      ['Field', 'Value'],
      ['Booking ID', booking.id],
      ['From', booking.start_location],
      ['To', booking.end_location],
      ['Scheduled', new Date(booking.scheduled_at).toLocaleString('en-IN')],
      ['Weight (kg)', booking.cargo_weight_kg ?? '—'],
      ['Status', booking.status],
      ['Estimated Cost', booking.estimated_cost ? `INR ${booking.estimated_cost}` : '—'],
      ['Final Cost', booking.final_cost ? `INR ${booking.final_cost}` : '—'],
      ['Notes', booking.notes ?? '—'],
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${booking.id?.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Booking Details</h3>
              <p className="text-emerald-100 text-xs font-mono mt-0.5">#{booking.id?.slice(0, 8)}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Route */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 mt-0.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow" />
                <div className="w-0.5 h-8 bg-emerald-200" />
                <div className="w-3 h-3 rounded-full bg-teal-600 border-2 border-white shadow" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">PICKUP</p>
                  <p className="text-sm font-semibold text-gray-800">{booking.start_location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">DESTINATION</p>
                  <p className="text-sm font-semibold text-gray-800">{booking.end_location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: 'Scheduled', value: new Date(booking.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
              { icon: Package, label: 'Weight', value: booking.cargo_weight_kg ? `${booking.cargo_weight_kg} kg` : '—' },
              { icon: Truck, label: 'Vehicle', value: booking.vehicle_type || 'Any' },
              { icon: IndianRupee, label: 'Est. Cost', value: booking.estimated_cost ? `₹${booking.estimated_cost}` : '—' },
              { icon: IndianRupee, label: 'Final Cost', value: booking.final_cost ? `₹${booking.final_cost}` : '—' },
              { icon: TrendingUp, label: 'Shared', value: booking.wants_shared ? 'Yes' : 'No' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className="text-emerald-600" />
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
              </div>
            ))}
          </div>

          {booking.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700 font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleInvoice}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold transition-colors"
          >
            <Download size={14} />
            Invoice
          </button>
          {canCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              disabled={cancelling}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Cancel Booking
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function BookingHistoryPage() {
  const queryClient = useQueryClient();

  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort]               = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [timelineBookingId, setTimelineBookingId] = useState(null);
  const [timelineBooking, setTimelineBooking] = useState(null);

  /* ── Data ── */
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['farmer-bookings', page, search, statusFilter === 'all' ? '' : statusFilter],
    queryFn: () => getFarmerBookingHistory({
      page,
      limit: LIMIT,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    keepPreviousData: true,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => farmerCancelBooking(bookingId),
    onSuccess: () => {
      toast.success('Booking cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['farmer-bookings'] });
      setSelectedBooking(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking.');
    },
  });

  /* ── Derived data ── */
  const rawBookings = useMemo(() => data?.bookings || data?.data || [], [data]);
  const totalCount  = data?.total || data?.pagination?.total || rawBookings.length;
  const totalPages  = Math.max(1, Math.ceil(totalCount / LIMIT));

  const sortedBookings = useMemo(() => {
    const arr = [...rawBookings];
    switch (sort) {
      case 'oldest':   return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'cost_high':return arr.sort((a, b) => (b.estimated_cost || 0) - (a.estimated_cost || 0));
      case 'cost_low': return arr.sort((a, b) => (a.estimated_cost || 0) - (b.estimated_cost || 0));
      default:         return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [rawBookings, sort]);

  /* ── Handlers ── */
  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const openTimeline = (booking) => {
    setTimelineBookingId(booking.id);
    setTimelineBooking(booking);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking History</h1>
              <p className="text-sm text-gray-500">Track all your transport bookings in one place</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {STATUS_OPTIONS.filter(s => s !== 'all').map(status => {
              const cfg = STATUS_CONFIG[status];
              const count = rawBookings.filter(b => b.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(1); }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                    statusFilter === status ? 'ring-2 ring-emerald-400 bg-white shadow-md' : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <div>
                    <p className="text-xs text-gray-500 capitalize">{cfg.label}</p>
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search + Controls ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location, booking ID…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 text-sm transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-emerald-200"
            >
              Search
            </button>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter size={14} />
              Filters
              {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin text-emerald-500' : ''} />
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3 items-center">
              {/* Status filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Status:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setPage(1); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${
                        statusFilter === s
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <ArrowUpDown size={12} className="text-gray-400" />
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Count bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-600">
              {isFetching ? 'Refreshing…' : `${totalCount} booking${totalCount !== 1 ? 's' : ''} found`}
            </p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => { setStatusFilter('all'); setPage(1); }}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
              >
                <X size={10} /> Clear filter
              </button>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="text-gray-500 text-sm">Loading your bookings…</p>
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
              <AlertCircle size={36} />
              <p className="text-sm font-medium">Failed to load bookings.</p>
              <button onClick={() => refetch()} className="text-sm text-emerald-600 underline">Try again</button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && sortedBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText size={28} className="text-gray-300" />
              </div>
              <p className="text-base font-medium text-gray-500">No bookings found</p>
              <p className="text-sm text-gray-400">
                {search ? `No results for "${search}"` : 'Your bookings will appear here once you book transport.'}
              </p>
              {search && (
                <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="text-sm text-emerald-600 underline">
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && sortedBookings.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="px-5 py-3.5">Booking</th>
                      <th className="px-5 py-3.5">Route</th>
                      <th className="px-5 py-3.5">Scheduled</th>
                      <th className="px-5 py-3.5">Weight</th>
                      <th className="px-5 py-3.5">Cost</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-xs font-mono text-gray-400">#{booking.id?.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(booking.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-5 py-4 max-w-[200px]">
                          <p className="text-sm font-medium text-gray-800 truncate">{booking.start_location}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <ArrowRight size={10} />
                            <span className="truncate">{booking.end_location}</span>
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-700">
                            {new Date(booking.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(booking.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                          {booking.cargo_weight_kg ? `${booking.cargo_weight_kg} kg` : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-800">
                            {booking.final_cost
                              ? `₹${booking.final_cost}`
                              : booking.estimated_cost
                              ? `~₹${booking.estimated_cost}`
                              : '—'}
                          </p>
                          {booking.estimated_cost && !booking.final_cost && (
                            <p className="text-xs text-gray-400">Estimated</p>
                          )}
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={booking.status} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openTimeline(booking)}
                              title="Timeline"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                            >
                              <Clock size={15} />
                            </button>
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              title="View Details"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {sortedBookings.map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-xs font-mono text-gray-400">#{booking.id?.slice(0, 8)}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{booking.start_location}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <ArrowRight size={10} /> {booking.end_location}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(booking.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {booking.estimated_cost ? `~₹${booking.estimated_cost}` : '—'}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => openTimeline(booking)} className="text-blue-500 hover:text-blue-700">
                          <Clock size={15} />
                        </button>
                        <button onClick={() => setSelectedBooking(booking)} className="text-emerald-600 hover:text-emerald-800">
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                {/* Page numbers */}
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                          p === page
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                            : 'border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {timelineBookingId && (
        <TimelineModal
          bookingId={timelineBookingId}
          booking={timelineBooking}
          onClose={() => { setTimelineBookingId(null); setTimelineBooking(null); }}
        />
      )}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={(id) => cancelMutation.mutate(id)}
          cancelling={cancelMutation.isPending}
        />
      )}
    </div>
  );
}
