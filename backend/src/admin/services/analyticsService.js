import { query } from '../../database/index.js';

export async function getAnalyticsOverview({ period = '30d' } = {}) {
  const interval = periodToInterval(period);

  const [bookingsTrend, userGrowth, statusBreakdown, topRoutes, cancellationRate] = await Promise.all([
    query(`
      SELECT DATE(created_at) AS date, COUNT(*)::int AS count
      FROM bookings
      WHERE created_at >= NOW() - $1::interval
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [interval]),
    query(`
      SELECT DATE(created_at) AS date, role, COUNT(*)::int AS count
      FROM users
      WHERE created_at >= NOW() - $1::interval
      GROUP BY DATE(created_at), role
      ORDER BY date ASC
    `, [interval]),
    query(`SELECT status, COUNT(*)::int AS count FROM bookings GROUP BY status`),
    query(`
      SELECT start_location, end_location, COUNT(*)::int AS trip_count
      FROM bookings
      WHERE created_at >= NOW() - $1::interval
      GROUP BY start_location, end_location
      ORDER BY trip_count DESC
      LIMIT 10
    `, [interval]),
    query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
        COUNT(*)::int AS total
      FROM bookings
      WHERE created_at >= NOW() - $1::interval
    `, [interval]),
  ]);

  const cancel = cancellationRate.rows[0];
  const cancelRate = cancel.total > 0 ? round((cancel.cancelled / cancel.total) * 100) : 0;

  return {
    period,
    bookingsTrend: bookingsTrend.rows,
    userGrowth: userGrowth.rows,
    statusBreakdown: statusBreakdown.rows,
    topRoutes: topRoutes.rows.map(r => ({
      pickup: r.start_location,
      destination: r.end_location,
      tripCount: r.trip_count,
    })),
    cancellationRate: cancelRate,
    metrics: {
      totalBookingsInPeriod: bookingsTrend.rows.reduce((s, r) => s + r.count, 0),
      cancelledInPeriod: cancel.cancelled,
    },
  };
}

export async function getBookingsAnalytics({ groupBy = 'day', period = '30d' } = {}) {
  const interval = periodToInterval(period);
  const dateTrunc = groupBy === 'week' ? 'week' : groupBy === 'month' ? 'month' : 'day';

  const { rows } = await query(
    `SELECT
       DATE_TRUNC($1, created_at) AS period,
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
       COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
       COUNT(*) FILTER (WHERE status IN ('in_transit', 'pickup_started'))::int AS in_progress
     FROM bookings
     WHERE created_at >= NOW() - $2::interval
     GROUP BY DATE_TRUNC($1, created_at)
     ORDER BY period ASC`,
    [dateTrunc, interval],
  );

  return { groupBy, period, data: rows };
}

function periodToInterval(period) {
  const map = { '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' };
  return map[period] ?? '30 days';
}

function round(n) {
  return Math.round(n * 100) / 100;
}
