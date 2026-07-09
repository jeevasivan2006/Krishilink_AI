import { getBookingTemplate } from '../templates/bookingTemplates.js';
import { getTripTemplate } from '../templates/tripTemplates.js';
import { getReturnTripTemplate } from '../templates/returnTripTemplates.js';
import { getSharedTruckTemplate } from '../templates/sharedTruckTemplates.js';
import {
  NOTIFICATION_CATEGORY,
  BOOKING_EVENTS,
  TRIP_EVENTS,
  RETURN_TRIP_EVENTS,
  SHARED_TRUCK_EVENTS,
} from '../constants/notificationTypes.js';

const resolvers = {
  [NOTIFICATION_CATEGORY.BOOKING]: getBookingTemplate,
  [NOTIFICATION_CATEGORY.TRIP]: getTripTemplate,
  [NOTIFICATION_CATEGORY.RETURN_TRIP]: getReturnTripTemplate,
  [NOTIFICATION_CATEGORY.SHARED_TRUCK]: getSharedTruckTemplate,
};

const validEvents = {
  [NOTIFICATION_CATEGORY.BOOKING]: Object.values(BOOKING_EVENTS),
  [NOTIFICATION_CATEGORY.TRIP]: Object.values(TRIP_EVENTS),
  [NOTIFICATION_CATEGORY.RETURN_TRIP]: Object.values(RETURN_TRIP_EVENTS),
  [NOTIFICATION_CATEGORY.SHARED_TRUCK]: Object.values(SHARED_TRUCK_EVENTS),
};

export function resolveTemplate(category, eventType, context) {
  const resolver = resolvers[category];
  if (!resolver) {
    throw new Error(`Unknown notification category: ${category}`);
  }
  if (!validEvents[category]?.includes(eventType)) {
    throw new Error(`Invalid event '${eventType}' for category '${category}'`);
  }
  return resolver(eventType, context);
}

export function listEventTypes() {
  return {
    booking: BOOKING_EVENTS,
    trip: TRIP_EVENTS,
    return_trip: RETURN_TRIP_EVENTS,
    shared_truck: SHARED_TRUCK_EVENTS,
  };
}
