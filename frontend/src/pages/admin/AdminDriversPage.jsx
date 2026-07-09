import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, X, Truck, Pencil, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { listAdminDrivers, updateAdminDriver } from '@/api/admin.api';
import { PAGINATION_DEFAULTS } from '@/constants';
import { usePageTitle, useDebounce } from '@/hooks';
import { formatDate, formatPhone } from '@/utils/formatters';
import { cn } from '@/utils';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { SectionSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';

const AVAIL_OPTIONS = [
  { value: '',           label: 'All availability' },
  { value: 'available',  label: 'Available'         },
  { value: 'busy',       label: 'Busy'              },
  { value: 'offline',    label: 'Offline'           },
];

const STATUS_OPTS = [
  { value: 'active',    label: 'Active'    },
  { value: 'inactive',  label: 'Inactive'  },
  { value: 'suspended', label: 'Suspended' },
];

const AVAIL_BADGE = {
  available: { variant: 'green',  label: 'Available' },
  busy:      { variant: 'yellow', label: 'Busy'      },
  offline:   { variant: 'gray',   label: 'Offline'   },
};

export default function AdminDriversPage() {
  usePageTitle('Drivers — Admin');
  const qc = useQueryClient();

  const [page,       setPage]       = useState(1);
  const [availFilter,setAvailFilter]= useState('');
  const [search,     setSearch]     = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [editData,   setEditData]   = useState({});

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'drivers', { page, availability: availFilter, search: debouncedSearch }],
    queryFn: () => listAdminDrivers({
      page, limit: PAGINATION_DEFAULTS.limit,
      availability: availFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: prev => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => updateAdminDriver(id, payload),
    onSuccess:  () => { toast.success('Driver updated.'); qc.invalidateQueries({ queryKey: ['admin', 'drivers'] }); setEditTarget(null); },
    onError:    (err) => toast.error(err.message || 'Update failed.'),
  });

  const drivers    = data?.drivers ?? data?.data ?? [];
  const total      = data?.total ?? data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGINATION_DEFAULTS.limit));

  function openEdit(d) {
    setEditTarget(d);
    setEditData({
      name: d.name ?? '', phone: d.phone ?? '',
      vehicle_type: d.vehicle_type ?? '', vehicle_number: d.vehicle_number ?? '',
      license_number: d.license_number ?? '', status: d.status ?? 'active',
    });
  }

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Drivers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} driver${total !== 1 ? 's' : ''} on the platform` : 'Manage lorry owners and drivers'}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by name or vehicle…" leftIcon={<Search size={15} />}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              rightIcon={search ? <button onClick={() => { setSearch(''); setPage(1); }}><X size={14} /></button> : null} />
          </div>
          <div className="sm:w-44">
            <Select options={AVAIL_OPTIONS} value={availFilter} onChange={e => { setAvailFilter(e.target.value); setPage(1); }} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false} className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : ''}>
        {isLoading ? <SectionSpinner message="Loading drivers…" /> : drivers.length === 0 ? (
          <EmptyState icon={<Truck size={28} />} title="No drivers found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Name', 'Phone', 'Vehicle', 'Reg. No.', 'Availability', 'Rating', 'Joined', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide last:text-right whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {drivers.map(d => {
                  const avail = AVAIL_BADGE[d.availability] ?? { variant: 'gray', label: d.availability ?? '—' };
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{d.name ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{d.phone ? formatPhone(d.phone) : '—'}</td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap capitalize">{d.vehicle_type ?? '—'}</td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">{d.vehicle_number ?? '—'}</td>
                      <td className="px-5 py-4"><Badge variant={avail.variant}>{avail.label}</Badge></td>
                      <td className="px-5 py-4">
                        {d.rating != null ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Star size={13} className="fill-secondary-400 text-secondary-400" />
                            {Number(d.rating).toFixed(1)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(d.created_at)}</td>
                      <td className="px-5 py-4 text-right">
                        <Button variant="ghost" size="xs" leftIcon={<Pencil size={12} />} onClick={() => openEdit(d)}>Edit</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-5" />}

      {/* Edit modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Driver" size="md"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button size="sm" loading={updateMutation.isPending}
            onClick={() => updateMutation.mutate({ id: editTarget?.id, ...editData })}>
            Save Changes
          </Button>
        </div>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name"         value={editData.name ?? ''}           onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
          <Input label="Phone"    type="tel" value={editData.phone ?? ''}         onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} />
          <Input label="Vehicle type"      value={editData.vehicle_type ?? ''}   onChange={e => setEditData(d => ({ ...d, vehicle_type: e.target.value }))} />
          <Input label="Vehicle number"    value={editData.vehicle_number ?? ''}  onChange={e => setEditData(d => ({ ...d, vehicle_number: e.target.value }))} />
          <Input label="License number"    value={editData.license_number ?? ''} onChange={e => setEditData(d => ({ ...d, license_number: e.target.value }))} />
          <Select label="Status" options={STATUS_OPTS} value={editData.status ?? 'active'} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} />
        </div>
      </Modal>
    </PageContainer>
  );
}
