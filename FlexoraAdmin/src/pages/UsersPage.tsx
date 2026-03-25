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

const PAGE_SIZE = 4;

export const UsersPage = () => {
  const [rows, setRows] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'Active' | 'Pending'>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [viewUser, setViewUser] = useState<ApiUser | null>(null);
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

  const filtered = useMemo(() => {
    return rows.filter((u) => {
      const matchText = `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase());
      const matchStatus = status === 'all' ? true : getStatus(u) === status;
      return matchText && matchStatus;
    });
  }, [rows, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const total = rows.length;
  const active = rows.filter((u) => u.completedOnboarding).length;

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
      setActionError('Failed to update user. Check if email is unique.');
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

  return (
    <div className="h-full space-y-4 overflow-hidden">
      <PageHeader title="User Control Room" subtitle="View complete profile details and manage every account from one place" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-brand-text">{total.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">Active</p>
          <p className="mt-2 text-2xl font-bold text-brand-light">{active.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">Pending</p>
          <p className="mt-2 text-2xl font-bold text-brand-text">{Math.max(total - active, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <SectionCard
          title="User Directory"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <input
                placeholder="Search name or email"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-brand-border bg-brand-bg/60 px-3 py-2 text-sm text-brand-text outline-none ring-brand-primary/40 transition focus:ring"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as 'all' | 'Active' | 'Pending');
                  setPage(1);
                }}
                className="rounded-lg border border-brand-border bg-brand-bg/60 px-3 py-2 text-sm text-brand-text"
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          }
        >
          {isLoading ? <p className="text-sm text-brand-muted">Loading users...</p> : null}
          {loadError ? <p className="mb-3 text-sm text-rose-300">{loadError}</p> : null}
          {actionError ? <p className="mb-3 text-sm text-rose-300">{actionError}</p> : null}
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'User',
                render: (row) => (
                  <div>
                    <p className="font-semibold text-brand-text">{row.name}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">ID {row._id?.slice(-6)}</p>
                  </div>
                ),
              },
              {
                key: 'email',
                header: 'Contact',
                render: (row) => (
                  <div>
                    <p className="text-brand-text">{row.email}</p>
                    <p className="text-xs text-brand-muted">{row.avatarUrl ? 'Avatar set' : 'No avatar'}</p>
                  </div>
                ),
              },
              {
                key: 'joinedDate',
                header: 'Joined',
                render: (row) => formatDate(row.createdAt),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => {
                  const value = getStatus(row);
                  const tone = value === 'Active'
                    ? 'border border-brand-primary/30 bg-emerald-50 text-emerald-700'
                    : 'border border-amber-300/60 bg-amber-50 text-amber-700';
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {value}
                    </span>
                  );
                },
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openView(row._id)}
                      className="rounded-md border border-brand-border bg-white px-2.5 py-1.5 text-xs font-medium text-brand-text transition hover:-translate-y-px hover:bg-brand-panel"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEdit(row)}
                      className="rounded-md border border-brand-primary/40 bg-brand-primary/10 px-2.5 py-1.5 text-xs font-medium text-brand-dark transition hover:-translate-y-px hover:bg-brand-primary/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:-translate-y-px hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            rows={pageRows}
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-brand-muted">{filtered.length} users found</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-brand-text">
                Page {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="User Info Panel">
          {!selectedUser ? (
            <p className="text-sm text-brand-muted">Select a user to view profile details.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-brand-border bg-brand-panel p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">Name</p>
                <p className="mt-1 text-lg font-semibold text-brand-text">{selectedUser.name}</p>
              </div>
              <div className="rounded-xl border border-brand-border bg-brand-panel p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-muted">Email</p>
                <p className="mt-1 text-sm text-brand-text">{selectedUser.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                  <p className="text-xs text-brand-muted">Joined</p>
                  <p className="mt-1 text-sm text-brand-text">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                  <p className="text-xs text-brand-muted">Status</p>
                  <p className="mt-1 text-sm text-brand-text">{getStatus(selectedUser)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(selectedUser)}
                  className="rounded-lg border border-brand-primary/40 bg-brand-primary/12 px-3 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-primary/20"
                >
                  Edit User
                </button>
                <button
                  onClick={() => handleDelete(selectedUser)}
                  className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Delete User
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {isEditOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-5 shadow-soft">
            <h3 className="text-lg font-bold text-brand-text">Edit User</h3>
            <p className="mt-1 text-sm text-brand-muted">Update profile details and onboarding status.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm text-brand-muted">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-brand-border bg-brand-panel px-3 py-2 text-sm text-brand-text"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-brand-muted">Email</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-brand-border bg-brand-panel px-3 py-2 text-sm text-brand-text"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-brand-text">
                <input
                  type="checkbox"
                  checked={editForm.completedOnboarding}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, completedOnboarding: e.target.checked }))}
                />
                Completed onboarding
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isViewOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-brand-text">User Details</h3>
                <p className="mt-1 text-sm text-brand-muted">Complete profile information</p>
              </div>
              <button
                onClick={() => {
                  setIsViewOpen(false);
                  setViewUser(null);
                }}
                className="rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
              >
                Close
              </button>
            </div>

            {isViewLoading ? <p className="mt-4 text-sm text-brand-muted">Loading user details...</p> : null}

            {!isViewLoading && viewUser ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                    <p className="text-xs text-brand-muted">Name</p>
                    <p className="mt-1 text-sm font-semibold text-brand-text">{viewUser.name}</p>
                  </div>
                  <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                    <p className="text-xs text-brand-muted">Status</p>
                    <p className="mt-1 text-sm text-brand-text">{getStatus(viewUser)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                  <p className="text-xs text-brand-muted">Email</p>
                  <p className="mt-1 break-all text-sm text-brand-text">{viewUser.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                    <p className="text-xs text-brand-muted">User ID</p>
                    <p className="mt-1 break-all text-xs text-brand-text">{viewUser._id}</p>
                  </div>
                  <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                    <p className="text-xs text-brand-muted">Avatar</p>
                    <p className="mt-1 text-sm text-brand-text">{viewUser.avatarUrl ? 'Available' : 'Not set'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                    <p className="text-xs text-brand-muted">Created At</p>
                    <p className="mt-1 text-sm text-brand-text">{formatDate(viewUser.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-brand-border bg-brand-panel p-3">
                    <p className="text-xs text-brand-muted">Updated At</p>
                    <p className="mt-1 text-sm text-brand-text">{formatDate(viewUser.updatedAt)}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      openEdit(viewUser);
                      setIsViewOpen(false);
                    }}
                    className="rounded-lg border border-brand-primary/40 bg-brand-primary/12 px-3 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-primary/20"
                  >
                    Edit User
                  </button>
                  <button
                    onClick={() => {
                      setIsViewOpen(false);
                      handleDelete(viewUser);
                    }}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
