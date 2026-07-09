import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Search, X, Trash2, Eye, Pencil, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { listAdminUsers, deleteAdminUser, updateAdminUser, createAdminUser } from '@/api/admin.api';
import { PAGINATION_DEFAULTS } from '@/constants';
import { usePageTitle, useDebounce } from '@/hooks';
import { formatDate, formatPhone } from '@/utils/formatters';
import { cn } from '@/utils';
import PageContainer from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { SectionSpinner } from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

const ROLE_OPTIONS = [
  { value: '',       label: 'All roles'  },
  { value: 'farmer', label: 'Farmers'    },
  { value: 'driver', label: 'Drivers'    },
  { value: 'admin',  label: 'Admins'     },
];

const STATUS_OPTIONS = [
  { value: '',           label: 'All statuses' },
  { value: 'active',     label: 'Active'       },
  { value: 'inactive',   label: 'Inactive'     },
  { value: 'suspended',  label: 'Suspended'    },
];

const ROLE_BADGE = {
  farmer: { variant: 'green',  label: '🌾 Farmer'  },
  driver: { variant: 'yellow', label: '🚛 Driver'  },
  admin:  { variant: 'red',    label: '⚙️ Admin'   },
};

const STATUS_BADGE = {
  active:    { variant: 'green', label: 'Active'    },
  inactive:  { variant: 'gray',  label: 'Inactive'  },
  suspended: { variant: 'red',   label: 'Suspended' },
  pending:   { variant: 'yellow',label: 'Pending'   },
};

export default function AdminUsersPage() {
  usePageTitle('Users — Admin');
  const qc = useQueryClient();

  const [page,         setPage]         = useState(1);
  const [roleFilter,   setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [editData,     setEditData]     = useState({});
  const [createOpen,   setCreateOpen]   = useState(false);
  const [createData,   setCreateData]   = useState({ name: '', email: '', role: 'farmer', phone: '' });

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'users', { page, role: roleFilter, status: statusFilter, search: debouncedSearch }],
    queryFn: () => listAdminUsers({
      page, limit: PAGINATION_DEFAULTS.limit,
      role:   roleFilter   || undefined,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    placeholderData: prev => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess:  () => { toast.success('User deleted.'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setDeleteTarget(null); },
    onError:    (err) => toast.error(err.message || 'Delete failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => updateAdminUser(id, payload),
    onSuccess:  () => { toast.success('User updated.'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setEditTarget(null); },
    onError:    (err) => toast.error(err.message || 'Update failed.'),
  });

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess:  () => { toast.success('User created.'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setCreateOpen(false); setCreateData({ name: '', email: '', role: 'farmer', phone: '' }); },
    onError:    (err) => toast.error(err.message || 'Create failed.'),
  });

  const users      = data?.users ?? data?.data ?? [];
  const total      = data?.total ?? data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGINATION_DEFAULTS.limit));

  function openEdit(user) {
    setEditTarget(user);
    setEditData({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '', status: user.status ?? 'active' });
  }

  return (
    <PageContainer>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total > 0 ? `${total} registered user${total !== 1 ? 's' : ''}` : 'Manage platform users'}
          </p>
        </div>
        <Button leftIcon={<UserPlus size={16} />} size="sm" onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </motion.div>

      {/* Filters */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by name or email…" leftIcon={<Search size={15} />}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              rightIcon={search ? <button onClick={() => { setSearch(''); setPage(1); }}><X size={14} /></button> : null} />
          </div>
          <div className="sm:w-36">
            <Select options={ROLE_OPTIONS} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} />
          </div>
          <div className="sm:w-36">
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false} className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : ''}>
        {isLoading ? <SectionSpinner message="Loading users…" /> : users.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="No users found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide last:text-right whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {users.map(u => {
                  const roleBadge   = ROLE_BADGE[u.role]   ?? { variant: 'gray', label: u.role };
                  const statusBadge = STATUS_BADGE[u.status] ?? { variant: 'gray', label: u.status ?? '—' };
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{u.name ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-[180px] truncate">{u.email}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{u.phone ? formatPhone(u.phone) : '—'}</td>
                      <td className="px-5 py-4"><Badge variant={roleBadge.variant}>{roleBadge.label}</Badge></td>
                      <td className="px-5 py-4"><Badge variant={statusBadge.variant}>{statusBadge.label}</Badge></td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="xs" leftIcon={<Pencil size={12} />} onClick={() => openEdit(u)}>Edit</Button>
                          <Button variant="ghost" size="xs" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            leftIcon={<Trash2 size={12} />} onClick={() => setDeleteTarget(u)}>
                            Delete
                          </Button>
                        </div>
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

      {/* Delete modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User" size="sm"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget?.id)}>Delete</Button>
        </div>}>
        <p className="text-sm text-gray-600 dark:text-gray-300">Permanently delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User" size="sm"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button size="sm" loading={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: editTarget?.id, ...editData })}>Save</Button>
        </div>}>
        <div className="flex flex-col gap-4">
          <Input label="Name" value={editData.name ?? ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
          <Input label="Email" type="email" value={editData.email ?? ''} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} />
          <Input label="Phone" type="tel" value={editData.phone ?? ''} onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} />
          <Select label="Status" options={STATUS_OPTIONS.slice(1)} value={editData.status ?? 'active'} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} />
        </div>
      </Modal>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add User" size="sm"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button size="sm" loading={createMutation.isPending} onClick={() => createMutation.mutate(createData)}>Create</Button>
        </div>}>
        <div className="flex flex-col gap-4">
          <Input label="Name" required value={createData.name} onChange={e => setCreateData(d => ({ ...d, name: e.target.value }))} />
          <Input label="Email" type="email" required value={createData.email} onChange={e => setCreateData(d => ({ ...d, email: e.target.value }))} />
          <Input label="Phone" type="tel" value={createData.phone} onChange={e => setCreateData(d => ({ ...d, phone: e.target.value }))} />
          <Select label="Role" options={ROLE_OPTIONS.slice(1)} value={createData.role} onChange={e => setCreateData(d => ({ ...d, role: e.target.value }))} />
        </div>
      </Modal>
    </PageContainer>
  );
}
