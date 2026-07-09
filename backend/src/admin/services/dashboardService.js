import { query } from '../../database/index.js';

async function logAction(adminId, action, entityType, entityId, details = {}) {
  await query(
    `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, entityType ?? null, entityId ?? null, JSON.stringify(details)],
  );
}

export async function getDashboard() {
  const [
    users,
    drivers,
    farmers,
    bookings,
    bookingsByStatus,
    revenue,
    activeTrips,
    sharedGroups,
    returnTrips,
    recentBookings,
  ] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total FROM users`),
    query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'driver'`),
    query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'farmer'`),
    query(`SELECT COUNT(*)::int AS total FROM bookings`),
    query(`SELECT status, COUNT(*)::int AS count FROM bookings GROUP BY status ORDER BY count DESC`),
    query(`
      SELECT
        COALESCE(SUM(final_cost), 0)::numeric AS total_revenue,
        COALESCE(SUM(estimated_cost), 0)::numeric AS estimated_revenue,
        COUNT(*) FILTER (WHERE status = 'delivered')::int AS completed_count
      FROM bookings
    `),
    query(`SELECT COUNT(*)::int AS total FROM bookings WHERE status IN ('pickup_started', 'in_transit')`),
    query(`SELECT COUNT(*)::int AS total FROM shared_groups WHERE status NOT IN ('cancelled', 'completed')`),
    query(`SELECT COUNT(*)::int AS total FROM return_trips WHERE status = 'active'`),
    query(`
      SELECT id, farmer_id, driver_id, start_location, end_location, status, created_at
      FROM bookings ORDER BY created_at DESC LIMIT 10
    `),
  ]);

  const todayBookings = await query(
    `SELECT COUNT(*)::int AS total FROM bookings WHERE created_at >= CURRENT_DATE`,
  );

  return {
    summary: {
      totalUsers: users.rows[0].total,
      totalDrivers: drivers.rows[0].total,
      totalFarmers: farmers.rows[0].total,
      totalBookings: bookings.rows[0].total,
      todayBookings: todayBookings.rows[0].total,
      activeTrips: activeTrips.rows[0].total,
      activeSharedGroups: sharedGroups.rows[0]?.total ?? 0,
      activeReturnTrips: returnTrips.rows[0]?.total ?? 0,
    },
    revenue: {
      totalRevenue: Number(revenue.rows[0].total_revenue),
      estimatedRevenue: Number(revenue.rows[0].estimated_revenue),
      completedBookings: revenue.rows[0].completed_count,
    },
    bookingsByStatus: bookingsByStatus.rows.map(r => ({
      status: r.status,
      count: r.count,
    })),
    recentBookings: recentBookings.rows,
  };
}

export { logAction };
