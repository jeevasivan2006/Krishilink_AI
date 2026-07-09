import { TRIP_EVENTS } from '../constants/notificationTypes.js';

const templates = {
  [TRIP_EVENTS.STARTED]: ctx => ({
    sms: { body: `KrishiLink: Trip started for booking #${shortId(ctx.bookingId)}. Driver en route to ${ctx.pickup}.` },
    email: {
      subject: 'Trip Started',
      textBody: `Your trip has started.\n\nBooking: ${ctx.bookingId}\nPickup: ${ctx.pickup}\nDriver is on the way.`,
    },
    push: {
      title: 'Trip Started',
      body: `Driver heading to ${ctx.pickup}`,
      data: { action: 'track_trip', bookingId: ctx.bookingId },
      priority: 'high',
      clickAction: `/tracking/bookings/${ctx.bookingId}`,
    },
  }),

  [TRIP_EVENTS.PICKUP_STARTED]: ctx => ({
    sms: { body: `KrishiLink: Pickup started for #${shortId(ctx.bookingId)} at ${ctx.pickup}.` },
    email: {
      subject: 'Pickup Started',
      textBody: `Pickup has started for your booking.\n\nLocation: ${ctx.pickup}\nBooking: ${ctx.bookingId}`,
    },
    push: {
      title: 'Pickup Started',
      body: `Loading started at ${ctx.pickup}`,
      data: { action: 'track_trip', bookingId: ctx.bookingId },
      priority: 'high',
      clickAction: `/tracking/bookings/${ctx.bookingId}`,
    },
  }),

  [TRIP_EVENTS.IN_TRANSIT]: ctx => ({
    sms: { body: `KrishiLink: Shipment in transit to ${ctx.destination}. Booking #${shortId(ctx.bookingId)}.` },
    email: {
      subject: 'Shipment In Transit',
      textBody: `Your shipment is on the way.\n\nDestination: ${ctx.destination}\nBooking: ${ctx.bookingId}`,
    },
    push: {
      title: 'In Transit',
      body: `Heading to ${ctx.destination}`,
      data: { action: 'track_trip', bookingId: ctx.bookingId },
      clickAction: `/tracking/bookings/${ctx.bookingId}`,
    },
  }),

  [TRIP_EVENTS.ETA_UPDATED]: ctx => ({
    sms: { body: `KrishiLink: ETA updated — ${ctx.etaFormatted ?? `${ctx.etaMinutes}m`} for booking #${shortId(ctx.bookingId)}.` },
    email: {
      subject: 'ETA Updated',
      textBody: `Estimated arrival updated.\n\nETA: ${ctx.etaFormatted ?? `${ctx.etaMinutes} minutes`}\nDistance remaining: ${ctx.distanceRemainingKm} km`,
    },
    push: {
      title: 'ETA Updated',
      body: `Arriving in ${ctx.etaFormatted ?? `${ctx.etaMinutes}m`}`,
      data: { action: 'track_trip', bookingId: ctx.bookingId, etaMinutes: ctx.etaMinutes },
      clickAction: `/tracking/bookings/${ctx.bookingId}/eta`,
    },
  }),

  [TRIP_EVENTS.LOCATION_UPDATED]: ctx => ({
    sms: { body: `KrishiLink: Driver location updated for #${shortId(ctx.bookingId)}.${ctx.etaFormatted ? ` ETA: ${ctx.etaFormatted}.` : ''}` },
    email: {
      subject: 'Live Location Update',
      textBody: `Driver location has been updated for your trip.${ctx.etaFormatted ? `\nETA: ${ctx.etaFormatted}` : ''}`,
    },
    push: {
      title: 'Location Updated',
      body: ctx.etaFormatted ? `Driver nearby — ETA ${ctx.etaFormatted}` : 'Driver location updated',
      data: { action: 'track_trip', bookingId: ctx.bookingId },
      clickAction: `/tracking/bookings/${ctx.bookingId}`,
    },
  }),

  [TRIP_EVENTS.COMPLETED]: ctx => ({
    sms: { body: `KrishiLink: Trip completed for #${shortId(ctx.bookingId)}. Delivered to ${ctx.destination}.` },
    email: {
      subject: 'Trip Completed',
      textBody: `Trip completed successfully.\n\nBooking: ${ctx.bookingId}\nDestination: ${ctx.destination}`,
    },
    push: {
      title: 'Trip Completed',
      body: `Delivered to ${ctx.destination}`,
      data: { action: 'view_booking', bookingId: ctx.bookingId },
      clickAction: `/bookings/${ctx.bookingId}`,
    },
  }),
};

function shortId(id) {
  return id ? String(id).slice(0, 8) : 'N/A';
}

export function getTripTemplate(eventType, context) {
  const builder = templates[eventType];
  if (!builder) throw new Error(`Unknown trip notification event: ${eventType}`);
  return builder(context);
}

export { TRIP_EVENTS };
