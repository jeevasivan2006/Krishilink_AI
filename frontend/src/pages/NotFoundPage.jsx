import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Sprout } from 'lucide-react';
import { ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  usePageTitle('Page Not Found');
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        {/* Illustration */}
        <div className="relative mx-auto mb-8 w-48 h-48">
          <div className="absolute inset-0 rounded-full bg-primary-50 dark:bg-primary-900/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sprout size={64} className="text-primary-200 dark:text-primary-800" />
          </div>
          <div className="absolute top-6 right-6 flex items-center justify-center h-14 w-14 rounded-full bg-white dark:bg-gray-800 shadow-card border border-gray-100 dark:border-gray-700">
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">?</span>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-7xl font-display font-bold text-primary-600 mb-2">404</h1>
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
          Page not found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          Looks like this field hasn't been planted yet.
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
          <Link to={ROUTES.HOME}>
            <Button leftIcon={<Home size={16} />}>
              Back to home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
