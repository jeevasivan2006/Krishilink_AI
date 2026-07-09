import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

/**
 * Simple numeric pagination bar.
 *
 * @prop {number}   page        Current page (1-indexed)
 * @prop {number}   totalPages
 * @prop {Function} onPageChange  (newPage: number) => void
 */
export default function Pagination({ page, totalPages, onPageChange, className }) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <PagBtn
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </PagBtn>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">…</span>
        ) : (
          <PagBtn
            key={p}
            active={p === page}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </PagBtn>
        ),
      )}

      <PagBtn
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </PagBtn>
    </div>
  );
}

function PagBtn({ children, active, disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'h-8 min-w-[2rem] px-2 rounded-lg text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Build a compact page list with ellipsis. */
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1].filter(p => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}
