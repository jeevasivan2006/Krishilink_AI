export const BOOKING_STATUS = {
  PENDING: 'pending',
  SEARCHING_TRUCK: 'searching_truck',
  SHARED_MATCHING: 'shared_matching',
  ACCEPTED: 'accepted',
  PICKUP_STARTED: 'pickup_started',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ALL_STATUSES = Object.values(BOOKING_STATUS);

export const TERMINAL_STATUSES = [BOOKING_STATUS.DELIVERED, BOOKING_STATUS.CANCELLED];

/**
 * Valid status transitions (finite state machine).
 * Terminal states have no outgoing transitions.
 */
export const ALLOWED_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.SEARCHING_TRUCK, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.SEARCHING_TRUCK]: [BOOKING_STATUS.SHARED_MATCHING, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.SHARED_MATCHING]: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.ACCEPTED]: [BOOKING_STATUS.PICKUP_STARTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.PICKUP_STARTED]: [BOOKING_STATUS.IN_TRANSIT, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.IN_TRANSIT]: [BOOKING_STATUS.DELIVERED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.DELIVERED]: [],
  [BOOKING_STATUS.CANCELLED]: [],
};

export function isValidStatus(status) {
  return ALL_STATUSES.includes(status);
}

export function isTerminalStatus(status) {
  return TERMINAL_STATUSES.includes(status);
}

export function isTransitionAllowed(fromStatus, toStatus) {
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

export function assertTransitionAllowed(fromStatus, toStatus) {
  if (!isValidStatus(toStatus)) {
    const err = new Error(`Invalid status: ${toStatus}`);
    err.status = 422;
    throw err;
  }
  if (fromStatus === toStatus) {
    const err = new Error('Booking is already in the requested status');
    err.status = 409;
    throw err;
  }
  if (!isTransitionAllowed(fromStatus, toStatus)) {
    const err = new Error(
      `Cannot transition from '${fromStatus}' to '${toStatus}'`,
    );
    err.status = 409;
    throw err;
  }
}
