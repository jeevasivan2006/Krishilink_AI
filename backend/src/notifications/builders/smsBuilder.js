import { DEFAULT_SENDER, SMS_MAX_LENGTH } from '../constants/notificationTypes.js';

function estimateSmsSegments(body) {
  const len = body.length;
  if (len <= SMS_MAX_LENGTH) return 1;
  return Math.ceil(len / 153);
}

/**
 * Standard SMS payload structure (provider-agnostic).
 */
export function buildSmsPayload({ to, body, senderId, metadata = {} }) {
  const text = String(body).trim();
  return {
    channel: 'sms',
    to,
    body: text,
    senderId: senderId ?? DEFAULT_SENDER.sms,
    encoding: 'GSM-7',
    characterCount: text.length,
    maxLength: SMS_MAX_LENGTH,
    segments: estimateSmsSegments(text),
    metadata: {
      ...metadata,
      format: 'sms-v1',
    },
  };
}
