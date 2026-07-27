'use client';

import { useState } from 'react';
import { usePolicies, useUpdatePolicy, useDeletePolicy } from '@/hooks/usePolicies';
import type { Policy } from '@/types';

type PolicyItem = Policy & {
  displayStatus: 'active' | 'expiring' | 'expired';
};

export default function AdminPoliciesPage() {
  const { data: policiesData, isLoading } = usePolicies();
  const updatePolicyMutation = useUpdatePolicy();
  const deletePolicyMutation = useDeletePolicy();

  const [editPolicy, setEditPolicy] = useState<PolicyItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PolicyItem | null>(null);
  const [viewPolicy, setViewPolicy] = useState<PolicyItem | null>(null);

  const policies: PolicyItem[] = (policiesData?.policies ?? []).map((p) => ({
    ...p,
    displayStatus: (p.status === 'active' || p.status === 'expiring' || p.status === 'expired')
      ? p.status as 'active' | 'expiring' | 'expired'
      : 'active',
  }));

  const activePolicies = policies.filter((p) => p.displayStatus === 'active');
  const aboutToExpire = policies.filter((p) => p.displayStatus === 'expiring');
  const expiredPolicies = policies.filter((p) => p.displayStatus === 'expired');

  const handleDelete = (policy: PolicyItem) => {
    deletePolicyMutation.mutate(policy.id);
    setDeleteConfirm(null);
  };

  const handleEditSave = (updated: { name: string; category: string }) => {
    if (!editPolicy) return;
    updatePolicyMutation.mutate({ policyId: editPolicy.id, body: { name: updated.name, category: updated.category } });
    setEditPolicy(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12 text-fast-muted text-sm">Loading policies…</div>
      </div>
    );
  }

  const renderPolicyCard = (policy: PolicyItem, showActions = true) => (
    <div key={policy.id} className="bg-fast-panel rounded-lg shadow-card p-5">
      <div className="flex items-start justify-between mb-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-bold ${
            policy.displayStatus === 'active'
              ? 'bg-fast-green-light text-fast-approved'
              : policy.displayStatus === 'expiring'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-200 text-fast-muted'
          }`}
        >
          {policy.displayStatus === 'expiring' ? 'expiring soon' : policy.displayStatus}
        </span>
        <span className="text-xs text-fast-muted">{policy.version}</span>
      </div>
      <h3 className="text-base font-bold text-fast-text mb-2">{policy.name}</h3>
      <span className="inline-block px-2 py-1 bg-fast-purple-light text-purple-700 rounded-full text-xs font-medium mb-3">
        {policy.category}
      </span>
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-fast-muted">
          <span>{policy.version}</span>
          <span>{new Date(policy.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={() => setViewPolicy(policy)}
            className="flex-1 px-3 py-2 bg-fast-teal text-white rounded-md text-sm font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-1"
          >
            <span>👁️</span> View
          </button>
          <button
            onClick={() => setEditPolicy(policy)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => setDeleteConfirm(policy)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm hover:bg-red-50"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-3xl font-bold text-fast-teal">AI Policy Management</h1>
          </div>
          <p className="text-base text-fast-muted">Upload, edit, and delete policies. View about-to-expire and expired policies.</p>
        </div>
        <button className="px-4 py-2 bg-fast-approved text-white rounded-md font-semibold hover:bg-fast-teal transition-colors flex items-center gap-2">
          <span>📤</span>
          Upload New Policy
        </button>
      </div>

      <div className="bg-fast-teal-light border border-fast-teal/30 rounded-lg p-4 mb-6">
        <h3 className="text-base font-semibold text-fast-teal mb-2">How AI Policies Work</h3>
        <ul className="text-sm text-fast-text space-y-1 list-disc list-inside">
          <li>Policies define eligibility rules and required documents</li>
          <li>AI agents use policies to validate and evaluate cases</li>
          <li>Policies are versioned; you can upload, edit, and delete</li>
          <li>Review about-to-expire and expired policies for renewal</li>
        </ul>
      </div>

      {/* About to expire */}
      {aboutToExpire.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-yellow-700 mb-4">About to expire (within 30 days)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aboutToExpire.map((p) => renderPolicyCard(p))}
          </div>
        </div>
      )}

      {/* Expired */}
      {expiredPolicies.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-fast-muted mb-4">Expired policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiredPolicies.map((p) => renderPolicyCard(p))}
          </div>
        </div>
      )}

      {/* Active */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-fast-approved mb-4">Active AI Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePolicies.length === 0 ? (
            <p className="text-fast-muted text-sm col-span-full">No active policies.</p>
          ) : (
            activePolicies.map((p) => renderPolicyCard(p))
          )}
        </div>
      </div>

      {/* Policy Versions Table */}
      <div className="bg-fast-panel rounded-lg shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-fast-text">Policy Versions</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fast-muted uppercase">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-fast-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {policies.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-sm text-fast-text">{p.version}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.displayStatus === 'active' ? 'bg-fast-green-light text-fast-approved' : p.displayStatus === 'expiring' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-fast-muted'
                  }`}>
                    {p.displayStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-fast-muted">{new Date(p.updatedAt).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewPolicy(p)} className="text-fast-teal hover:underline text-sm mr-2">View</button>
                  <button onClick={() => setEditPolicy(p)} className="text-fast-teal hover:underline text-sm mr-2">Edit</button>
                  <button onClick={() => setDeleteConfirm(p)} className="text-fast-declined hover:underline text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-fast-panel rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-fast-teal mb-4">Edit policy</h3>
            <EditForm
              name={editPolicy.name}
              category={editPolicy.category}
              onSave={handleEditSave}
              onCancel={() => setEditPolicy(null)}
            />
          </div>
        </div>
      )}

      {/* View policy modal */}
      {viewPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-fast-panel rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-fast-teal">{viewPolicy.name}</h3>
                <p className="text-sm text-fast-muted mt-0.5">
                  {viewPolicy.version} · {viewPolicy.category}
                </p>
              </div>
              <button
                onClick={() => setViewPolicy(null)}
                className="text-fast-muted hover:text-fast-text text-2xl leading-none p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 min-h-0">
              <pre className="text-sm text-fast-text font-mono whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-4">
                {viewPolicy.content ?? `# ${viewPolicy.name}\n\nNo content available.`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-fast-panel rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-fast-teal mb-2">Delete policy?</h3>
            <p className="text-sm text-fast-muted mb-4">
              &quot;{deleteConfirm.name}&quot; will be removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-md font-medium text-fast-text hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-fast-declined text-white rounded-md font-semibold hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditForm({
  name,
  category,
  onSave,
  onCancel,
}: {
  name: string;
  category: string;
  onSave: (v: { name: string; category: string }) => void;
  onCancel: () => void;
}) {
  const [editName, setEditName] = useState(name);
  const [editCategory, setEditCategory] = useState(category);
  return (
    <>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-fast-text mb-1">Policy name</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fast-text mb-1">Category</label>
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="Eligibility">Eligibility</option>
            <option value="Verification">Verification</option>
            <option value="Documentation">Documentation</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-200 rounded-md font-medium text-fast-text hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={() => onSave({ name: editName, category: editCategory })}
          className="flex-1 px-4 py-2 bg-fast-teal text-white rounded-md font-semibold hover:opacity-90"
        >
          Save
        </button>
      </div>
    </>
  );
}
