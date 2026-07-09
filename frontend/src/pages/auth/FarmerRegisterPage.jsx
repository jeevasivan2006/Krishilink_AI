/**
 * FarmerRegisterPage.jsx  →  /register/farmer
 *
 * Fields: name · email · phone · farmName (opt) · farmLocation (opt)
 *         password · confirmPassword
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, Sprout, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { farmerRegisterSchema } from '@/utils/validators';
import { ROUTES } from '@/constants';
import { usePageTitle } from '@/hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function FarmerRegisterPage() {
  usePageTitle('Farmer Registration');
  const { register: authRegister } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(farmerRegisterSchema),
    defaultValues: {
      name: '', email: '', phone: '',
      farmName: '', farmLocation: '',
      password: '', confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...payload } = data;
      await authRegister({ ...payload, role: 'farmer' });
      toast.success('Welcome to KrishiLink! 🌾 Your farmer account is ready.');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-14 w-14 rounded-2xl bg-primary-600 flex items-center justify-center
                     shadow-lg shadow-primary-600/25"
        >
          <Sprout size={26} className="text-white" strokeWidth={1.75} />
        </motion.div>
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Create Farmer Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Join KrishiLink and connect with trusted transporters
          </p>
        </div>
      </div>

      {/* Server error */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                       bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-400">{serverError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">

        {/* ── Personal info ─────────────────────────────────────── */}
        <SectionLabel>Personal Information</SectionLabel>

        <Input
          label="Full name"
          placeholder="Ravi Kumar"
          required
          autoComplete="name"
          leftIcon={<User size={16} />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Mobile number"
          type="tel"
          placeholder="9876543210"
          required
          autoComplete="tel"
          leftIcon={<Phone size={16} />}
          hint="10-digit Indian mobile number"
          error={errors.phone?.message}
          {...register('phone')}
        />

        {/* ── Farm info (optional) ──────────────────────────────── */}
        <SectionLabel>Farm Details <span className="text-gray-400 font-normal text-xs ml-1">(optional)</span></SectionLabel>

        <Input
          label="Farm name"
          placeholder="Krishna Farms"
          leftIcon={<Sprout size={16} />}
          error={errors.farmName?.message}
          {...register('farmName')}
        />

        <Input
          label="Farm location"
          placeholder="Nashik, Maharashtra"
          leftIcon={<MapPin size={16} />}
          error={errors.farmLocation?.message}
          {...register('farmLocation')}
        />

        {/* ── Security ──────────────────────────────────────────── */}
        <SectionLabel>Password</SectionLabel>

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          required
          autoComplete="new-password"
          leftIcon={<Lock size={16} />}
          hint="Must include uppercase, lowercase, and a number"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          required
          autoComplete="new-password"
          leftIcon={<Lock size={16} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {/* Terms */}
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          By registering you agree to our{' '}
          <Link to={ROUTES.HOME} className="text-primary-600 hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link to={ROUTES.HOME} className="text-primary-600 hover:underline">Privacy Policy</Link>.
        </p>

        <Button type="submit" loading={isSubmitting} fullWidth size="lg" className="mt-1">
          {isSubmitting ? 'Creating account…' : 'Create Farmer Account 🌾'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to={ROUTES.FARMER_LOGIN} className="text-primary-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>

      <div className="flex justify-center">
        <Link
          to={ROUTES.CHOOSE_ROLE}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400
                     hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to role selection
        </Link>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">
      {children}
    </p>
  );
}
