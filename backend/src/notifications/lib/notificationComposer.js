import { buildSmsPayload } from '../builders/smsBuilder.js';
import { buildEmailPayload } from '../builders/emailBuilder.js';
import { buildPushPayload } from '../builders/pushBuilder.js';
import { NOTIFICATION_CATEGORY } from '../constants/notificationTypes.js';

export function composeNotification({ sms, email, push, recipient, context, category, eventType }) {
  const channels = [];
  const payloads = {};

  if (sms && recipient.phone) {
    channels.push('sms');
    payloads.sms = buildSmsPayload({
      to: recipient.phone,
      body: sms.body,
      metadata: { category, eventType, ...context },
    });
  }

  if (email && recipient.email) {
    channels.push('email');
    payloads.email = buildEmailPayload({
      to: recipient.email,
      subject: email.subject,
      textBody: email.textBody,
      htmlBody: email.htmlBody,
      metadata: { category, eventType, ...context },
    });
  }

  if (push) {
    channels.push('push');
    payloads.push = buildPushPayload({
      title: push.title,
      body: push.body,
      data: { ...push.data, category, eventType, ...context },
      priority: push.priority ?? 'normal',
      clickAction: push.clickAction,
      badge: push.badge,
      metadata: { category, eventType },
    });
  }

  return {
    title: push?.title ?? email?.subject ?? sms?.body?.slice(0, 80) ?? 'KrishiLink Notification',
    channels,
    smsPayload: payloads.sms ?? null,
    emailPayload: payloads.email ?? null,
    pushPayload: payloads.push ?? null,
  };
}

export { NOTIFICATION_CATEGORY };
