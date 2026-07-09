/**
 * FarmerBookingDetailPage.jsx  →  /farmer/bookings/:id
 *
 * Shows full booking detail including:
 *  - Header with status badge and action buttons (cancel)
 *  - Booking info cards (locations, schedule, cargo, cost)
 *  - Live tracking panel when booking is in_transit
 *  - Audit timeline from /bookings/:id/timeline
 *  - Cancel confirmation modal
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Weight, Truck,
  FileText, Clock, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, Navigation,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { getBooking, getBookingTimeline, cancelBooking } from '@/api/bookings.api';
import { getBookingTracking, getEta } from '@/api/tracking.api';
import { queryKeys, ROUTES, BOOKING_STATUS } from '@/constants';
import { usePageTitle } from '@/hooks';
import { formatCurrency, formatDateTime, formatDate } from '@/utils/formatters';
import { cn } from '@/utils';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BookingStatusBadge from '@/components/ui/BookingStatusBadge';
import { SectionSpinner } from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

/* ── Timeline event icon map ────────────────────────────────── */
const TIMELINE_ICON = {
  created:    <Clock        size={14} className="text-blue-500"    />,
  confirmed:  <CheckCircle2 size={14} className="text-primary-500" />,
  in_transit: <Navigation   size={14} className="text-amber-500"   />,
  delivered:  <CheckCircle2 size={14} className="text-emerald-500" />,
  cancelled:  <XCircle      size={14} className="text-red-500"     />,
  updated:    <RefreshCw    size={14} className="text-gray-400"    />,
};

const CANCELLABLE = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];

