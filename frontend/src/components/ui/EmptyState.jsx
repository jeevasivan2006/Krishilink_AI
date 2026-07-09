import { cn } from '@/utils';

/**
 * Empty-state placeholder for lists and tables.
 *
 * @prop {React.ReactNode} icon
 * @prop {string}          title
 * @prop {string}          [description]
 * @prop {React.ReactNode} [action]      CTA button
 */
export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-4 text-center',
      className,
    )}>
      {icon && (
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50
                        items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-5">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
