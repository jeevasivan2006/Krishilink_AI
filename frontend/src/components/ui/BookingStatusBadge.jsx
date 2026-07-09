import Badge from './Badge';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from '@/constants';

/**
 * Renders a coloured Badge for a booking status string.
 * @prop {string}  status   e.g. 'pending' | 'confirmed' | 'in_transit' | …
 * @prop {boolean} [dot]    Show colour dot
 */
export default function BookingStatusBadge({ status, dot = true }) {
  const label   = BOOKING_STATUS_LABEL[status] ?? status;
  const variant = BOOKING_STATUS_COLOR[status]  ?? 'gray';
  return <Badge variant={variant} dot={dot}>{label}</Badge>;
}
