'use client';

import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUserRole, useUpdateUserStatus, useDeleteUser } from '@/hooks/useUsers';
import type { MockUser, UserRole } from '@/types';

const ROLE_OPTIONS: UserRole[] = ['ADMIN', 'CASEWORKER', 'MANAGER'];

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:      'bg-fast-admin text-white',
  CASEWORKER: 'bg-fast-caseworker text-white',
  MANAGER:    'bg-fast-manager text-white',
};

export default function AdminUsersPage() {
  const { data: usersData, isLoading, isError, error: fetchError } = useUsers();
  const createUserMutation = useCreateUser();
  const [createError, setCreateError] = useState('');
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  const users: MockUser[] = usersData?.users ?? [];

  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [showCreate, setShowCreate]   = useState(false);

  const [newName, setNewName]           = useState('');
  const [newEmail, setNewEmail]         = useState('');
  const [newRole, setNewRole]           = useState<UserRole | ''>('');
  const [newDepartment, setNewDepartment] = useState('');

  const handleCreateUser = () => {
    if (!newEmail.trim() || !newRole) return;
    setCreateError('');
    createUserMutation.mutate(
      { name: newName, email: newEmail, role: newRole, department: newDepartment },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewName('');
          setNewEmail('');
          setNewRole('');
          setNewDepartment('');
          setCreateError('');
        },
        onError: (err: Error) => {
          setCreateError(err.message || 'Failed to create user.');
        },
      }
    );
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const allSelected   = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const someSelected  = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((u) => u.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateRole = (id: string, role: UserRole) => {
    updateRoleMutation.mutate({ userId: id, role });
  };

  const bulkDeactivate = () => {
    selected.forEach((id) => updateStatusMutation.mutate({ userId: id, status: 'INACTIVE' }));
    setSelected(new Set());
  };

  const bulkDelete = () => {
    selected.forEach((id) => deleteUserMutation.mutate(id));
    setSelected(new Set());
  };

  const totals = {
    all:        users.length,
    caseworker: users.filter((u) => u.role === 'CASEWORKER').length,
    manager:    users.filter((u) => u.role === 'MANAGER').length,
    admin:      users.filter((u) => u.role === 'ADMIN').length,
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12 text-fast-muted text-sm">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      {isError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          Failed to load users: {(fetchError as Error)?.message || 'Unknown error'}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fast-text">User Management</h1>
          <p className="text-sm text-fast-muted mt-1">Manage caseworkers, managers, and administrators</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-fast-teal text-white rounded font-medium text-sm hover:bg-fast-teal/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New User
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-fast-panel rounded-card border border-gray-200 p-5">
          <p className="text-xs font-medium text-fast-muted uppercase tracking-wide mb-1">Total Users</p>
          <p className="text-2xl font-semibold text-fast-text">{totals.all}</p>
        </div>
        <div className="bg-fast-panel rounded-card border border-gray-200 border-l-4 border-l-fast-caseworker p-5">
          <p className="text-xs font-medium text-fast-muted uppercase tracking-wide mb-1">Caseworkers</p>
          <p className="text-2xl font-semibold text-fast-caseworker">{totals.caseworker}</p>
        </div>
        <div className="bg-fast-panel rounded-card border border-gray-200 border-l-4 border-l-fast-manager p-5">
          <p className="text-xs font-medium text-fast-muted uppercase tracking-wide mb-1">Managers</p>
          <p className="text-2xl font-semibold text-fast-manager">{totals.manager}</p>
        </div>
        <div className="bg-fast-panel rounded-card border border-gray-200 border-l-4 border-l-fast-admin p-5">
          <p className="text-xs font-medium text-fast-muted uppercase tracking-wide mb-1">Admins</p>
          <p className="text-2xl font-semibold text-fast-admin">{totals.admin}</p>
        </div>
      </div>

      {/* User table card */}
      <div className="bg-fast-panel rounded-card border border-gray-200 overflow-hidden">
        {/* Search & filter */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-fast-muted" />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        {/* Bulk actions toolbar */}
        {someSelected && (
          <div className="px-4 py-2.5 bg-fast-teal-light border-b border-fast-teal/20 flex items-center gap-3">
            <span className="text-sm font-medium text-fast-teal">
              {selected.size} user{selected.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={bulkDeactivate}
              className="px-3 py-1 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
            >
              Deactivate Selected
            </button>
            <button
              onClick={bulkDelete}
              className="px-3 py-1 text-xs font-medium bg-fast-declined text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-xs text-fast-teal hover:underline"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-fast-teal focus:ring-fast-teal"
                    title="Select all"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Cases</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-fast-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-fast-muted text-sm">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50/50 transition-colors ${selected.has(user.id) ? 'bg-fast-teal-light' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleOne(user.id)}
                        className="rounded border-gray-300 text-fast-teal focus:ring-fast-teal"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-2xs font-semibold ${
                          user.role === 'ADMIN' ? 'bg-fast-admin' :
                          user.role === 'MANAGER' ? 'bg-fast-manager' : 'bg-fast-caseworker'
                        }`}>
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-fast-text">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-fast-muted">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-fast-text">{user.department}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                        className={`px-2 py-0.5 text-2xs font-semibold rounded-full border-0 focus:ring-1 focus:ring-fast-teal cursor-pointer ${ROLE_COLORS[user.role]}`}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r} className="text-black bg-white font-normal">
                            {r.charAt(0) + r.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-fast-text text-center tabular-nums">{user.casesAssigned}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-2xs font-medium rounded-full ${
                        user.status === 'ACTIVE'
                          ? 'bg-fast-green-light text-fast-approved border border-fast-teal/10'
                          : 'bg-gray-100 text-fast-muted border border-gray-200'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            userId: user.id,
                            status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                          })
                        }
                        className="text-xs text-fast-muted hover:text-fast-text mr-3"
                      >
                        {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        className="text-xs text-fast-declined hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30">
          <p className="text-xs text-fast-muted">Showing {filtered.length} of {users.length} users</p>
        </div>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-fast-panel rounded-card border border-gray-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-fast-text">Create New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-fast-muted hover:text-fast-text p-1 rounded hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fast-text mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fast-text mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. jane.smith@agency.gov"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fast-text mb-1">Role <span className="text-red-500">*</span></label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
                >
                  <option value="" disabled>Select a role...</option>
                  <option value="CASEWORKER">Caseworker</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-fast-text mb-1">Department</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. Benefits Processing"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-fast-teal/30 focus:border-fast-teal"
                />
              </div>
            </div>
            {createError && (
              <p className="mt-3 text-sm text-red-600">{createError}</p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-fast-text rounded text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending || !newEmail.trim() || !newRole}
                className="flex-1 px-4 py-2 bg-fast-teal text-white rounded text-sm font-medium hover:bg-fast-teal/90 transition-colors disabled:opacity-50"
              >
                {createUserMutation.isPending ? 'Creating...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
