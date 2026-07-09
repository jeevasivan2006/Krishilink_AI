import { cn } from '@/utils';

/**
 * Responsive page wrapper that constrains content width and adds
 * consistent horizontal padding.
 *
 * @param {'default'|'narrow'|'wide'|'full'}  size
 * @param {boolean}  noPadding  – removes default vertical padding
 */
const SIZE_CLASS = {
  narrow:  'max-w-2xl',
  default: 'max-w-7xl',
  wide:    'max-w-screen-2xl',
  full:    'max-w-none',
};

export default function PageContainer({
  children,
  className,
  size      = 'default',
  noPadding = false,
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        !noPadding && 'py-8 sm:py-10',
        SIZE_CLASS[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
