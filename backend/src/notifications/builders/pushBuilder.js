import { DEFAULT_SENDER } from '../constants/notificationTypes.js';

/**
 * Standard push notification payload structure (FCM/APNs-agnostic).
 */
export function buildPushPayload({
  title,
  body,
  data = {},
  badge,
  sound = 'default',
  priority = 'normal',
  clickAction,
  imageUrl,
  metadata = {},
}) {
  return {
    channel: 'push',
    notification: {
      title: String(title).trim(),
      body: String(body).trim(),
      imageUrl: imageUrl ?? null,
      sound,
      badge: badge ?? null,
    },
    data: {
      ...data,
      clickAction: clickAction ?? data.clickAction ?? null,
      timestamp: new Date().toISOString(),
    },
    android: {
      priority: priority === 'high' ? 'high' : 'normal',
      channelId: metadata.category ?? 'default',
      clickAction: clickAction ?? `/notifications/${data.notificationId ?? ''}`,
    },
    apns: {
      priority: priority === 'high' ? 10 : 5,
      sound,
      badge: badge ?? null,
    },
    metadata: {
      appId: DEFAULT_SENDER.push.appId,
      ...metadata,
      format: 'push-v1',
    },
  };
}
