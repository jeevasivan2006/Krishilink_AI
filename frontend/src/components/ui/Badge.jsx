import { cn } from '@/utils';

const VARIANTS = {
  green:  'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  yellow: 'bg-yellow-100  text-yellow-700  dark:bg-yellow-900/30  dark:text-yellow-400',
  red:    'bg-red-100     text-red-700     dark:bg-red-900/30     dark:text-red-400',
  blue:   'bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-400',
  gray:   'bg-gray-100    text-gray-600    dark:bg-gray-700       dark:text-gray-300',
  purple: 'bg-purple-100  text-purple-700  dark:bg-purple-900/30  dark:text-purple-400',
  orange: 'bg-orange-100  text-orange-700  dark:bg-orange-900/30  dark:text-orange-400',
};

/**
 * Small inline status / label badge.
 */
export default function Badge({ children, variant = 'gray', dot = false, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', {
            'bg-primary-500': variant === 'green',
            'bg-yellow-500':  variant === 'yellow',
            'bg-red-500':     variant === 'red',
            'bg-blue-500':    variant === 'blue',
            'bg-gray-400':    variant === 'gray',
            'bg-purple-500':  variant === 'purple',
            'bg-orange-500':  variant === 'orange',
          })}
        />
      )}
      {children}
    </span>
  );
}
