import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import Button from '@/components/ui/Button';

export default function UnauthorizedPage() {
  usePageTitle('Access Denied');
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md"
      >
        <div className="inline-flex h-20 w-20 rounded-3xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center mb-6 mx-auto">
          <ShieldX size={36} className="text-orange-500" />
        </div>

        <h1 className="text-5xl font-display font-bold text-orange-500 mb-2">403</h1>
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
          Access Denied
        </h2>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          You don't have permission to view this page.
          Please contact support if you believe this is a mistake.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go back
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
