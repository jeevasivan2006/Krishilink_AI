import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

const MotionDiv = motion.div;

/**
 * Flexible card component with optional hover animation and sub-components.
 *
 * Usage:
 *   <Card>
 *     <Card.Header> … </Card.Header>
 *     <Card.Body>   … </Card.Body>
 *     <Card.Footer> … </Card.Footer>
 *   </Card>
 */
const Card = forwardRef(
  ({ children, className, hoverable = false, padding = true, animate = false, ...props }, ref) => {
    const Wrapper = animate ? MotionDiv : 'div';
    const motionProps = animate
      ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
      : {};

    return (
      <Wrapper
        ref={ref}
        className={cn(
          'bg-white rounded-2xl border border-gray-100',
          hoverable
            ? 'shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer'
            : 'shadow-card',
          padding && 'p-5',
          'dark:bg-gray-800 dark:border-gray-700',
          className,
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </Wrapper>
    );
  },
);

/* ── Sub-components ─────────────────────────────────────────────── */
function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn('mb-4 pb-4 border-b border-gray-100 dark:border-gray-700', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-gray-100 dark:border-gray-700', className)}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body   = CardBody;
Card.Footer = CardFooter;
Card.displayName = 'Card';

export default Card;
