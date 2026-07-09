/**
 * DriverProfilePage.jsx  →  /driver/profile
 *
 * Displays the authenticated driver's profile, vehicle info,
 * and trip statistics from the API.
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Hash, FileText,
  Truck, CheckCircle2, TrendingUp, Calendar, Star,
} from 'lucide-react';
import { getDriverDashboard } from '@/api/driver.api';
import { getMe } from '@/api/auth.api';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks';
import { formatDate, formatCurrency, formatPhone } from '@/utils/formatters';
import { cn } from '@/utils';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import { SectionSpinner } from '@/components/ui/Spinner';

export default function DriverProfilePage() {
  usePageTitle('My Profile');
  const { user: authUser } = useAuth();

  /* Get full profile from /admin/auth/me + dashboard for stats */
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['driver', 'me'],
    queryFn:  getMe,
    staleTime: 5 * 60_000,
  });

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['driver', 'dashboard'],
    queryFn:  getDriverDashboard,
    staleTime: 60_000,
  });

  const profile = { ...authUser, ...meData };
  const stats   = dashData?.stats ?? {};
  const isLoading = meLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <SectionSpinner message="Loading profile…" />
      </PageContainer>
    );
  }

  const statCards = [
    { label: 'Total Trips',   value: stats.total_trips     ?? '—', icon: <Truck size={18} />,       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20'     },
    { label: 'Completed',     value: stats.completed_trips ?? '—', icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Earned',  value: stats.total_earned ? formatCurrency(stats.total_earned) : '—', icon: <TrendingUp size={18} />, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Member Since',  value: formatDate(profile.created_at), icon: <Calendar size={18} />,   color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-gray-700/50'    },
  ];

  const rating = profile.rating ?? stats.rating;

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Your account information and vehicle details.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Avatar + identity ─────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Avatar card */}
          <Card className="flex flex-col items-center text-center p-8 gap-4">
            <div className="h-20 w-20 rounded-3xl bg-earth-600 flex items-center justify-center
                            shadow-lg shadow-earth-600/20">
              <span className="font-display font-bold text-3xl text-white">
                {profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'D'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">
                {profile.name ?? '—'}
              </h2>
              <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold
                               px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20
                               text-amber-700 dark:text-amber-400">
                🚛 Driver / Lorry Owner
              </span>
            </div>

            {/* Rating */}
            {rating && (
              <div className="flex items-center gap-1.5 text-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={cn(
                      i < Math.round(rating)
                        ? 'fill-secondary-400 text-secondary-400'
                        : 'text-gray-300 dark:text-gray-600',
                    )}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-0.5">
                  {Number(rating).toFixed(1)}
                </span>
              </div>
            )}

            <div className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full',
              profile.status === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500',
            )}>
              <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                profile.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400',
              )} />
              {profile.status === 'active' ? 'Active' : (profile.status ?? 'Unknown')}
            </div>
          </Card>

          {/* Contact */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contact Information
              </h3>
            </Card.Header>
            <Card.Body className="flex flex-col gap-3.5">
              <ProfileField icon={<Mail size={15} />}  label="Email"  value={profile.email} />
              <ProfileField icon={<Phone size={15} />} label="Mobile" value={formatPhone(profile.phone)} />
            </Card.Body>
          </Card>
        </div>

        {/* ── Right: Stats + details ──────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(({ label, value, icon, color, bg }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4 flex flex-col gap-2">
                  <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', bg, color)}>
                    {icon}
                  </div>
                  <p className="text-lg font-display font-bold text-gray-900 dark:text-white leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Account details */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <User size={14} className="text-primary-500" /> Account Details
              </h3>
            </Card.Header>
            <Card.Body className="grid sm:grid-cols-2 gap-4">
              <ProfileField label="Full name"  value={profile.name} />
              <ProfileField label="Role"       value="Driver / Lorry Owner" />
              <ProfileField label="Account ID" value={profile.id ? `${profile.id.slice(0, 8)}…` : '—'} mono />
              <ProfileField label="Joined"     value={formatDate(profile.created_at)} />
            </Card.Body>
          </Card>

          {/* Vehicle details */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Truck size={14} className="text-primary-500" /> Vehicle Information
              </h3>
            </Card.Header>
            <Card.Body className="grid sm:grid-cols-2 gap-4">
              <ProfileField
                icon={<Truck size={15} />}
                label="Vehicle type"
                value={profile.vehicle_type ?? '—'}
              />
              <ProfileField
                icon={<Hash size={15} />}
                label="Vehicle number"
                value={profile.vehicle_number ?? '—'}
                mono
              />
              <ProfileField
                icon={<FileText size={15} />}
                label="License number"
                value={profile.license_number ?? '—'}
                mono
              />
              <ProfileField
                label="Availability"
                value={profile.availability
                  ? profile.availability.charAt(0).toUpperCase() + profile.availability.slice(1)
                  : '—'}
              />
            </Card.Body>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function ProfileField({ icon, label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      {icon ? (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-0.5">
          {icon}
          <span>{label}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      )}
      <span className={cn(
        'text-sm text-gray-900 dark:text-white',
        mono && 'font-mono',
        (!value || value === '—') && 'text-gray-400 dark:text-gray-600',
      )}>
        {value || '—'}
      </span>
    </div>
  );
}
