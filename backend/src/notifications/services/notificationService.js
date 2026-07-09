import createError from 'http-errors';
import { withTransaction } from '../../database/transaction.js';
import { query } from '../../database/index.js';
import { composeNotification, NOTIFICATION_CATEGORY } from '../lib/notificationComposer.js';
import { resolveTemplate, listEventTypes } from '../lib/templateResolver.js';
import { NOTIFICATION_STATUS } from '../constants/notificationTypes.js';

function mapNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    eventType: row.event_type,
    title: row.title,
    channels: row.channels ?? [],
    sms: row.sms_payload,
    email: row.email_payload,
    push: row.push_payload,
    recipient: row.recipient,
    context: row.context,
    status: row.status,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function persistNotification(client, {
  userId,
  category,
  eventType,
  composed,
  recipient,
  context,
}) {
  const { rows } = await client.query(
    `INSERT INTO notifications (
       user_id, category, event_type, title, channels,
       sms_payload, email_payload, push_payload,
       recipient, context, status
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      userId,
      category,
      eventType,
      composed.title,
      composed.channels,
      composed.smsPayload ? JSON.stringify(composed.smsPayload) : null,
      composed.emailPayload ? JSON.stringify(composed.emailPayload) : null,
      composed.pushPayload ? JSON.stringify(composed.pushPayload) : null,
      JSON.stringify(recipient),
      JSON.stringify(context),
      NOTIFICATION_STATUS.QUEUED,
    ],
  );
  return mapNotification(rows[0]);
}

export async function sendNotification({ userId, category, eventType, context, recipient, channels }) {
  return withTransaction(async client => {
    if (!recipient || (!recipient.phone && !recipient.email && !recipient.deviceToken)) {
      throw createError(400, 'Recipient must include at least one of: phone, email, deviceToken');
    }

    const template = resolveTemplate(category, eventType, context);
    const composed = composeNotification({
      sms: channels?.includes('sms') !== false ? template.sms : null,
      email: channels?.includes('email') !== false ? template.email : null,
      push: channels?.includes('push') !== false ? template.push : null,
      recipient,
      context,
      category,
      eventType,
    });

    if (!composed.channels.length) {
      throw createError(400, 'No notification channels could be composed for the given recipient');
    }

    return persistNotification(client, {
      userId,
      category,
      eventType,
      composed,
      recipient,
      context,
    });
  });
}

export async function sendBookingNotification(payload) {
  return sendNotification({
    userId: payload.user_id,
    category: NOTIFICATION_CATEGORY.BOOKING,
    eventType: payload.event_type,
    context: payload.context,
    recipient: payload.recipient,
    channels: payload.channels,
  });
}

export async function sendTripNotification(payload) {
  return sendNotification({
    userId: payload.user_id,
    category: NOTIFICATION_CATEGORY.TRIP,
    eventType: payload.event_type,
    context: payload.context,
    recipient: payload.recipient,
    channels: payload.channels,
  });
}

export async function sendReturnTripAlert(payload) {
  return sendNotification({
    userId: payload.user_id,
    category: NOTIFICATION_CATEGORY.RETURN_TRIP,
    eventType: payload.event_type,
    context: payload.context,
    recipient: payload.recipient,
    channels: payload.channels,
  });
}

export async function sendSharedTruckAlert(payload) {
  return sendNotification({
    userId: payload.user_id,
    category: NOTIFICATION_CATEGORY.SHARED_TRUCK,
    eventType: payload.event_type,
    context: payload.context,
    recipient: payload.recipient,
    channels: payload.channels,
  });
}

export async function previewNotification({ category, eventType, context, recipient }) {
  const template = resolveTemplate(category, eventType, context);
  const composed = composeNotification({
    sms: template.sms,
    email: template.email,
    push: template.push,
    recipient: recipient ?? { phone: '+910000000000', email: 'user@example.com' },
    context,
    category,
    eventType,
  });

  return {
    category,
    eventType,
    title: composed.title,
    channels: composed.channels,
    sms: composed.smsPayload,
    email: composed.emailPayload,
    push: composed.pushPayload,
  };
}

export async function listNotifications({ userId, category, unreadOnly, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const conditions = ['user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }
  if (unreadOnly) {
    conditions.push('read_at IS NULL');
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM notifications ${where}`, params);
  const { rows } = await query(
    `SELECT id, user_id, category, event_type, title, channels, status, read_at, created_at
     FROM notifications ${where}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset],
  );

  return {
    notifications: rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      category: r.category,
      eventType: r.event_type,
      title: r.title,
      channels: r.channels,
      status: r.status,
      readAt: r.read_at,
      createdAt: r.created_at,
    })),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

export async function getNotificationById(notificationId, userId) {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
    [notificationId, userId],
  );
  if (!rows[0]) throw createError(404, 'Notification not found');
  return mapNotification(rows[0]);
}

export async function markAsRead(notificationId, userId) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `UPDATE notifications
       SET read_at = NOW(), status = $1
       WHERE id = $2 AND user_id = $3 AND read_at IS NULL
       RETURNING *`,
      [NOTIFICATION_STATUS.READ, notificationId, userId],
    );
    if (!rows[0]) throw createError(404, 'Notification not found or already read');
    return mapNotification(rows[0]);
  });
}

export async function markAllAsRead(userId) {
  const { rowCount } = await query(
    `UPDATE notifications SET read_at = NOW(), status = $1
     WHERE user_id = $2 AND read_at IS NULL`,
    [NOTIFICATION_STATUS.READ, userId],
  );
  return { markedRead: rowCount };
}

export async function deleteNotification(notificationId, userId) {
  return withTransaction(async client => {
    const { rowCount } = await client.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
    if (rowCount === 0) throw createError(404, 'Notification not found');
    return { deleted: rowCount };
  });
}

export function getSupportedEvents() {
  return listEventTypes();
}
