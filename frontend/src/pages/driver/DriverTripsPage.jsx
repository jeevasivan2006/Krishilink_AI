import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Truck, Search, Filter, X, Eye } from 'lucide-react';
import { listBookings } from '@/api/bookings.api';
import { queryKeys, ROUTES, BOOKING_STATUS, PAGINATION_DEFAULTS } from '@/constants';
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

const STATUS_OPTIONS = [
  { value: '',                          label: 'All statuses'  },
  { value: BOOKING_STATUS.PENDING,      label: 'Pending'       },
  { value: BOOKING_STATUS.CONFIRMED,    label: 'Confirmed'     },
  { value: BOOKING_STATUS.IN_TRANSIT,   label: 'In Transit'    },
  { value: BOOKING_STATUS.DELIVERED,    label: 'Delivered'     },
  { value: BOOKING_STATUS.CANCELLED,    label: 'Cancelled'     },
];

export default function DriverTripsPage() {
  usePageTitle('My Trips');

  const [page,         setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.bookings.list({ page, status: statusFilter, search: debouncedSearch }),
    queryFn:  () => listBookings({
      page,
      limit:  PAGINATION_DEFAULTS.limit,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: (prev) => prev,
  });

  const trips      = data?.bookings ?? data?.data ?? [];
  const total      = data?.total ?? data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGINATION_DEFAULTS.limit));

  function handleFilterChange(s) { setStatusFilter(s); setPage(1); }
  function handleSearchChange(e) { setSearch(e.target.value); setPage(1); }

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            My Trips
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} trip${total !== 1 ? 's' : ''} total` : 'Your complete trip history'}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by location…"
              leftIcon={<Search size={15} />}
              value={search}
              onChange={handleSearchChange}
              rightIcon={search ? (
                <button onClick={() => { setSearch(''); setPage(1); }}>
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
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false} className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : ''}>
        {isLoading ? (
          <SectionSpinner message="Loading trips…" />
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<Truck size={28} />}
            title={search || statusFilter ? 'No trips match your filters' : 'No trips yet'}
            description={
              search || statusFilter
                ? 'Try adjusting your search or status filter.'
                : 'Accepted bookings will appear here as trips.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['ID', 'Route', 'Scheduled', 'Weight', 'Status', 'Earnings', ''].map((h) => (
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
                {trips.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {t.id?.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-4 text-gray-800 dark:text-gray-200 min-w-[180px]">
                      <span className="font-medium">{t.start_location}</span>
                      <span className="text-gray-400 mx-1.5">→</span>
                      {t.end_location}
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {formatDate(t.scheduled_at)}
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {t.cargo_weight_kg ? `${t.cargo_weight_kg} kg` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <BookingStatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {t.final_cost ?? t.estimated_cost
                        ? formatCurrency(t.final_cost ?? t.estimated_cost)
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={ROUTES.DRIVER_TRIP_DETAIL(t.id)}>
                        <Button variant="ghost" size="xs" leftIcon={<Eye size={13} />}>
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-5"
        />
      )}
    </PageContainer>
  );
}
