import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { DataTable } from '../components/ui/DataTable';
import {
  fetchUsers,
  fetchUserById,
  updateUserById,
  deleteUserById,
  type ApiUser,
} from '../services/usersService';
import { resolveApiBaseUrl } from '../services/api';
import {
  UsersIcon,
  CheckCircleIcon,
  AlertIcon,
  TrendingUpIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  DeleteIcon,
  EyeIcon,
} from '../components/icons/Icons';

const PAGE_SIZE = 5;

export const UsersPage = () => {
  const [rows, setRows] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'premium' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [viewUser, setViewUser] = useState<ApiUser | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    completedOnboarding: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const users = await fetchUsers();
        setRows(users);
        if (users[0]?._id) {
          setSelectedId(users[0]._id);
        }
      } catch (error) {
        setLoadError('Unable to load users from backend API. Make sure backend is running on port 5000.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadApiBase = async () => {
      try {
        const base = await resolveApiBaseUrl();
        setApiBaseUrl(base);
      } catch (error) {
        setApiBaseUrl('');
      }
    };

    loadApiBase();
  }, []);

  useEffect(() => {
    const loadSelected = async () => {
      if (!selectedId) {
        setSelectedUser(null);
        return;
      }

      try {
        const user = await fetchUserById(selectedId);
        setSelectedUser(user);
      } catch (error) {
        setActionError('Unable to fetch selected user details.');
      }
    };

    loadSelected();
  }, [selectedId]);

  const getStatus = (u: ApiUser) => (u.completedOnboarding ? 'Active' : 'Pending');

  const getTabs = () => [
    { id: 'all', label: 'All Users', icon: UsersIcon, count: rows.length },
    { id: 'verified', label: 'Verified', icon: CheckCircleIcon, count: rows.filter((u) => u.completedOnboarding).length },
    { id: 'premium', label: 'Premium', icon: TrendingUpIcon, count: Math.floor(rows.length * 0.3) },
    { id: 'inactive', label: 'Inactive', icon: AlertIcon, count: rows.filter((u) => !u.completedOnboarding).length },
  ] as const;

  const filtered = useMemo(() => {
    const base = rows.filter((u) => {
      const matchText = `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase());
      return matchText;
    });

    if (activeTab === 'all') return base;
    if (activeTab === 'verified') return base.filter((u) => u.completedOnboarding);
    if (activeTab === 'premium') return base.slice(0, Math.floor(base.length * 0.3));
    if (activeTab === 'inactive') return base.filter((u) => !u.completedOnboarding);
    return base;
  }, [rows, query, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const total = rows.length;
  const active = rows.filter((u) => u.completedOnboarding).length;
  const inactive = Math.max(total - active, 0);

  const tabs = getTabs();

  const openEdit = (user: ApiUser) => {
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      completedOnboarding: !!user.completedOnboarding,
    });
    setSelectedId(user._id);
    setIsEditOpen(true);
    setActionError('');
  };

  const openView = async (userId: string) => {
    try {
      setIsViewOpen(true);
      setIsViewLoading(true);
      setActionError('');
      const user = await fetchUserById(userId);
      setViewUser(user);
      setSelectedId(userId);
    } catch (error) {
      setActionError('Unable to load user details.');
      setViewUser(null);
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;

    try {
      setIsSaving(true);
      setActionError('');

      const updated = await updateUserById(selectedId, {
        name: editForm.name,
        email: editForm.email,
        completedOnboarding: editForm.completedOnboarding,
      });

      setRows((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      setSelectedUser(updated);
      setIsEditOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user.';
      setActionError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: ApiUser) => {
    const confirmed = window.confirm(`Delete user ${user.name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setActionError('');
      await deleteUserById(user._id);
      const updatedRows = rows.filter((u) => u._id !== user._id);
      setRows(updatedRows);
      if (selectedId === user._id) {
        const next = updatedRows[0]?._id || '';
        setSelectedId(next);
      }
    } catch (error) {
      setActionError('Failed to delete user.');
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  };

  const getAvatarSrc = (avatarUrl?: string) => {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }
    if (!apiBaseUrl) return avatarUrl;
    return `${apiBaseUrl}${avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`}`;
  };

  return (
    <div className="h-full space-y-6 overflow-y-auto">
      <PageHeader title="User Control Room" subtitle="Manage all user accounts with real-time insights" />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-blue-50 to-white p-5 hover:border-blue-300/50 transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-muted font-medium">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-brand-text">{total.toLocaleString()}</p>
              <p className="mt-1 text-xs text-blue-600 font-semibold">+12% this month</p>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-500 opacity-30" />
          </div>
        </div>
        <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-emerald-50 to-white p-5 hover:border-emerald-300/50 transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-muted font-medium">Verified</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{active.toLocaleString()}</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">{total > 0 ? Math.round((active / total) * 100) : 0}% active</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-emerald-500 opacity-30" />
          </div>
        </div>
        <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-purple-50 to-white p-5 hover:border-purple-300/50 transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-muted font-medium">Premium</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{Math.floor(total * 0.3).toLocaleString()}</p>
              <p className="mt-1 text-xs text-purple-600 font-semibold">High value</p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-purple-500 opacity-30" />
          </div>
        </div>
        <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-amber-50 to-white p-5 hover:border-amber-300/50 transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-muted font-medium">Inactive</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{inactive.toLocaleString()}</p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">Need attention</p>
            </div>
            <AlertIcon className="w-8 h-8 text-amber-500 opacity-30" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-brand-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === tab.id
                  ? 'bg-brand-primary/20 text-brand-primary'
                  : 'bg-brand-panel text-brand-muted'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {loadError ? <p className="text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-lg p-3">{loadError}</p> : null}
      {actionError ? <p className="text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-lg p-3">{actionError}</p> : null}

      {/* Main Content */}
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title={`${tabs.find((t) => t.id === activeTab)?.label} Directory`}>
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white border border-brand-border rounded-lg px-3 py-2">
              <SearchIcon className="w-4 h-4 text-brand-muted" />
              <input
                placeholder="Search by name or email..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm text-brand-text outline-none"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-text hover:bg-brand-panel transition">
              <FilterIcon className="w-4 h-4" />
              Filter
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-brand-muted py-8 text-center">Loading users...</p>
          ) : (
            <>
              <DataTable
            columns={[
              {
                key: 'name',
                header: 'User',
                render: (row) => (
                  <div>
                    <p className="font-semibold text-brand-text">{row.name}</p>
                        <p className="text-xs text-brand-muted">{row.email}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => {
                      const value = getStatus(row);
                      const tone =
                        value === 'Active'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-amber-200 bg-amber-50 text-amber-700';
                      return (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {value}
                        </span>
                      );
                    },
                  },
                  {
                    key: 'joined',
                    header: 'Joined',
                    render: (row) => formatDate(row.createdAt),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openView(row._id)}
                          className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                          title="View details"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(row)}
                          className="rounded-md border border-brand-primary/40 bg-brand-primary/12 px-2.5 py-1.5 text-xs font-medium text-brand-dark hover:bg-brand-primary/20 transition"
                          title="Edit user"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
                          title="Delete user"
                        >
                          <DeleteIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ),
                  },
                ]}
                rows={pageRows}
              />

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-brand-muted">
                  Showing {pageRows.length > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0}-{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text disabled:opacity-50 hover:bg-brand-panel transition"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-brand-text font-medium">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text disabled:opacity-50 hover:bg-brand-panel transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="User Details" icon={<UsersIcon className="w-5 h-5" />}>
          {!selectedUser ? (
            <div className="text-center py-8">
              <UsersIcon className="w-12 h-12 text-brand-muted/30 mx-auto mb-3" />
              <p className="text-sm text-brand-muted">Select a user to view details</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-brand-border bg-gradient-to-br from-white to-brand-panel/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-muted font-semibold">Full Name</p>
                <p className="mt-2 text-lg font-bold text-brand-text">{selectedUser.name}</p>
              </div>
              <div className="rounded-xl border border-brand-border bg-gradient-to-br from-white to-brand-panel/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-muted font-semibold">Email</p>
                <p className="mt-2 break-all text-sm text-brand-text">{selectedUser.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-border bg-gradient-to-br from-white to-brand-panel/30 p-4">
                  <p className="text-xs text-brand-muted font-semibold">Status</p>
                  <p className="mt-2 text-sm text-brand-text">{getStatus(selectedUser)}</p>
                </div>
                <div className="rounded-xl border border-brand-border bg-gradient-to-br from-white to-brand-panel/30 p-4">
                  <p className="text-xs text-brand-muted font-semibold">Joined</p>
                  <p className="mt-2 text-sm text-brand-text">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openEdit(selectedUser)}
                  className="flex-1 rounded-lg border border-brand-primary/40 bg-brand-primary/12 px-3 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-primary/20 transition"
                >
                  Edit User
                </button>
                <button
                  onClick={() => handleDelete(selectedUser)}
                  className="flex-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Edit Modal */}
      {isEditOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-text">Edit User Profile</h3>
            <p className="mt-1 text-sm text-brand-muted">Update user information and status</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-text">Full Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary/30 outline-none transition"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-text">Email Address</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary/30 outline-none transition"
                />
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-bg/50 p-3 text-sm font-medium text-brand-text cursor-pointer hover:bg-brand-bg transition">
                <input
                  type="checkbox"
                  checked={editForm.completedOnboarding}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, completedOnboarding: e.target.checked }))}
                  className="w-4 h-4"
                />
                Mark as verified / completed onboarding
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text hover:bg-brand-panel transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 transition"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* View Modal */}
      {isViewOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-brand-text">User Profile Details</h3>
                <p className="mt-1 text-sm text-brand-muted">Complete account information</p>
              </div>
              <button
                onClick={() => {
                  setIsViewOpen(false);
                  setViewUser(null);
                }}
                className="text-brand-muted hover:text-brand-text text-xl font-bold"
              >
                ×
              </button>
            </div>

            {isViewLoading ? (
              <p className="mt-6 text-sm text-brand-muted text-center">Loading details...</p>
            ) : !viewUser ? (
              <p className="mt-6 text-sm text-brand-muted text-center">No user data available</p>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4 rounded-lg border border-brand-border bg-brand-bg/50 p-4">
                  {getAvatarSrc(viewUser.avatarUrl) ? (
                    <img
                      src={getAvatarSrc(viewUser.avatarUrl)}
                      alt={`${viewUser.name} avatar`}
                      className="h-16 w-16 rounded-full border border-brand-border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-border bg-white text-xl font-bold text-brand-primary">
                      {(viewUser.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-text">{viewUser.name}</p>
                    <p className="truncate text-xs text-brand-muted">{viewUser.email}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-4">
                  <p className="text-xs font-semibold text-brand-muted uppercase">Name</p>
                  <p className="mt-2 text-sm font-semibold text-brand-text">{viewUser.name}</p>
                </div>
                <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-4">
                  <p className="text-xs font-semibold text-brand-muted uppercase">Email</p>
                  <p className="mt-2 break-all text-sm text-brand-text">{viewUser.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-4">
                    <p className="text-xs font-semibold text-brand-muted uppercase">Status</p>
                    <p className="mt-2 text-sm text-brand-text">{getStatus(viewUser)}</p>
                  </div>
                  <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-4">
                    <p className="text-xs font-semibold text-brand-muted uppercase">Avatar</p>
                    <p className="mt-2 break-all text-sm text-brand-text">{viewUser.avatarUrl || 'None'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-4">
                    <p className="text-xs font-semibold text-brand-muted uppercase">Created</p>
                    <p className="mt-2 text-sm text-brand-text">{formatDate(viewUser.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-brand-border bg-brand-bg/50 p-4">
                    <p className="text-xs font-semibold text-brand-muted uppercase">Updated</p>
                    <p className="mt-2 text-sm text-brand-text">{formatDate(viewUser.updatedAt)}</p>
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      openEdit(viewUser);
                      setIsViewOpen(false);
                    }}
                    className="rounded-lg border border-brand-primary/40 bg-brand-primary/12 px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-primary/20 transition"
                  >
                    Edit User
                  </button>
                  <button
                    onClick={() => {
                      setIsViewOpen(false);
                      handleDelete(viewUser);
                    }}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
