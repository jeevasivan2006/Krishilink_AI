import { RETURN_TRIP_EVENTS } from '../constants/notificationTypes.js';

const templates = {
  [RETURN_TRIP_EVENTS.SUGGESTION_CREATED]: ctx => ({
    sms: { body: `KrishiLink: ${ctx.suggestionCount ?? 1} return load(s) found near ${ctx.currentLocation}. Open app to view.` },
    email: {
      subject: 'Return Trip Suggestions Available',
      textBody: [
        `Return load opportunities found near your current location.`,
        ``,
        `Location: ${ctx.currentLocation}`,
        `Suggestions: ${ctx.suggestionCount ?? 1}`,
        ctx.returnDestination ? `Return heading: ${ctx.returnDestination}` : null,
      ].filter(Boolean).join('\n'),
    },
    push: {
      title: 'Return Loads Found',
      body: `${ctx.suggestionCount ?? 1} return trip suggestion(s) near you`,
      data: { action: 'view_return_suggestions', completionId: ctx.completionId },
      priority: 'high',
      clickAction: `/return-trips/suggestions`,
    },
  }),

  [RETURN_TRIP_EVENTS.MATCH_FOUND]: ctx => ({
    sms: { body: `KrishiLink: Return load match! Pickup: ${ctx.pickup}. ${ctx.pickupDistanceKm}km away. Est: ₹${ctx.estimatedCost ?? 'TBD'}.` },
    email: {
      subject: 'Return Trip Match Found',
      textBody: `A return load matching your route has been found.\n\nPickup: ${ctx.pickup}\nDestination: ${ctx.destination}\nDistance: ${ctx.pickupDistanceKm} km`,
    },
    push: {
      title: 'Return Load Match',
      body: `Pickup at ${ctx.pickup} — ${ctx.pickupDistanceKm} km away`,
      data: { action: 'view_return_match', suggestionId: ctx.suggestionId, bookingId: ctx.bookingId },
      priority: 'high',
      clickAction: `/return-trips/suggestions/${ctx.suggestionId}`,
    },
  }),

  [RETURN_TRIP_EVENTS.SUGGESTION_ACCEPTED]: ctx => ({
    sms: { body: `KrishiLink: Return trip accepted. Pickup: ${ctx.pickup}. Booking #${shortId(ctx.bookingId)}.` },
    email: {
      subject: 'Return Trip Accepted',
      textBody: `You accepted a return trip load.\n\nBooking: ${ctx.bookingId}\nPickup: ${ctx.pickup}\nDestination: ${ctx.destination}`,
    },
    push: {
      title: 'Return Trip Accepted',
      body: `Pickup at ${ctx.pickup}`,
      data: { action: 'view_booking', bookingId: ctx.bookingId },
      priority: 'high',
      clickAction: `/bookings/${ctx.bookingId}`,
    },
  }),

  [RETURN_TRIP_EVENTS.SUGGESTION_REJECTED]: ctx => ({
    sms: { body: `KrishiLink: Return trip suggestion dismissed for ${ctx.pickup}.` },
    email: {
      subject: 'Return Trip Suggestion Dismissed',
      textBody: `A return trip suggestion was dismissed.\n\nPickup: ${ctx.pickup}`,
    },
    push: {
      title: 'Suggestion Dismissed',
      body: `Return load at ${ctx.pickup} dismissed`,
      data: { action: 'view_return_suggestions', suggestionId: ctx.suggestionId },
      clickAction: `/return-trips/suggestions`,
    },
  }),

  [RETURN_TRIP_EVENTS.DRIVER_AVAILABLE]: ctx => ({
    sms: { body: `KrishiLink: Driver available near ${ctx.currentLocation} for return loads on ${fmtDate(ctx.date)}.` },
    email: {
      subject: 'Driver Available for Return Load',
      textBody: `A driver is available for return trip matching.\n\nLocation: ${ctx.currentLocation}\nDate: ${fmtDate(ctx.date)}`,
    },
    push: {
      title: 'Driver Available Nearby',
      body: `Empty truck near ${ctx.currentLocation}`,
      data: { action: 'view_return_marketplace', completionId: ctx.completionId },
      clickAction: `/return-trips/availability`,
    },
  }),
};

function shortId(id) {
  return id ? String(id).slice(0, 8) : 'N/A';
}

function fmtDate(date) {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getReturnTripTemplate(eventType, context) {
  const builder = templates[eventType];
  if (!builder) throw new Error(`Unknown return trip notification event: ${eventType}`);
  return builder(context);
}

export { RETURN_TRIP_EVENTS };
