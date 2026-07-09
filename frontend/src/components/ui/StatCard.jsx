import { motion } from 'framer-motion';
import { cn } from '@/utils';

/**
 * Dashboard KPI card.
 *
 * @prop {React.ReactNode} icon
 * @prop {string}          label
 * @prop {string|number}   value
 * @prop {string}          [trend]       e.g. '+12%'
 * @prop {'up'|'down'}     [trendDir]
 * @prop {string}          [iconBg]      Tailwind bg class
 * @prop {string}          [iconColor]   Tailwind text class
 * @prop {boolean}         [loading]
 */
export default function StatCard({
  icon,
  label,
  value,
  trend,
  trendDir = 'up',
  iconBg    = 'bg-primary-50 dark:bg-primary-900/20',
  iconColor = 'text-primary-600 dark:text-primary-400',
  loading   = false,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100',
        'dark:border-gray-700 shadow-card p-5',
        className,
      )}
    >
      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-700" />
          <div className="h-7 w-20 rounded-lg bg-gray-100 dark:bg-gray-700" />
          <div className="h-4 w-28 rounded-lg bg-gray-100 dark:bg-gray-700" />
        </div>
      ) : (
        <>
          <div className={cn('inline-flex h-10 w-10 rounded-xl items-center justify-center mb-3', iconBg, iconColor)}>
            {icon}
          </div>
          <p className="text-2xl font-display font-bold text-gray-900 dark:text-white leading-none">
            {value ?? '—'}
          </p>
          <div className="flex items-center justify-between mt-1 gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            {trend && (
              <span className={cn(
                'text-xs font-semibold',
                trendDir === 'up'   ? 'text-emerald-600' : 'text-red-500',
              )}>
                {trendDir === 'up' ? '▲' : '▼'} {trend}
              </span>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
