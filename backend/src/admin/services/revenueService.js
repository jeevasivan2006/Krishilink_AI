import { query } from '../../database/index.js';

export async function getRevenueSummary({ period = '30d' } = {}) {
  const interval = periodToInterval(period);

  const [summary, byStatus, daily, sharedSavings] = await Promise.all([
    query(`
      SELECT
        COALESCE(SUM(final_cost), 0)::numeric AS total_revenue,
        COALESCE(SUM(estimated_cost), 0)::numeric AS estimated_revenue,
        COALESCE(AVG(final_cost), 0)::numeric AS avg_order_value,
        COUNT(*) FILTER (WHERE status = 'delivered' AND final_cost IS NOT NULL)::int AS paid_bookings,
        COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_count
      FROM bookings
      WHERE created_at >= NOW() - $1::interval
    `, [interval]),
    query(`
      SELECT status,
        COALESCE(SUM(final_cost), 0)::numeric AS revenue,
        COALESCE(SUM(estimated_cost), 0)::numeric AS estimated,
        COUNT(*)::int AS count
      FROM bookings
      WHERE created_at >= NOW() - $1::interval
      GROUP BY status
    `, [interval]),
    query(`
      SELECT DATE(created_at) AS date,
        COALESCE(SUM(final_cost), 0)::numeric AS revenue,
        COALESCE(SUM(estimated_cost), 0)::numeric AS estimated,
        COUNT(*)::int AS bookings
      FROM bookings
      WHERE created_at >= NOW() - $1::interval AND status = 'delivered'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [interval]),
    query(`
      SELECT COALESCE(SUM(sgm.allocated_cost), 0)::numeric AS shared_revenue,
        COUNT(DISTINCT sgm.shared_group_id)::int AS shared_groups
      FROM shared_group_members sgm
      JOIN shared_groups sg ON sg.id = sgm.shared_group_id
      WHERE sgm.status = 'active' AND sg.created_at >= NOW() - $1::interval
    `, [interval]).catch(() => ({ rows: [{ shared_revenue: 0, shared_groups: 0 }] })),
  ]);

  const s = summary.rows[0];
  return {
    period,
    totalRevenue: Number(s.total_revenue),
    estimatedRevenue: Number(s.estimated_revenue),
    avgOrderValue: round(Number(s.avg_order_value)),
    paidBookings: s.paid_bookings,
    deliveredCount: s.delivered_count,
    sharedTruckRevenue: Number(sharedSavings.rows[0]?.shared_revenue ?? 0),
    activeSharedGroups: sharedSavings.rows[0]?.shared_groups ?? 0,
    byStatus: byStatus.rows.map(r => ({
      status: r.status,
      revenue: Number(r.revenue),
      estimated: Number(r.estimated),
      count: r.count,
    })),
    dailyRevenue: daily.rows.map(r => ({
      date: r.date,
      revenue: Number(r.revenue),
      estimated: Number(r.estimated),
      bookings: r.bookings,
    })),
  };
}

function periodToInterval(period) {
  const map = { '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' };
  return map[period] ?? '30 days';
}

function round(n) {
  return Math.round(n * 100) / 100;
}
