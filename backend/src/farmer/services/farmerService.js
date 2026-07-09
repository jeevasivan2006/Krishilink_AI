import { query } from '../../database/index.js'; // Assume a query helper that uses pg pool
import { successResponse } from '../../utils/apiResponse.js';

export const getDashboard = async (farmerId) => {
  const totalRes = await query('SELECT COUNT(*)::int AS total FROM bookings WHERE farmer_id = $1', [farmerId]);
  const activeRes = await query(
    `SELECT COUNT(*)::int AS total FROM bookings 
     WHERE farmer_id = $1 AND status IN ('searching_truck', 'shared_matching', 'accepted', 'pickup_started', 'in_transit')`,
    [farmerId]
  );
  const deliveredRes = await query("SELECT COUNT(*)::int AS total FROM bookings WHERE farmer_id = $1 AND status = 'delivered'", [farmerId]);
  const spentRes = await query(
    "SELECT SUM(COALESCE(final_cost, estimated_cost, 0))::float AS total FROM bookings WHERE farmer_id = $1 AND status = 'delivered'",
    [farmerId]
  );

  return {
    stats: {
      total_bookings: totalRes.rows[0]?.total ?? 0,
      active_shipments: activeRes.rows[0]?.total ?? 0,
      delivered: deliveredRes.rows[0]?.total ?? 0,
      total_spent: spentRes.rows[0]?.total ?? 0,
    },
    alerts: []
  };
};

export const getProfile = async (farmerId) => {
  const result = await query('SELECT id, name, email, phone FROM users WHERE id = $1 AND role = $2', [farmerId, 'farmer']);
  return result.rows[0];
};

export const bookTransport = async (farmerId, payload) => {
  const { vehicle_id, start_location, end_location, scheduled_at } = payload;
  const insertQuery = `INSERT INTO bookings (farmer_id, vehicle_id, start_location, end_location, scheduled_at, status)
    VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`;
  const result = await query(insertQuery, [farmerId, vehicle_id, start_location, end_location, scheduled_at]);
  return result.rows[0];
};

export const getBookingHistory = async (farmerId, { page, limit, search }) => {
  const offset = (page - 1) * limit;
  const baseQuery = `SELECT * FROM bookings WHERE farmer_id = $1`;
  const params = [farmerId];
  let filterQuery = '';
  if (search) {
    filterQuery = ` AND (start_location ILIKE $2 OR end_location ILIKE $2)`;
    params.push(`%${search}%`);
  }
  const pagination = ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const finalQuery = baseQuery + filterQuery + pagination;
  const result = await query(finalQuery, [...params, limit, offset]);
  return { bookings: result.rows, page, limit };
};

export const cancelBooking = async (farmerId, bookingId) => {
  const result = await query('UPDATE bookings SET status = $1 WHERE id = $2 AND farmer_id = $3 RETURNING *', ['canceled', bookingId, farmerId]);
  return result.rows[0];
};

export const getEstimatedCost = async (payload) => {
  const { distance_km, vehicle_type } = payload;
  // Simple cost estimation logic – replace with real business rules
  const ratePerKm = vehicle_type === 'truck' ? 5 : 3; // example rates
  return { estimatedCost: distance_km * ratePerKm };
};

export const getBookingDetails = async (farmerId, bookingId) => {
  const result = await query('SELECT * FROM bookings WHERE id = $1 AND farmer_id = $2', [bookingId, farmerId]);
  return result.rows[0];
};
