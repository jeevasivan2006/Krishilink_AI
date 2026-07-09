import { query } from '../../database/index.js';

export async function generateBookingsReport({ period = '30d', format = 'json' } = {}) {
  const interval = periodToInterval(period);

  const { rows } = await query(
    `SELECT
       b.id, b.status, b.start_location, b.end_location,
       b.scheduled_at, b.estimated_cost, b.final_cost,
       b.created_at, f.name AS farmer_name, d.name AS driver_name
     FROM bookings b
     LEFT JOIN users f ON f.id = b.farmer_id
     LEFT JOIN users d ON d.id = b.driver_id
     WHERE b.created_at >= NOW() - $1::interval
     ORDER BY b.created_at DESC`,
    [interval],
  );

  const summary = {
    total: rows.length,
    delivered: rows.filter(r => r.status === 'delivered').length,
    cancelled: rows.filter(r => r.status === 'cancelled').length,
    totalRevenue: rows.reduce((s, r) => s + Number(r.final_cost ?? 0), 0),
  };

  return {
    reportType: 'bookings',
    period,
    format,
    generatedAt: new Date().toISOString(),
    summary,
    data: rows.map(r => ({
      id: r.id,
      status: r.status,
      pickup: r.start_location,
      destination: r.end_location,
      scheduledAt: r.scheduled_at,
      estimatedCost: r.estimated_cost != null ? Number(r.estimated_cost) : null,
      finalCost: r.final_cost != null ? Number(r.final_cost) : null,
      farmer: r.farmer_name,
      driver: r.driver_name,
      createdAt: r.created_at,
    })),
  };
}

export async function generateRevenueReport({ period = '30d' } = {}) {
  const interval = periodToInterval(period);

  const { rows } = await query(
    `SELECT
       DATE_TRUNC('week', created_at) AS week,
       COUNT(*)::int AS bookings,
       COALESCE(SUM(final_cost), 0)::numeric AS revenue,
       COALESCE(AVG(final_cost), 0)::numeric AS avg_value
     FROM bookings
     WHERE created_at >= NOW() - $1::interval AND status = 'delivered'
     GROUP BY DATE_TRUNC('week', created_at)
     ORDER BY week ASC`,
    [interval],
  );

  return {
    reportType: 'revenue',
    period,
    generatedAt: new Date().toISOString(),
    totalRevenue: rows.reduce((s, r) => s + Number(r.revenue), 0),
    data: rows.map(r => ({
      week: r.week,
      bookings: r.bookings,
      revenue: Number(r.revenue),
      avgOrderValue: round(Number(r.avg_value)),
    })),
  };
}

export async function generateUsersReport() {
  const { rows } = await query(
    `SELECT role, status, COUNT(*)::int AS count
     FROM users GROUP BY role, status ORDER BY role, status`,
  );

  const total = rows.reduce((s, r) => s + r.count, 0);

  return {
    reportType: 'users',
    generatedAt: new Date().toISOString(),
    totalUsers: total,
    breakdown: rows.map(r => ({ role: r.role, status: r.status, count: r.count })),
  };
}

function periodToInterval(period) {
  const map = { '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' };
  return map[period] ?? '30 days';
}

function round(n) {
  return Math.round(n * 100) / 100;
}
