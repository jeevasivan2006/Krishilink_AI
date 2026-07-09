/**
 * DriverMarketplacePage.jsx  →  /driver/marketplace
 *
 * Return-trip marketplace for drivers:
 *  - Lists return-trip availability (drivers near farmers)
 *  - Shows suggestions for the current driver
 *  - Accept / reject suggestions inline
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeftRight, MapPin, Check, X, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getReturnTripAvailability,
  listSuggestions,
  acceptSuggestion,
  rejectSuggestion,
} from '@/api/returnTrip.api';
import { PAGINATION_DEFAULTS } from '@/constants';
import { usePageTitle } from '@/hooks';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/utils';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SectionSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';

const FILTER_OPTIONS = [
  { value: 'all',    label: 'All'     },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted'},
];

export default function DriverMarketplacePage() {
  usePageTitle('Return-Trip Marketplace');
  const qc = useQueryClient();

  const [filter, setFilter]         = useState('pending');
  const [page,   setPage]           = useState(1);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  /* ── Suggestions for this driver ─────────────────────────── */
  const { data: suggestionsData, isLoading: sLoading, refetch } = useQuery({
    queryKey: ['driver', 'marketplace', 'suggestions', filter, page],
    queryFn:  () => listSuggestions({
      status: filter === 'all' ? undefined : filter,
      page,
      limit: PAGINATION_DEFAULTS.limit,
    }),
    refetchInterval: 60_000,
  });

  /* ── Available return trips on the network ────────────────── */
  const { data: availData, isLoading: aLoading } = useQuery({
    queryKey: ['driver', 'marketplace', 'availability'],
    queryFn:  getReturnTripAvailability,
    staleTime: 2 * 60_000,
  });

  const suggestions  = suggestionsData?.suggestions  ?? suggestionsData?.data ?? [];
  const total        = suggestionsData?.total         ?? suggestionsData?.count ?? 0;
  const totalPages   = Math.max(1, Math.ceil(total / PAGINATION_DEFAULTS.limit));
  const availability = availData?.drivers ?? availData?.data ?? [];

  /* ── Mutations ────────────────────────────────────────────── */
  const acceptMutation = useMutation({
    mutationFn: acceptSuggestion,
    onSuccess:  () => { toast.success('Trip accepted! 🚛'); qc.invalidateQueries({ queryKey: ['driver', 'marketplace'] }); },
    onError:    (err) => toast.error(err.message || 'Could not accept.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectSuggestion(id, { reason }),
    onSuccess:  () => { toast.success('Trip rejected.'); setRejectTarget(null); setRejectReason(''); qc.invalidateQueries({ queryKey: ['driver', 'marketplace'] }); },
    onError:    (err) => toast.error(err.message || 'Could not reject.'),
  });

  return (
    <PageContainer>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight size={22} className="text-primary-600" />
            Return-Trip Marketplace
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Find return loads near your destination and earn on the way back.
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} />} onClick={() => refetch()}>
          Refresh
        </Button>
      </motion.div>

      {/* Network availability summary */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp size={15} className="text-primary-500" />
          Network Availability
          {availability.length > 0 && (
            <Badge variant="green">{availability.length} available now</Badge>
          )}
        </h2>
        <Card padding={false}>
          {aLoading ? <SectionSpinner message="Loading availability…" /> :
          availability.length === 0 ? (
            <EmptyState icon={<ArrowLeftRight size={24} />} title="No return trips available"
              description="Check back soon — more drivers complete trips every hour." />
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {availability.slice(0, 6).map((d, i) => (
                <AvailabilityRow key={d.id ?? i} data={d} />
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* My suggestions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            My Trip Suggestions
          </h2>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {FILTER_OPTIONS.map(({ value, label }) => (
              <button key={value} onClick={() => { setFilter(value); setPage(1); }}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  filter === value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200')}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Card padding={false}>
          {sLoading ? <SectionSpinner message="Loading suggestions…" /> :
          suggestions.length === 0 ? (
            <EmptyState icon={<ArrowLeftRight size={24} />}
              title="No suggestions yet"
              description={filter === 'pending'
                ? 'Complete a delivery to generate return-trip suggestions.'
                : 'No suggestions in this category.'} />
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {suggestions.map(s => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  onAccept={() => acceptMutation.mutate(s.id)}
                  accepting={acceptMutation.isPending && acceptMutation.variables === s.id}
                  onReject={() => { setRejectTarget(s); setRejectReason(''); }}
                />
              ))}
            </div>
          )}
        </Card>

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-5" />
        )}
      </motion.div>

      {/* Reject modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Decline Trip" size="sm"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>Back</Button>
          <Button variant="danger" size="sm" loading={rejectMutation.isPending}
            onClick={() => rejectMutation.mutate({ id: rejectTarget?.id, reason: rejectReason })}>
            Decline
          </Button>
        </div>}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to decline this return-trip suggestion?
          </p>
          <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason (optional)"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
        </div>
      </Modal>
    </PageContainer>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */
function AvailabilityRow({ data: d }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
          <MapPin size={13} className="text-primary-500 shrink-0" />
          {d.current_location ?? 'Unknown location'}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {d.return_destination && (
            <span className="text-xs text-gray-500">→ {d.return_destination}</span>
          )}
          {d.search_radius_km && (
            <span className="text-xs text-gray-400">{d.search_radius_km} km radius</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="green" dot>Available</Badge>
      </div>
    </div>
  );
}

function SuggestionRow({ suggestion: s, onAccept, accepting, onReject }) {
  const STATUS_BADGE = {
    pending:  { variant: 'yellow', label: 'Pending'  },
    accepted: { variant: 'green',  label: 'Accepted' },
    rejected: { variant: 'red',    label: 'Declined' },
    expired:  { variant: 'gray',   label: 'Expired'  },
  };
  const badge = STATUS_BADGE[s.status] ?? { variant: 'gray', label: s.status ?? '—' };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {s.pickup_location ?? s.start_location ?? 'Unknown'}{' '}
          <span className="text-gray-400 mx-1">→</span>{' '}
          {s.drop_location ?? s.end_location ?? '—'}
        </p>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {s.scheduled_at && <span className="text-xs text-gray-500"><Clock size={11} className="inline mr-0.5" />{formatDate(s.scheduled_at)}</span>}
          {s.estimated_amount && <span className="text-xs font-semibold text-primary-600">{formatCurrency(s.estimated_amount)}</span>}
          {s.distance_km && <span className="text-xs text-gray-400">{s.distance_km} km</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {s.status === 'pending' && (
          <>
            <Button size="sm" variant="success" leftIcon={<Check size={13} />} loading={accepting} onClick={onAccept}>Accept</Button>
            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" leftIcon={<X size={13} />} onClick={onReject}>Decline</Button>
          </>
        )}
      </div>
    </div>
  );
}
