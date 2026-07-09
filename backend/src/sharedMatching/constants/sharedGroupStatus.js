export const SHARED_GROUP_STATUS = {
  OPEN: 'open',
  FULL: 'full',
  CONFIRMED: 'confirmed',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const MEMBER_STATUS = {
  ACTIVE: 'active',
  LEFT: 'left',
};

export const DEFAULT_TRUCK_CAPACITY_KG = Number(process.env.DEFAULT_TRUCK_CAPACITY_KG) || 5000;

export const MATCHABLE_BOOKING_STATUSES = ['pending', 'searching_truck', 'shared_matching'];

export const OPEN_GROUP_STATUSES = [SHARED_GROUP_STATUS.OPEN, SHARED_GROUP_STATUS.FULL];
