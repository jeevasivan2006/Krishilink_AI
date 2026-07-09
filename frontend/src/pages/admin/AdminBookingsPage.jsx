import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, X, Package, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { listAdminBookings, updateAdminBookingStatus } from '@/api/admin.api';
import { BOOKING_STATUS, PAGINATION_DEFAULTS } from '@/constants';
import { usePageTitle, useDebounce } from '@/hooks';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import BookingStatusBadge from '@/components/ui/BookingStatusBadge';
import { SectionSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';

const STATUS_OPTS = [
  { value: '',                          label: 'All statuses' },
  { value: BOOKING_STATUS.PENDING,      label: 'Pending'      },
  { value: BOOKING_STATUS.CONFIRMED,    label: 'Confirmed'    },
  { value: BOOKING_STATUS.IN_TRANSIT,   label: 'In Transit'   },
  { value: BOOKING_STATUS.DELIVERED,    label: 'Delivered'    },
  { value: BOOKING_STATUS.CANCELLED,    label: 'Cancelled'    },
];

export default function AdminBookingsPage() {
  usePageTitle('Bookings — Admin');
  const qc = useQueryClient();

  const [page,         setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [editTarget,   setEditTarget]   = useState(null);
  const [newStatus,    setNewStatus]    = useState('');
  const [statusNote,   setStatusNote]   = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'bookings', { page, status: statusFilter, search: debouncedSearch }],
    queryFn: () => listAdminBookings({
      page, limit: PAGINATION_DEFAULTS.limit,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: prev => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }) => updateAdminBookingStatus(id, { status, note }),
    onSuccess:  () => { toast.success('Booking status updated.'); qc.invalidateQueries({ queryKey: ['admin', 'bookings'] }); setEditTarget(null); },
    onError:    (err) => toast.error(err.message || 'Update failed.'),
  });

  const bookings   = data?.bookings ?? data?.data ?? [];
  const total      = data?.total ?? data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGINATION_DEFAULTS.limit));

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} total booking${total !== 1 ? 's' : ''}` : 'All platform bookings'}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by location or ID…" leftIcon={<Search size={15} />}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              rightIcon={search ? <button onClick={() => { setSearch(''); setPage(1); }}><X size={14} /></button> : null} />
          </div>
          <div className="sm:w-44">
            <Select options={STATUS_OPTS} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false} className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : ''}>
        {isLoading ? <SectionSpinner message="Loading bookings…" /> : bookings.length === 0 ? (
          <EmptyState icon={<Package size={28} />} title="No bookings found" description="Try adjusting filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['ID', 'Route', 'Scheduled', 'Weight', 'Status', 'Amount', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide last:text-right whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{b.id?.slice(0, 8)}…</td>
                    <td className="px-5 py-4 text-gray-800 dark:text-gray-200 min-w-[180px]">
                      <span className="font-medium">{b.start_location}</span>
                      <span className="text-gray-400 mx-1">→</span>{b.end_location}
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(b.scheduled_at)}</td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{b.cargo_weight_kg ? `${b.cargo_weight_kg} kg` : '—'}</td>
                    <td className="px-5 py-4"><BookingStatusBadge status={b.status} /></td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {b.final_cost ?? b.estimated_cost ? formatCurrency(b.final_cost ?? b.estimated_cost) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" size="xs" leftIcon={<Pencil size={12} />}
                        onClick={() => { setEditTarget(b); setNewStatus(b.status ?? ''); setStatusNote(''); }}>
                        Override
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-5" />}

      {/* Status override modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Override Booking Status" size="sm"
        description={`Booking ${editTarget?.id?.slice(0, 8)}…`}
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button size="sm" loading={updateMutation.isPending}
            onClick={() => updateMutation.mutate({ id: editTarget?.id, status: newStatus, note: statusNote })}>
            Apply
          </Button>
        </div>}>
        <div className="flex flex-col gap-4">
          <Select label="New status" options={STATUS_OPTS.slice(1)} value={newStatus} onChange={e => setNewStatus(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Admin note (optional)</label>
            <textarea rows={2} value={statusNote} onChange={e => setStatusNote(e.target.value)}
              placeholder="Reason for override…"
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
