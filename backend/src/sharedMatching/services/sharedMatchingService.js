import createError from 'http-errors';
import { withTransaction } from '../../database/transaction.js';
import { query } from '../../database/index.js';
import { BOOKING_STATUS } from '../../booking/constants/bookingStatus.js';
import {
  DEFAULT_TRUCK_CAPACITY_KG,
  MATCHABLE_BOOKING_STATUSES,
  MEMBER_STATUS,
  OPEN_GROUP_STATUSES,
  SHARED_GROUP_STATUS,
} from '../constants/sharedGroupStatus.js';
import {
  buildRouteKey,
  calculateRemainingCapacity,
  canAccommodate,
  computeGroupTotalCost,
  deriveGroupStatus,
  locationKey,
  matchesGroupCriteria,
  roundKg,
  splitCostProportionally,
  toScheduledDate,
} from '../lib/index.js';

const GROUP_COLUMNS = `
  id, truck_id, start_location, end_location,
  start_location_key, end_location_key, scheduled_date,
  total_capacity_kg, used_capacity_kg, total_cost, status,
  created_at, updated_at
`;

function mapGroup(row) {
  if (!row) return null;
  return {
    ...row,
    total_capacity_kg: Number(row.total_capacity_kg),
    used_capacity_kg: Number(row.used_capacity_kg),
    remaining_capacity_kg: calculateRemainingCapacity(row.total_capacity_kg, row.used_capacity_kg),
    total_cost: row.total_cost != null ? Number(row.total_cost) : null,
  };
}

function mapMember(row) {
  if (!row) return null;
  return {
    ...row,
    cargo_weight_kg: Number(row.cargo_weight_kg),
    allocated_cost: row.allocated_cost != null ? Number(row.allocated_cost) : null,
  };
}

async function getBookingForMatching(client, bookingId, farmerId) {
  const conditions = ['id = $1'];
  const params = [bookingId];

  if (farmerId) {
    conditions.push('farmer_id = $2');
    params.push(farmerId);
  }

  const { rows } = await client.query(
    `SELECT * FROM bookings WHERE ${conditions.join(' AND ')} FOR UPDATE`,
    params,
  );

  if (!rows[0]) throw createError(404, 'Booking not found');
  return rows[0];
}

async function getActiveMembers(client, groupId) {
  const exec = client ?? { query };
  const { rows } = await exec.query(
    `SELECT sgm.*, b.estimated_cost
     FROM shared_group_members sgm
     JOIN bookings b ON b.id = sgm.booking_id
     WHERE sgm.shared_group_id = $1 AND sgm.status = $2
     ORDER BY sgm.joined_at ASC`,
    [groupId, MEMBER_STATUS.ACTIVE],
  );
  return rows;
}

async function recalculateAndPersistCosts(client, groupId) {
  const { rows: groupRows } = await client.query(
    `SELECT * FROM shared_groups WHERE id = $1 FOR UPDATE`,
    [groupId],
  );
  const group = groupRows[0];
  if (!group) return;

  const members = await getActiveMembers(client, groupId);
  const totalCost = group.total_cost ?? computeGroupTotalCost(members);
  const splits = splitCostProportionally(totalCost, members);

  for (const split of splits) {
    await client.query(
      `UPDATE shared_group_members SET allocated_cost = $1 WHERE booking_id = $2`,
      [split.allocatedCost, split.bookingId],
    );
    await client.query(
      `UPDATE bookings SET estimated_cost = $1 WHERE id = $2`,
      [split.allocatedCost, split.bookingId],
    );
  }

  await client.query(
    `UPDATE shared_groups SET total_cost = $1 WHERE id = $2`,
    [totalCost, groupId],
  );
}

async function updateGroupCapacityStatus(client, groupId) {
  const { rows } = await client.query(
    `SELECT total_capacity_kg, used_capacity_kg, status FROM shared_groups WHERE id = $1 FOR UPDATE`,
    [groupId],
  );
  const group = rows[0];
  const newStatus = deriveGroupStatus(
    group.total_capacity_kg,
    group.used_capacity_kg,
    group.status,
  );

  if (newStatus !== group.status && OPEN_GROUP_STATUSES.includes(group.status)) {
    await client.query(`UPDATE shared_groups SET status = $1 WHERE id = $2`, [newStatus, groupId]);
  }
}

