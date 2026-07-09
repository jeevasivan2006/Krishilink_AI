import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';

/**
 * Accessible text input with label, error, hint, prefix/suffix icon support,
 * and built-in password reveal toggle.
 */
const Input = forwardRef(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      type     = 'text',
      required,
      className,
      containerClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType  = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId    = id || props.name;

    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              'w-full py-2.5 rounded-xl border bg-white text-gray-900 text-sm',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'transition-shadow duration-150 dark:bg-gray-800 dark:text-gray-100',
              // Padding adjustments for icons
              leftIcon  ? 'pl-10' : 'pl-3.5',
              rightIcon || isPassword ? 'pr-10' : 'pr-3.5',
              // State
              error
                ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
                : 'border-gray-200 focus:ring-primary-500 dark:border-gray-600',
              className,
            )}
            {...props}
          />

          {/* Right icon / password toggle */}
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          ) : rightIcon ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </span>
          ) : null}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1 text-xs text-red-500"
          >
            <AlertCircle size={12} className="shrink-0" />
            {error}
          </p>
        )}

        {/* Hint text */}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
