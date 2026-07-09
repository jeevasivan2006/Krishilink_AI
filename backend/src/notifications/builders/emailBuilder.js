import { DEFAULT_SENDER } from '../constants/notificationTypes.js';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Standard email payload structure (provider-agnostic).
 */
export function buildEmailPayload({
  to,
  subject,
  textBody,
  htmlBody,
  from,
  replyTo,
  metadata = {},
}) {
  const sender = from ?? DEFAULT_SENDER.email;
  const text = String(textBody).trim();
  const html = htmlBody ?? wrapHtmlTemplate(subject, text);

  return {
    channel: 'email',
    to,
    from: {
      name: sender.name,
      address: sender.address,
    },
    replyTo: replyTo ?? sender.address,
    subject: String(subject).trim(),
    textBody: text,
    htmlBody: html,
    headers: {
      'X-KrishiLink-Category': metadata.category ?? 'general',
      'X-KrishiLink-Event': metadata.eventType ?? 'unknown',
    },
    metadata: {
      ...metadata,
      format: 'email-v1',
    },
  };
}

export function wrapHtmlTemplate(subject, textBody) {
  const safeSubject = escapeHtml(subject);
  const paragraphs = String(textBody)
    .split('\n')
    .filter(Boolean)
    .map(line => `<p style="margin:0 0 12px;font-size:15px;color:#333;">${escapeHtml(line)}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${safeSubject}</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e0e0e0;">
    <div style="margin-bottom:24px;">
      <strong style="font-size:18px;color:#2e7d32;">KrishiLink</strong>
    </div>
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a1a;">${safeSubject}</h2>
    ${paragraphs}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#888;margin:0;">Intelligent Farm Produce Transportation</p>
  </div>
</body>
</html>`;
}
