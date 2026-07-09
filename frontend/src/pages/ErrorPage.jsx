import { useNavigate, useRouteError } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import Button from '@/components/ui/Button';

/**
 * Global error boundary page.
 * Used as React Router's `errorElement` on the root route.
 */
export default function ErrorPage() {
  usePageTitle('Something went wrong');
  const navigate    = useNavigate();
  const routeError  = useRouteError();

  const message =
    routeError?.statusText ||
    routeError?.message    ||
    'An unexpected error occurred.';

  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md"
      >
        {/* Icon */}
        <div className="inline-flex h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-900/20 items-center justify-center mb-6 mx-auto">
          <AlertTriangle size={36} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
          We ran into an unexpected problem. This has been logged and our team will look into it.
        </p>

        {isDev && routeError && (
          <pre className="text-left text-xs bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-6 overflow-x-auto text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            {message}
            {'\n'}
            {routeError?.stack ?? ''}
          </pre>
        )}

        {!isDev && (
          <p className="text-sm text-gray-400 mb-6 font-mono">
            Error: {message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
          <Button
            leftIcon={<Home size={16} />}
            onClick={() => navigate(ROUTES.HOME, { replace: true })}
          >
            Back to home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
