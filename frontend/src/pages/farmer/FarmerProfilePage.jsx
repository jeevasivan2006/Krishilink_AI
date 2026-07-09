/**
 * FarmerProfilePage.jsx  →  /farmer/profile
 *
 * Displays the authenticated farmer's profile data from the API.
 * Shows account info, farm details, and booking statistics.
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Sprout,
  Package, CheckCircle2, TrendingUp, Calendar,
} from 'lucide-react';
import { getFarmerProfile } from '@/api/farmer.api';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks';
import { formatDate, formatCurrency, formatPhone } from '@/utils/formatters';
import { cn } from '@/utils';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import { SectionSpinner } from '@/components/ui/Spinner';

export default function FarmerProfilePage() {
  usePageTitle('My Profile');
  const { user: authUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['farmer', 'profile'],
    queryFn:  getFarmerProfile,
    staleTime: 5 * 60_000,
  });

  /* Merge API data with what we already have in auth context */
  const profile = { ...authUser, ...data?.profile, ...data?.user, ...data };

  if (isLoading) {
    return (
      <PageContainer>
        <SectionSpinner message="Loading profile…" />
      </PageContainer>
    );
  }

  const stats = data?.stats ?? {};
  const statCards = [
    { label: 'Total Bookings',   value: stats.total_bookings  ?? '—', icon: <Package size={18} />,     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20'     },
    { label: 'Delivered',        value: stats.delivered       ?? '—', icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Spent',      value: stats.total_spent ? formatCurrency(stats.total_spent) : '—', icon: <TrendingUp size={18} />, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Member Since',     value: formatDate(profile.created_at), icon: <Calendar size={18} />,   color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-gray-700/50'    },
  ];

  return (
    <PageContainer size="default">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Your account information and farming details.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Avatar + identity ────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Avatar card */}
          <Card className="flex flex-col items-center text-center p-8 gap-4">
            <div className="h-20 w-20 rounded-3xl bg-primary-600 flex items-center justify-center
                            shadow-lg shadow-primary-600/20">
              <span className="font-display font-bold text-3xl text-white">
                {profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'F'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">
                {profile.name ?? '—'}
              </h2>
              <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold
                               px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20
                               text-primary-700 dark:text-primary-400">
                🌾 Farmer
              </span>
            </div>
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
              {profile.status === 'active' ? 'Active Account' : (profile.status ?? 'Unknown')}
            </div>
          </Card>

          {/* Contact info */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contact Information
              </h3>
            </Card.Header>
            <Card.Body className="flex flex-col gap-3.5">
              <ProfileField icon={<Mail size={15} />}    label="Email"    value={profile.email} />
              <ProfileField icon={<Phone size={15} />}   label="Mobile"   value={formatPhone(profile.phone)} />
              <ProfileField
                icon={<MapPin size={15} />}
                label="Location"
                value={profile.farm_location ?? profile.location ?? '—'}
              />
            </Card.Body>
          </Card>
        </div>

        {/* ── Right: Details + stats ─────────────────────────── */}
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
              <ProfileField label="Full name"   value={profile.name} />
              <ProfileField label="Role"        value="Farmer" />
              <ProfileField label="Account ID"  value={profile.id ? `${profile.id.slice(0, 8)}…` : '—'} mono />
              <ProfileField label="Joined"      value={formatDate(profile.created_at)} />
            </Card.Body>
          </Card>

          {/* Farm details */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Sprout size={14} className="text-primary-500" /> Farm Information
              </h3>
            </Card.Header>
            <Card.Body className="grid sm:grid-cols-2 gap-4">
              <ProfileField
                label="Farm name"
                value={profile.farm_name ?? profile.farmName ?? '—'}
              />
              <ProfileField
                label="Farm location"
                value={profile.farm_location ?? profile.farmLocation ?? '—'}
              />
              <ProfileField
                label="Primary produce"
                value={profile.primary_produce ?? profile.produce_type ?? '—'}
              />
              <ProfileField
                label="Farm size"
                value={profile.farm_size_acres ? `${profile.farm_size_acres} acres` : '—'}
              />
            </Card.Body>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

/* ── Small helper component ───────────────────────────────────── */
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