async function setBookingSharedMatching(client, bookingId, actorId, groupId, note) {
  const { rows } = await client.query(`SELECT status FROM bookings WHERE id = $1`, [bookingId]);
  const currentStatus = rows[0]?.status;

  if (currentStatus && currentStatus !== BOOKING_STATUS.SHARED_MATCHING) {
    await client.query(
      `UPDATE bookings SET status = $1, shared_group_id = $2 WHERE id = $3`,
      [BOOKING_STATUS.SHARED_MATCHING, groupId, bookingId],
    );
    await client.query(
      `INSERT INTO booking_timeline (booking_id, from_status, to_status, note, actor_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        bookingId,
        currentStatus,
        BOOKING_STATUS.SHARED_MATCHING,
        note,
        actorId,
        JSON.stringify({ shared_group_id: groupId }),
      ],
    );
  } else {
    await client.query(
      `UPDATE bookings SET shared_group_id = $1 WHERE id = $2`,
      [groupId, bookingId],
    );
  }
}

async function addMemberToGroup(client, { groupId, booking, actorId }) {
  const cargoWeight = Number(booking.cargo_weight_kg);

  const { rows: groupRows } = await client.query(
    `SELECT * FROM shared_groups WHERE id = $1 FOR UPDATE`,
    [groupId],
  );
  const group = groupRows[0];

  if (!group) throw createError(404, 'Shared group not found');
  if (!OPEN_GROUP_STATUSES.includes(group.status)) {
    throw createError(409, `Group is '${group.status}' and not accepting new members`);
  }
  if (!matchesGroupCriteria(booking, group)) {
    throw createError(409, 'Booking does not match group route or date');
  }
  if (!canAccommodate(group.total_capacity_kg, group.used_capacity_kg, cargoWeight)) {
    throw createError(409, 'Insufficient truck capacity in this group');
  }

  const newUsed = roundKg(Number(group.used_capacity_kg) + cargoWeight);

  await client.query(
    `INSERT INTO shared_group_members (shared_group_id, booking_id, farmer_id, cargo_weight_kg)
     VALUES ($1, $2, $3, $4)`,
    [groupId, booking.id, booking.farmer_id, cargoWeight],
  );

  await client.query(
    `UPDATE shared_groups SET used_capacity_kg = $1 WHERE id = $2`,
    [newUsed, groupId],
  );

  await setBookingSharedMatching(
    client,
    booking.id,
    actorId,
    groupId,
    `Joined shared truck group (${cargoWeight} kg)`,
  );

  await recalculateAndPersistCosts(client, groupId);
  await updateGroupCapacityStatus(client, groupId);

  return getSharedGroupById(groupId, client);
}

async function createSharedGroup(client, booking, { truckCapacityKg, truckId } = {}) {
  const route = buildRouteKey(booking);
  const capacity = truckCapacityKg ?? DEFAULT_TRUCK_CAPACITY_KG;
  const cargoWeight = Number(booking.cargo_weight_kg);

  if (cargoWeight > capacity) {
    throw createError(409, `Cargo weight (${cargoWeight} kg) exceeds truck capacity (${capacity} kg)`);
  }

  const { rows } = await client.query(
    `INSERT INTO shared_groups (
       truck_id, start_location, end_location,
       start_location_key, end_location_key, scheduled_date,
       total_capacity_kg, used_capacity_kg, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${GROUP_COLUMNS}`,
    [
      truckId ?? null,
      booking.start_location,
      booking.end_location,
      route.startLocationKey,
      route.endLocationKey,
      route.scheduledDate,
      capacity,
      cargoWeight,
      deriveGroupStatus(capacity, cargoWeight),
    ],
  );

  const group = rows[0];

  await client.query(
    `INSERT INTO shared_group_members (shared_group_id, booking_id, farmer_id, cargo_weight_kg)
     VALUES ($1, $2, $3, $4)`,
    [group.id, booking.id, booking.farmer_id, cargoWeight],
  );

  await setBookingSharedMatching(
    client,
    booking.id,
    booking.farmer_id,
    group.id,
    'Created new shared truck group',
  );

  await recalculateAndPersistCosts(client, group.id);

  return getSharedGroupById(group.id, client);
}

async function findCompatibleGroups(client, booking) {
  const route = buildRouteKey(booking);

  const { rows } = await client.query(
    `SELECT ${GROUP_COLUMNS}
     FROM shared_groups
     WHERE start_location_key = $1
       AND end_location_key = $2
       AND scheduled_date = $3
       AND status = 'open'
     ORDER BY used_capacity_kg ASC, created_at ASC
     FOR UPDATE`,
    [route.startLocationKey, route.endLocationKey, route.scheduledDate],
  );

  return rows.filter(group =>
    canAccommodate(group.total_capacity_kg, group.used_capacity_kg, booking.cargo_weight_kg),
  );
}

export async function getSharedGroupById(groupId, client = null) {
  const exec = client ?? { query };
  const { rows } = await exec.query(
    `SELECT ${GROUP_COLUMNS} FROM shared_groups WHERE id = $1`,
    [groupId],
  );

  if (!rows[0]) throw createError(404, 'Shared group not found');

  const members = await getActiveMembers(client, groupId);
  const mapped = mapGroup(rows[0]);
  const costSplit = getCostSplitForGroup(mapped, members);

  return {
    ...mapped,
    members: members.map(mapMember),
    member_count: members.length,
    cost_split: costSplit,
  };
}

export function getCostSplitForGroup(group, members) {
  const totalCost = group.total_cost ?? computeGroupTotalCost(members);
  const splits = splitCostProportionally(totalCost, members);
  return {
    totalCost,
    totalWeightKg: roundKg(members.reduce((s, m) => s + Number(m.cargo_weight_kg), 0)),
    splits,
  };
}

export async function getRemainingCapacity(groupId) {
  const group = await getSharedGroupById(groupId);
  return {
    groupId: group.id,
    totalCapacityKg: group.total_capacity_kg,
    usedCapacityKg: group.used_capacity_kg,
    remainingCapacityKg: group.remaining_capacity_kg,
    status: group.status,
    memberCount: group.member_count,
  };
}

export async function findMatchesForBooking(bookingId, { farmerId } = {}) {
  return withTransaction(async client => {
    const booking = await getBookingForMatching(client, bookingId, farmerId);
    validateBookingForMatching(booking);

    const compatible = await findCompatibleGroups(client, booking);

    return {
      bookingId,
      criteria: {
        pickup: booking.start_location,
        destination: booking.end_location,
        date: toScheduledDate(booking.scheduled_at),
        cargoWeightKg: Number(booking.cargo_weight_kg),
      },
      matches: compatible.map(g => ({
        ...mapGroup(g),
        availableCapacityKg: calculateRemainingCapacity(g.total_capacity_kg, g.used_capacity_kg),
      })),
    };
  });
}

export async function autoMatchBooking(bookingId, { farmerId, actorId, truckCapacityKg, truckId } = {}) {
  return withTransaction(async client => {
    const booking = await getBookingForMatching(client, bookingId, farmerId);
    validateBookingForMatching(booking);

    if (booking.shared_group_id) {
      throw createError(409, 'Booking is already in a shared group');
    }

    const compatible = await findCompatibleGroups(client, booking);

    if (compatible.length > 0) {
      const group = await addMemberToGroup(client, {
        groupId: compatible[0].id,
        booking,
        actorId: actorId ?? booking.farmer_id,
      });
      return { action: 'joined', group };
    }

    const group = await createSharedGroup(client, booking, { truckCapacityKg, truckId });
    return { action: 'created', group };
  });
}

export async function joinSharedGroup(groupId, bookingId, { farmerId, actorId } = {}) {
  return withTransaction(async client => {
    const booking = await getBookingForMatching(client, bookingId, farmerId);
    validateBookingForMatching(booking);

    if (booking.shared_group_id) {
      throw createError(409, 'Booking is already in a shared group');
    }

    const group = await addMemberToGroup(client, {
      groupId,
      booking,
      actorId: actorId ?? booking.farmer_id,
    });

    return { action: 'joined', group };
  });
}

export async function leaveSharedGroup(groupId, bookingId, { farmerId, actorId } = {}) {
  return withTransaction(async client => {
    const booking = await getBookingForMatching(client, bookingId, farmerId);

    if (booking.shared_group_id !== groupId) {
      throw createError(409, 'Booking is not a member of this shared group');
    }

    const { rows: memberRows } = await client.query(
      `SELECT * FROM shared_group_members
       WHERE shared_group_id = $1 AND booking_id = $2 AND status = $3
       FOR UPDATE`,
      [groupId, bookingId, MEMBER_STATUS.ACTIVE],
    );

    if (!memberRows[0]) throw createError(404, 'Active membership not found');

    const member = memberRows[0];
    const cargoWeight = Number(member.cargo_weight_kg);

    await client.query(
      `UPDATE shared_group_members SET status = $1, left_at = NOW() WHERE id = $2`,
      [MEMBER_STATUS.LEFT, member.id],
    );

    const { rows: groupRows } = await client.query(
      `SELECT * FROM shared_groups WHERE id = $1 FOR UPDATE`,
      [groupId],
    );
    const group = groupRows[0];
    const newUsed = roundKg(Math.max(0, Number(group.used_capacity_kg) - cargoWeight));

    await client.query(
      `UPDATE shared_groups SET used_capacity_kg = $1, status = $2 WHERE id = $3`,
      [newUsed, SHARED_GROUP_STATUS.OPEN, groupId],
    );

    await client.query(
      `UPDATE bookings SET shared_group_id = NULL, status = $1 WHERE id = $2`,
      [BOOKING_STATUS.SEARCHING_TRUCK, bookingId],
    );

    await client.query(
      `INSERT INTO booking_timeline (booking_id, from_status, to_status, note, actor_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        bookingId,
        BOOKING_STATUS.SHARED_MATCHING,
        BOOKING_STATUS.SEARCHING_TRUCK,
        'Left shared truck group',
        actorId ?? farmerId,
        JSON.stringify({ shared_group_id: groupId }),
      ],
    );

    const remaining = await getActiveMembers(client, groupId);

    if (remaining.length === 0) {
      await client.query(
        `UPDATE shared_groups SET status = $1 WHERE id = $2`,
        [SHARED_GROUP_STATUS.CANCELLED, groupId],
      );
      return { action: 'left', groupCancelled: true, groupId };
    }

    await recalculateAndPersistCosts(client, groupId);
    await updateGroupCapacityStatus(client, groupId);

    const updatedGroup = await getSharedGroupById(groupId, client);
    return { action: 'left', groupCancelled: false, group: updatedGroup };
  });
}

export async function listSharedGroups({ status, date, pickup, destination, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (date) {
    conditions.push(`scheduled_date = $${idx++}`);
    params.push(date);
  }
  if (pickup) {
    conditions.push(`start_location_key = $${idx++}`);
    params.push(locationKey(pickup));
  }
  if (destination) {
    conditions.push(`end_location_key = $${idx++}`);
    params.push(locationKey(destination));
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM shared_groups ${where}`, params);
  const { rows } = await query(
    `SELECT ${GROUP_COLUMNS} FROM shared_groups ${where}
     ORDER BY scheduled_date ASC, created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset],
  );

  return {
    groups: rows.map(mapGroup),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

function validateBookingForMatching(booking) {
  if (!booking.wants_shared) {
    throw createError(409, 'Booking is not marked for shared transport');
  }
  if (!booking.cargo_weight_kg || Number(booking.cargo_weight_kg) <= 0) {
    throw createError(422, 'cargo_weight_kg is required for shared matching');
  }
  if (!MATCHABLE_BOOKING_STATUSES.includes(booking.status)) {
    throw createError(409, `Booking status '${booking.status}' is not eligible for shared matching`);
  }
}
