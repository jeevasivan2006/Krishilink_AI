import { SHARED_TRUCK_EVENTS } from '../constants/notificationTypes.js';

const templates = {
  [SHARED_TRUCK_EVENTS.GROUP_CREATED]: ctx => ({
    sms: { body: `KrishiLink: Shared truck group created for ${ctx.pickup} → ${ctx.destination} on ${fmtDate(ctx.date)}.` },
    email: {
      subject: 'Shared Truck Group Created',
      textBody: `A new shared truck group has been created.\n\nRoute: ${ctx.pickup} → ${ctx.destination}\nDate: ${fmtDate(ctx.date)}\nCapacity: ${ctx.totalCapacityKg} kg`,
    },
    push: {
      title: 'Shared Truck Group',
      body: `${ctx.pickup} → ${ctx.destination} on ${fmtDate(ctx.date)}`,
      data: { action: 'view_shared_group', groupId: ctx.groupId },
      clickAction: `/shared-groups/${ctx.groupId}`,
    },
  }),

  [SHARED_TRUCK_EVENTS.MEMBER_JOINED]: ctx => ({
    sms: { body: `KrishiLink: Farmer joined shared truck (${ctx.memberCount} members). ${ctx.remainingCapacityKg}kg capacity left.` },
    email: {
      subject: 'New Member Joined Shared Truck',
      textBody: [
        `A farmer joined your shared truck group.`,
        ``,
        `Members: ${ctx.memberCount}`,
        `Remaining capacity: ${ctx.remainingCapacityKg} kg`,
        `Your share: ₹${ctx.allocatedCost ?? 'TBD'}`,
      ].join('\n'),
    },
    push: {
      title: 'Shared Truck Updated',
      body: `${ctx.memberCount} farmers sharing — ${ctx.remainingCapacityKg}kg left`,
      data: { action: 'view_shared_group', groupId: ctx.groupId },
      clickAction: `/shared-groups/${ctx.groupId}`,
    },
  }),

  [SHARED_TRUCK_EVENTS.MEMBER_LEFT]: ctx => ({
    sms: { body: `KrishiLink: Member left shared truck group. ${ctx.memberCount} members, ${ctx.remainingCapacityKg}kg available.` },
    email: {
      subject: 'Member Left Shared Truck',
      textBody: `A member left the shared truck group.\n\nMembers remaining: ${ctx.memberCount}\nCapacity available: ${ctx.remainingCapacityKg} kg`,
    },
    push: {
      title: 'Shared Truck Updated',
      body: `Member left — ${ctx.remainingCapacityKg}kg now available`,
      data: { action: 'view_shared_group', groupId: ctx.groupId },
      clickAction: `/shared-groups/${ctx.groupId}`,
    },
  }),

  [SHARED_TRUCK_EVENTS.GROUP_FULL]: ctx => ({
    sms: { body: `KrishiLink: Shared truck group full for ${ctx.pickup} → ${ctx.destination}. Trip will be confirmed soon.` },
    email: {
      subject: 'Shared Truck Group Full',
      textBody: `The shared truck group is now full.\n\nRoute: ${ctx.pickup} → ${ctx.destination}\nMembers: ${ctx.memberCount}\nYour cost share: ₹${ctx.allocatedCost ?? 'TBD'}`,
    },
    push: {
      title: 'Shared Truck Full',
      body: `Group full — ${ctx.pickup} → ${ctx.destination}`,
      data: { action: 'view_shared_group', groupId: ctx.groupId },
      priority: 'high',
      clickAction: `/shared-groups/${ctx.groupId}`,
    },
  }),

  [SHARED_TRUCK_EVENTS.COST_UPDATED]: ctx => ({
    sms: { body: `KrishiLink: Shared truck cost updated. Your share: ₹${ctx.allocatedCost}. Group #${shortId(ctx.groupId)}.` },
    email: {
      subject: 'Shared Truck Cost Updated',
      textBody: `Cost split has been recalculated.\n\nYour share: ₹${ctx.allocatedCost}\nTotal group cost: ₹${ctx.totalCost ?? 'TBD'}`,
    },
    push: {
      title: 'Cost Updated',
      body: `Your share is now ₹${ctx.allocatedCost}`,
      data: { action: 'view_shared_group', groupId: ctx.groupId },
      clickAction: `/shared-groups/${ctx.groupId}/cost-split`,
    },
  }),

  [SHARED_TRUCK_EVENTS.MATCH_FOUND]: ctx => ({
    sms: { body: `KrishiLink: Shared truck match found! ${ctx.pickup} → ${ctx.destination} on ${fmtDate(ctx.date)}. Join to save costs.` },
    email: {
      subject: 'Shared Truck Match Found',
      textBody: [
        `A shared truck matching your route is available.`,
        ``,
        `Route: ${ctx.pickup} → ${ctx.destination}`,
        `Date: ${fmtDate(ctx.date)}`,
        `Available capacity: ${ctx.remainingCapacityKg} kg`,
        `Estimated share: ₹${ctx.estimatedCost ?? 'TBD'}`,
      ].join('\n'),
    },
    push: {
      title: 'Shared Truck Match',
      body: `Save costs on ${ctx.pickup} → ${ctx.destination}`,
      data: { action: 'view_shared_group', groupId: ctx.groupId },
      priority: 'high',
      clickAction: `/shared-groups/${ctx.groupId}`,
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

export function getSharedTruckTemplate(eventType, context) {
  const builder = templates[eventType];
  if (!builder) throw new Error(`Unknown shared truck notification event: ${eventType}`);
  return builder(context);
}

export { SHARED_TRUCK_EVENTS };
