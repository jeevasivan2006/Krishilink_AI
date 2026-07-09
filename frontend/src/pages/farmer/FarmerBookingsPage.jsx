import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Package, Trash2, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFarmerBookingHistory, farmerCancelBooking } from '@/api/farmer.api';
import { queryKeys, ROUTES, BOOKING_STATUS, PAGINATION_DEFAULTS } from '@/constants';
import { usePageTitle, useDebounce } from '@/hooks';
import { formatCurrency, formatDate } from '@/utils/formatters';
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

const STATUS_OPTIONS = [
  { value: '',                          label: 'All statuses'  },
  { value: BOOKING_STATUS.PENDING,      label: 'Pending'       },
  { value: BOOKING_STATUS.CONFIRMED,    label: 'Confirmed'     },
  { value: BOOKING_STATUS.IN_TRANSIT,   label: 'In Transit'    },
  { value: BOOKING_STATUS.DELIVERED,    label: 'Delivered'     },
  { value: BOOKING_STATUS.CANCELLED,    label: 'Cancelled'     },
];

export default function FarmerBookingsPage() {
  usePageTitle('My Bookings');
  const qc = useQueryClient();

  const [page,         setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [cancelTarget, setCancelTarget] = useState(null); // booking to cancel

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.bookings.list({ page, status: statusFilter, search: debouncedSearch }),
    queryFn:  () => getFarmerBookingHistory({
      page,
      limit:  PAGINATION_DEFAULTS.limit,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: (prev) => prev,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => farmerCancelBooking(id),
    onSuccess:  () => {
      toast.success('Booking cancelled.');
      qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
      setCancelTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Could not cancel booking.'),
  });

  const bookings    = data?.bookings ?? data?.data ?? [];
  const total       = data?.total ?? data?.count ?? 0;
  const totalPages  = Math.max(1, Math.ceil(total / PAGINATION_DEFAULTS.limit));

  function handleFilterChange(newStatus) {
    setStatusFilter(newStatus);
    setPage(1);
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <PageContainer>
      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            My Bookings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} booking${total !== 1 ? 's' : ''} total` : 'All your transport bookings'}
          </p>
        </div>
        <Link to={ROUTES.FARMER_BOOKING_NEW}>
          <Button leftIcon={<Plus size={16} />} size="sm">
            New Booking
          </Button>
        </Link>
      </motion.div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by location or ID…"
              leftIcon={<Search size={15} />}
              value={search}
              onChange={handleSearchChange}
              rightIcon={search ? (
                <button onClick={() => { setSearch(''); setPage(1); }} className="hover:text-gray-700">
                  <X size={14} />
                </button>
              ) : null}
            />
          </div>
          <div className="sm:w-44">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              leftIcon={<Filter size={14} />}
            />
          </div>
        </div>
      </Card>

      {/* ── Table ──────────────────────────────────────────────── */}
      <Card padding={false} className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : ''}>
        {isLoading ? (
          <SectionSpinner message="Loading bookings…" />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title={search || statusFilter ? 'No bookings match your filters' : 'No bookings yet'}
            description={
              search || statusFilter
                ? 'Try adjusting your search or filter.'
                : 'Create your first booking to get started.'
            }
            action={
              !search && !statusFilter && (
                <Link to={ROUTES.FARMER_BOOKING_NEW}>
                  <Button size="sm" leftIcon={<Plus size={14} />}>
                    Create booking
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['ID', 'From → To', 'Scheduled', 'Weight', 'Status', 'Amount', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500
                                 uppercase tracking-wide last:text-right whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {b.id?.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-4 text-gray-800 dark:text-gray-200 min-w-[180px]">
                      <span className="font-medium">{b.start_location}</span>
                      <span className="text-gray-400 mx-1.5">→</span>
                      <span>{b.end_location}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {formatDate(b.scheduled_at)}
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {b.cargo_weight_kg ? `${b.cargo_weight_kg} kg` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {b.final_cost ?? b.estimated_cost
                        ? formatCurrency(b.final_cost ?? b.estimated_cost)
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={ROUTES.FARMER_BOOKING_DETAIL(b.id)}>
                          <Button variant="ghost" size="xs" leftIcon={<Eye size={13} />}>
                            View
                          </Button>
                        </Link>
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            leftIcon={<Trash2 size={13} />}
                            onClick={() => setCancelTarget(b)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-5"
        />
      )}

      {/* ── Cancel confirmation modal ─────────────────────────── */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Booking"
        description="This action cannot be undone. The booking will be marked as cancelled."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
              Keep Booking
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelTarget?.id)}
            >
              Yes, Cancel
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to cancel the booking{' '}
          <span className="font-mono font-semibold">{cancelTarget?.id?.slice(0, 8)}…</span>?
        </p>
      </Modal>
    </PageContainer>
  );
}
