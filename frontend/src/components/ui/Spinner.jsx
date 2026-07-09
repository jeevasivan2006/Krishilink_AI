import { cn } from '@/utils';

const SIZES = {
  xs:  'h-3 w-3 border',
  sm:  'h-4 w-4 border-2',
  md:  'h-6 w-6 border-2',
  lg:  'h-9 w-9 border-[3px]',
  xl:  'h-14 w-14 border-4',
};

const COLORS = {
  primary: 'border-primary-600/20 border-t-primary-600',
  white:   'border-white/30 border-t-white',
  gray:    'border-gray-300 border-t-gray-600',
};

/**
 * Circular loading spinner.
 *
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {'primary'|'white'|'gray'}  color
 * @param {string}  label - Accessible label (sr-only)
 */
export default function Spinner({
  size  = 'md',
  color = 'primary',
  label = 'Loading…',
  className,
}) {
  return (
    <div role="status" aria-label={label} className={cn('inline-flex', className)}>
      <div
        className={cn(
          'rounded-full animate-spin',
          SIZES[size],
          COLORS[color],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Full-page loading overlay.
 */
export function PageSpinner({ message = 'Loading…' }) {
  return (
    <div
      role="status"
      aria-label={message}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4
                 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm"
    >
      <Spinner size="xl" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

/**
 * Inline loading state for sections / cards.
 */
export function SectionSpinner({ message = 'Loading…', className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16',
        className,
      )}
    >
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
