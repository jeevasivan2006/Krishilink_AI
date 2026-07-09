/**
 * NotificationsPage.jsx  →  /notifications
 *
 * Features:
 *  - Paginated list via TanStack Query
 *  - Mark single / all as read via mutations
 *  - SSE live push via EventSource (new notifications auto-prepend)
 *  - Unread badge on Bell icon updates in real time
 *  - Filter by read / unread
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Package, Truck, ArrowLeftRight,
  AlertCircle, Info, Circle, CheckCircle2, Trash,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationEventsUrl,
} from '@/api/notifications.api';
import { queryKeys, PAGINATION_DEFAULTS } from '@/constants';
import { usePageTitle } from '@/hooks';
import { cn } from '@/utils';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { SectionSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

/* ── Notification type → icon map ────────────────────────────── */
const TYPE_ICON = {
  booking:      <Package    size={18} className="text-blue-500"    />,
  trip:         <Truck      size={18} className="text-primary-500" />,
  return_trip:  <ArrowLeftRight size={18} className="text-amber-500" />,
  shared_truck: <Truck      size={18} className="text-purple-500"  />,
  alert:        <AlertCircle size={18} className="text-red-500"    />,
  info:         <Info       size={18} className="text-gray-400"    />,
};

const FILTER_OPTIONS = [
  { value: 'all',    label: 'All'    },
  { value: 'unread', label: 'Unread' },
  { value: 'read',   label: 'Read'   },
];

export default function NotificationsPage() {
  usePageTitle('Notifications');
  const qc = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [filter, setFilter] = useState('all');

  /* ── Query ─────────────────────────────────────────────────── */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.notifications.all(), { page, filter }],
    queryFn:  () => listNotifications({
      page,
      limit:  PAGINATION_DEFAULTS.limit,
      ...(filter === 'unread' && { read: false }),
      ...(filter === 'read'   && { read: true  }),
    }),
    placeholderData: (prev) => prev,
  });

  const notifications = data?.notifications ?? data?.data ?? [];
  const total         = data?.total ?? data?.count ?? 0;
  const unreadCount   = data?.unread_count ?? 0;
  const totalPages    = Math.max(1, Math.ceil(total / PAGINATION_DEFAULTS.limit));

  /* ── Mark single read ──────────────────────────────────────── */
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });

  /* ── Mark all read ─────────────────────────────────────────── */
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      toast.success('All notifications marked as read.');
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
    onError: (err) => toast.error(err.message || 'Failed to mark all as read.'),
  });

  /* ── SSE live updates ──────────────────────────────────────── */
  useEffect(() => {
    const url = getNotificationEventsUrl();
    if (!url) return;

    const source = new EventSource(url);

    source.onmessage = (e) => {
      try {
        const incoming = JSON.parse(e.data);
        // Prepend to cache so it shows up immediately
        qc.setQueryData(
          [...queryKeys.notifications.all(), { page: 1, filter: 'all' }],
          (old) => {
            if (!old) return old;
            const existing = old.notifications ?? old.data ?? [];
            return {
              ...old,
              notifications: [incoming, ...existing],
              total: (old.total ?? 0) + 1,
              unread_count: (old.unread_count ?? 0) + 1,
            };
          },
        );
        // Also invalidate to keep server state in sync
        qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      } catch { /* non-JSON event, ignore */ }
    };

    source.onerror = () => source.close();

    return () => source.close();
  }, [qc]);

  const handleFilterChange = (val) => {
    setFilter(val);
    setPage(1);
  };

  return (
    <PageContainer>
      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={22} className="text-gray-700 dark:text-gray-200" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[1rem] flex items-center
                               justify-center rounded-full bg-red-500 text-white text-[10px]
                               font-bold px-1 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'You are all caught up!'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck size={15} />}
            loading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            Mark all as read
          </Button>
        )}
      </motion.div>

      {/* ── Filter tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1
                      rounded-xl w-fit">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              filter === value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── List ───────────────────────────────────────────────── */}
      <Card padding={false} className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : ''}>
        {isLoading ? (
          <SectionSpinner message="Loading notifications…" />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} />}
            title={filter !== 'all' ? `No ${filter} notifications` : 'No notifications yet'}
            description={
              filter !== 'all'
                ? `Switch to "All" to see every notification.`
                : 'Activity alerts about your bookings and trips will appear here.'
            }
          />
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => (
              <NotificationRow
                key={n.id}
                notification={n}
                isLast={i === notifications.length - 1}
                onMarkRead={() => markReadMutation.mutate(n.id)}
                markingRead={markReadMutation.isPending && markReadMutation.variables === n.id}
              />
            ))}
          </AnimatePresence>
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
    </PageContainer>
  );
}

/* ── Notification row ─────────────────────────────────────────── */
function NotificationRow({ notification: n, isLast, onMarkRead, markingRead }) {
  const icon = TYPE_ICON[n.type] ?? TYPE_ICON.info;

  const timeAgo = n.created_at
    ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-4 px-5 py-4 transition-colors',
        !isLast && 'border-b border-gray-50 dark:border-gray-700/50',
        !n.read
          ? 'bg-primary-50/40 dark:bg-primary-900/10 hover:bg-primary-50/60'
          : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/40',
      )}
    >
      {/* Icon */}
      <div className={cn(
        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
        n.read
          ? 'bg-gray-100 dark:bg-gray-700/60'
          : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700',
      )}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-snug',
          n.read
            ? 'text-gray-600 dark:text-gray-400'
            : 'text-gray-900 dark:text-white font-medium',
        )}>
          {n.message ?? n.title ?? 'New notification'}
        </p>
        {n.body && n.body !== n.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            {n.body}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo}</p>
      </div>

      {/* Unread dot + mark-read button */}
      <div className="flex items-center gap-2 shrink-0">
        {!n.read && (
          <>
            <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" aria-label="Unread" />
            <button
              onClick={onMarkRead}
              disabled={markingRead}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600
                         hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              aria-label="Mark as read"
              title="Mark as read"
            >
              {markingRead
                ? <Circle size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
