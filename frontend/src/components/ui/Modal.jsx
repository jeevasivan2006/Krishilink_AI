import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { useOutsideClick } from '@/hooks';
import Button from './Button';

const SIZES = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full mx-4',
};

/**
 * Accessible, animated modal dialog with portal rendering.
 *
 * Props:
 *   isOpen      {boolean}
 *   onClose     {() => void}
 *   title       {string}
 *   description {string}        optional subtitle
 *   size        {'sm'|'md'|'lg'|'xl'|'2xl'|'full'}
 *   closeOnOverlay {boolean}    default true
 *   showClose   {boolean}       default true
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size         = 'md',
  closeOnOverlay = true,
  showClose    = true,
  children,
  footer,
  className,
}) {
  const panelRef = useRef(null);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* Outside click */
  useOutsideClick(panelRef, () => { if (closeOnOverlay) onClose(); }, isOpen);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            className={cn(
              'relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-modal',
              'flex flex-col max-h-[90dvh]',
              SIZES[size],
              className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
                <div>
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-gray-900 dark:text-white leading-snug"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="shrink-0 -mt-0.5 -mr-1"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="p-5 border-t border-gray-100 dark:border-gray-700 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