export default function FarmerBookingDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelNote, setCancelNote] = useState('');

  /* ── Data fetching ──────────────────────────────────────── */
  const {
    data: bookingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey:  queryKeys.bookings.detail(id),
    queryFn:   () => getBooking(id),
    enabled:   !!id,
  });

  const { data: timelineData } = useQuery({
    queryKey:  [...queryKeys.bookings.detail(id), 'timeline'],
    queryFn:   () => getBookingTimeline(id),
    enabled:   !!id,
  });

  const booking   = bookingData?.booking ?? bookingData;
  const timeline  = timelineData?.timeline ?? timelineData?.events ?? timelineData ?? [];
  const isInTransit = booking?.status === BOOKING_STATUS.IN_TRANSIT;

  const { data: trackingData } = useQuery({
    queryKey:  queryKeys.tracking.live(id),
    queryFn:   () => getBookingTracking(id),
    enabled:   isInTransit,
    refetchInterval: isInTransit ? 15_000 : false,
  });

  const { data: etaData } = useQuery({
    queryKey:  [...queryKeys.tracking.live(id), 'eta'],
    queryFn:   () => getEta(id),
    enabled:   isInTransit,
    refetchInterval: isInTransit ? 30_000 : false,
  });

  usePageTitle(booking ? `Booking · ${id.slice(0, 8)}` : 'Booking Detail');

  /* ── Cancel mutation ────────────────────────────────────── */
  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id, { note: cancelNote }),
    onSuccess: () => {
      toast.success('Booking cancelled.');
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
      setShowCancel(false);
      setCancelNote('');
    },
    onError: (err) => toast.error(err.message || 'Could not cancel booking.'),
  });

  /* ── Loading / error states ─────────────────────────────── */
  if (isLoading) {
    return (
      <PageContainer>
        <SectionSpinner message="Loading booking details…" />
      </PageContainer>
    );
  }

  if (error || !booking) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {error?.message || 'Booking not found.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
            <Link to={ROUTES.FARMER_BOOKINGS}>
              <Button size="sm">Back to bookings</Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const canCancel = CANCELLABLE.includes(booking.status);

  return (
    <PageContainer size="default">
      {/* ── Breadcrumb + header ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Link
          to={ROUTES.FARMER_BOOKINGS}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500
                     hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Bookings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                Booking Detail
              </h1>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">
              ID: {booking.id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<XCircle size={14} />}
                onClick={() => setShowCancel(true)}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Left: main booking info ──────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Route card */}
          <Card>
            <Card.Header>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300
                             flex items-center gap-2">
                <MapPin size={14} className="text-primary-500" /> Route
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <LocationPin label="Pickup" value={booking.start_location} primary />
                <div className="hidden sm:flex flex-1 items-center">
                  <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
                  <Truck size={18} className="text-gray-300 dark:text-gray-600 mx-2 shrink-0" />
                  <div className="flex-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
                </div>
                <LocationPin label="Drop" value={booking.end_location} />
              </div>
            </Card.Body>
          </Card>

          {/* Cargo & schedule */}
          <div className="grid sm:grid-cols-2 gap-5">
            <Card>
              <Card.Header>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300
                               flex items-center gap-2">
                  <Weight size={14} className="text-primary-500" /> Cargo
                </h2>
              </Card.Header>
              <Card.Body className="flex flex-col gap-3">
                <DetailRow label="Weight"        value={booking.cargo_weight_kg ? `${booking.cargo_weight_kg} kg` : '—'} />
                <DetailRow label="Shared load"   value={booking.wants_shared ? 'Yes' : 'No'} />
                {booking.notes && (
                  <DetailRow label="Notes" value={booking.notes} />
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300
                               flex items-center gap-2">
                  <Calendar size={14} className="text-primary-500" /> Schedule
                </h2>
              </Card.Header>
              <Card.Body className="flex flex-col gap-3">
                <DetailRow label="Scheduled"  value={formatDateTime(booking.scheduled_at)} />
                <DetailRow label="Created"    value={formatDate(booking.created_at)} />
                {booking.delivered_at && (
                  <DetailRow label="Delivered" value={formatDateTime(booking.delivered_at)} />
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Cost */}
          <Card>
            <Card.Header>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300
                             flex items-center gap-2">
                <FileText size={14} className="text-primary-500" /> Cost Summary
              </h2>
            </Card.Header>
            <Card.Body className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <DetailRow label="Estimated cost" value={
                  booking.estimated_cost ? formatCurrency(booking.estimated_cost) : '—'
                } />
                {booking.final_cost && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Final cost</p>
                    <p className="text-lg font-display font-bold text-primary-600">
                      {formatCurrency(booking.final_cost)}
                    </p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Live tracking panel */}
          {isInTransit && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary-200 dark:border-primary-800
                               bg-primary-50/40 dark:bg-primary-900/10">
                <Card.Header>
                  <h2 className="text-sm font-semibold text-primary-700 dark:text-primary-400
                                 flex items-center gap-2">
                    <Navigation size={14} className="animate-pulse" />
                    Live Tracking
                    <span className="ml-auto flex items-center gap-1.5 text-xs font-normal
                                     text-primary-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-ping" />
                      In Transit
                    </span>
                  </h2>
                </Card.Header>
                <Card.Body className="grid sm:grid-cols-2 gap-4">
                  {trackingData?.lat && (
                    <DetailRow
                      label="Last position"
                      value={`${Number(trackingData.lat).toFixed(4)}, ${Number(trackingData.lng).toFixed(4)}`}
                    />
                  )}
                  {trackingData?.speed_kmh != null && (
                    <DetailRow label="Speed" value={`${trackingData.speed_kmh} km/h`} />
                  )}
                  {etaData?.eta_minutes != null && (
                    <DetailRow
                      label="ETA"
                      value={`~${etaData.eta_minutes} min`}
                      highlight
                    />
                  )}
                  {etaData?.distance_km != null && (
                    <DetailRow label="Distance remaining" value={`${etaData.distance_km} km`} />
                  )}
                  {!trackingData?.lat && (
                    <p className="text-sm text-primary-600 dark:text-primary-400 col-span-2">
                      Waiting for driver location…
                    </p>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ── Right: timeline ──────────────────────────────── */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <Card.Header>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300
                             flex items-center gap-2">
                <Clock size={14} className="text-primary-500" /> Timeline
              </h2>
            </Card.Header>
            <Card.Body>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  No timeline events yet.
                </p>
              ) : (
                <div className="relative flex flex-col gap-0">
                  {/* Vertical line */}
                  <div className="absolute left-3.5 top-3 bottom-3 w-px
                                  bg-gray-100 dark:bg-gray-700" />

                  {timeline.map((event, i) => {
                    const icon = TIMELINE_ICON[event.status ?? event.type] ?? TIMELINE_ICON.updated;
                    const timeLabel = event.created_at
                      ? formatDistanceToNow(new Date(event.created_at), { addSuffix: true })
                      : '';
                    return (
                      <div
                        key={event.id ?? i}
                        className="relative flex items-start gap-3 pb-5 last:pb-0"
                      >
                        {/* Circle */}
                        <div className="h-7 w-7 rounded-full bg-white dark:bg-gray-800
                                        border-2 border-gray-100 dark:border-gray-700
                                        flex items-center justify-center shrink-0 z-10 shadow-sm">
                          {icon}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200
                                        leading-snug">
                            {event.description ?? event.note ?? event.message
                              ?? `Status: ${event.status ?? event.type}`}
                          </p>
                          {timeLabel && (
                            <p className="text-xs text-gray-400 mt-0.5">{timeLabel}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* ── Cancel modal ────────────────────────────────────── */}
      <Modal
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel Booking"
        description="This action cannot be undone. The booking will be marked as cancelled."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCancel(false)}>
              Keep Booking
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Confirm Cancel
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to cancel booking{' '}
            <span className="font-mono font-semibold">{id?.slice(0, 8)}…</span>?
          </p>
          <textarea
            rows={2}
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            placeholder="Reason for cancellation (optional)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                       placeholder:text-gray-400 focus:outline-none focus:ring-2
                       focus:ring-red-400 resize-none"
          />
        </div>
      </Modal>
    </PageContainer>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */
function LocationPin({ label, value, primary = false }) {
  return (
    <div className={cn(
      'flex items-start gap-2.5 rounded-xl p-3 min-w-0',
      primary
        ? 'bg-primary-50 dark:bg-primary-900/20'
        : 'bg-gray-50 dark:bg-gray-700/40',
    )}>
      <MapPin
        size={16}
        className={cn(
          'shrink-0 mt-0.5',
          primary ? 'text-primary-600' : 'text-gray-400',
        )}
      />
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      <span className={cn(
        'text-sm font-medium',
        highlight
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-gray-900 dark:text-white',
        (!value || value === '—') && 'text-gray-400 dark:text-gray-600 font-normal',
      )}>
        {value || '—'}
      </span>
    </div>
  );
}
