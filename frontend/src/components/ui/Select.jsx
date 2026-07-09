import { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';

/**
 * Styled native <select> with label and error support.
 */
const Select = forwardRef(
  ({ label, error, hint, options = [], placeholder, required, id, containerClassName, className, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            className={cn(
              'w-full pl-3.5 pr-9 py-2.5 rounded-xl border bg-white text-gray-900 text-sm appearance-none',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:bg-gray-50 disabled:cursor-not-allowed',
              'transition-shadow duration-150 dark:bg-gray-800 dark:text-gray-100',
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-200 focus:ring-primary-500 dark:border-gray-600',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle size={12} className="shrink-0" />
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
