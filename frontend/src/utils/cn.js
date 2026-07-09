import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names safely, resolving conflicts.
 * Drop-in replacement for `clsx` that also de-dupes Tailwind classes.
 *
 * @example
 * cn('px-4 py-2', condition && 'font-bold', 'px-6')
 * // → 'py-2 font-bold px-6'  (px-4 removed in favour of px-6)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
