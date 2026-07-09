/**
 * A collection of pure formatter functions used across the UI.
 */

/* ── Date / time ────────────────────────────────────────────────── */
const DATE_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day:   '2-digit',
  month: 'short',
  year:  'numeric',
});

const TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  hour:   '2-digit',
  minute: '2-digit',
  hour12: true,
});

const DATETIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day:    '2-digit',
  month:  'short',
  year:   'numeric',
  hour:   '2-digit',
  minute: '2-digit',
  hour12: true,
});

export const formatDate = (date) => {
  if (!date) return '—';
  return DATE_FORMAT.format(new Date(date));
};

export const formatTime = (date) => {
  if (!date) return '—';
  return TIME_FORMAT.format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return DATETIME_FORMAT.format(new Date(date));
};

export const timeAgo = (date) => {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    { label: 'year',   secs: 31536000 },
    { label: 'month',  secs: 2592000  },
    { label: 'week',   secs: 604800   },
    { label: 'day',    secs: 86400    },
    { label: 'hour',   secs: 3600     },
    { label: 'minute', secs: 60       },
  ];
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

/* ── Currency ───────────────────────────────────────────────────── */
const CURRENCY_FORMAT = new Intl.NumberFormat('en-IN', {
  style:                 'currency',
  currency:              'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return CURRENCY_FORMAT.format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(num);
};

/* ── Text ───────────────────────────────────────────────────────── */
export const truncate = (str, maxLen = 60) => {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (w) => capitalize(w));
};

export const slugToTitle = (slug) => {
  if (!slug) return '';
  return toTitleCase(slug.replace(/_/g, ' ').replace(/-/g, ' '));
};

/* ── Phone ──────────────────────────────────────────────────────── */
export const formatPhone = (phone) => {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
};

/* ── File size ──────────────────────────────────────────────────── */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
