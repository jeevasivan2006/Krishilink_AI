import { BOOKING_EVENTS } from '../constants/notificationTypes.js';

const templates = {
  [BOOKING_EVENTS.CREATED]: ctx => ({
    sms: { body: `KrishiLink: Booking #${shortId(ctx.bookingId)} created. Pickup: ${ctx.pickup}. Scheduled: ${fmtDate(ctx.scheduledAt)}.` },
    email: {
      subject: `Booking Confirmed — ${ctx.pickup} to ${ctx.destination}`,
      textBody: [
        `Your transport booking has been created.`,
        ``,
        `Booking ID: ${ctx.bookingId}`,
        `Pickup: ${ctx.pickup}`,
        `Destination: ${ctx.destination}`,
        `Scheduled: ${fmtDate(ctx.scheduledAt)}`,
        ctx.estimatedCost ? `Estimated Cost: ₹${ctx.estimatedCost}` : null,
      ].filter(Boolean).join('\n'),
    },
    push: {
      title: 'Booking Created',
      body: `Pickup from ${ctx.pickup} on ${fmtDate(ctx.scheduledAt)}`,
      data: { action: 'view_booking', bookingId: ctx.bookingId },
      clickAction: `/bookings/${ctx.bookingId}`,
    },
  }),

  [BOOKING_EVENTS.STATUS_CHANGED]: ctx => ({
    sms: { body: `KrishiLink: Booking #${shortId(ctx.bookingId)} is now "${fmtStatus(ctx.status)}".` },
    email: {
      subject: `Booking Update — ${fmtStatus(ctx.status)}`,
      textBody: `Your booking #${ctx.bookingId} status changed to ${fmtStatus(ctx.status)}.${ctx.note ? `\nNote: ${ctx.note}` : ''}`,
    },
    push: {
      title: `Booking ${fmtStatus(ctx.status)}`,
      body: ctx.note ?? `Status updated for booking #${shortId(ctx.bookingId)}`,
      data: { action: 'view_booking', bookingId: ctx.bookingId, status: ctx.status },
      priority: 'high',
      clickAction: `/bookings/${ctx.bookingId}`,
    },
  }),

  [BOOKING_EVENTS.DRIVER_ASSIGNED]: ctx => ({
    sms: { body: `KrishiLink: Driver assigned to booking #${shortId(ctx.bookingId)}. Pickup: ${ctx.pickup}.` },
    email: {
      subject: 'Driver Assigned to Your Booking',
      textBody: `A driver has been assigned to your booking.\n\nBooking: ${ctx.bookingId}\nPickup: ${ctx.pickup}\nDestination: ${ctx.destination}`,
    },
    push: {
      title: 'Driver Assigned',
      body: `A driver is assigned for pickup at ${ctx.pickup}`,
      data: { action: 'view_booking', bookingId: ctx.bookingId, driverId: ctx.driverId },
      priority: 'high',
      clickAction: `/bookings/${ctx.bookingId}`,
    },
  }),

  [BOOKING_EVENTS.CANCELLED]: ctx => ({
    sms: { body: `KrishiLink: Booking #${shortId(ctx.bookingId)} cancelled.${ctx.reason ? ` Reason: ${ctx.reason}` : ''}` },
    email: {
      subject: 'Booking Cancelled',
      textBody: `Your booking #${ctx.bookingId} has been cancelled.${ctx.reason ? `\nReason: ${ctx.reason}` : ''}`,
    },
    push: {
      title: 'Booking Cancelled',
      body: ctx.reason ?? `Booking #${shortId(ctx.bookingId)} has been cancelled`,
      data: { action: 'view_booking', bookingId: ctx.bookingId },
      clickAction: `/bookings/${ctx.bookingId}`,
    },
  }),

  [BOOKING_EVENTS.DELIVERED]: ctx => ({
    sms: { body: `KrishiLink: Booking #${shortId(ctx.bookingId)} delivered to ${ctx.destination}. Thank you!` },
    email: {
      subject: 'Delivery Completed',
      textBody: `Your shipment has been delivered.\n\nBooking: ${ctx.bookingId}\nDestination: ${ctx.destination}${ctx.finalCost ? `\nFinal Cost: ₹${ctx.finalCost}` : ''}`,
    },
    push: {
      title: 'Delivered',
      body: `Shipment delivered to ${ctx.destination}`,
      data: { action: 'view_booking', bookingId: ctx.bookingId },
      clickAction: `/bookings/${ctx.bookingId}`,
    },
  }),
};

function shortId(id) {
  return id ? String(id).slice(0, 8) : 'N/A';
}

function fmtDate(date) {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtStatus(status) {
  return String(status ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function getBookingTemplate(eventType, context) {
  const builder = templates[eventType];
  if (!builder) throw new Error(`Unknown booking notification event: ${eventType}`);
  return builder(context);
}

export { BOOKING_EVENTS };
