'use client';

import { BarChart3, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCases } from '@/hooks/useCases';
import type { CaseStatus } from '@/types';

const FRONTEND_VISIBLE_STATUSES: CaseStatus[] = [
  'READY_FOR_CASEWORKER_REVIEW',
  'PENDING', 'IN_PROGRESS', 'APPROVED', 'DECLINED', 'ESCALATED',
];

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: apiData } = useCases();
  const allCases =
    apiData?.cases
      ?.filter((c) => FRONTEND_VISIBLE_STATUSES.includes(c.status))
      .map((c) => ({
        id: c.caseId,
        status: c.status,
        priority: c.priority,
        assignedTo: c.assignedTo,
        applicantName: c.applicantName,
        assignedToName: c.assignedToName || '',
      })) ?? [];

  const myCases = user
    ? allCases.filter((c) => c.assignedTo === user.id)
    : allCases;

  const total     = myCases.length;
  const pending   = myCases.filter((c) => c.status === 'PENDING').length;
  const inProg    = myCases.filter((c) => c.status === 'IN_PROGRESS').length;
  const approved  = myCases.filter((c) => c.status === 'APPROVED').length;
  const declined  = myCases.filter((c) => c.status === 'DECLINED').length;
  const escalated = myCases.filter((c) => c.status === 'ESCALATED').length;

  const urgent   = myCases.filter((c) => c.priority === 'URGENT').length;
  const high     = myCases.filter((c) => c.priority === 'HIGH').length;
  const standard = myCases.filter((c) => c.priority === 'STANDARD').length;
  const low      = myCases.filter((c) => c.priority === 'LOW').length;

  const priorityMax = Math.max(urgent, high, standard, low, 1);

  const statCards = [
    { label: 'Total Cases',  value: total,     borderColor: 'border-l-fast-teal',    icon: <BarChart3 className="w-5 h-5" />, iconBg: 'bg-fast-teal-light text-fast-teal',   sub: 'All assigned cases' },
    { label: 'In Progress',  value: inProg,    borderColor: 'border-l-amber-400',    icon: <Clock className="w-5 h-5" />,     iconBg: 'bg-amber-50 text-amber-600',          sub: 'Actively being reviewed' },
    { label: 'Approved',     value: approved,  borderColor: 'border-l-fast-approved', icon: <CheckCircle2 className="w-5 h-5" />, iconBg: 'bg-fast-green-light text-fast-approved', sub: 'Successfully processed' },
    { label: 'Escalated',    value: escalated, borderColor: 'border-l-fast-escalated', icon: <AlertTriangle className="w-5 h-5" />, iconBg: 'bg-orange-50 text-fast-escalated',   sub: escalated > 0 ? 'Needs attention' : 'No escalations' },
  ];

  const statusBars = [
    { label: 'Pending',     count: pending,   color: 'bg-amber-400' },
    { label: 'In Progress', count: inProg,    color: 'bg-fast-teal' },
    { label: 'Approved',    count: approved,  color: 'bg-fast-approved' },
    { label: 'Declined',    count: declined,  color: 'bg-fast-declined' },
    { label: 'Escalated',   count: escalated, color: 'bg-fast-escalated' },
  ];

  const priorityBars = [
    { label: 'Urgent',   count: urgent,   color: 'bg-fast-urgent' },
    { label: 'High',     count: high,     color: 'bg-fast-high' },
    { label: 'Standard', count: standard, color: 'bg-fast-standard' },
    { label: 'Low',      count: low,      color: 'bg-gray-400' },
  ];

  return (
    <div className="p-6 max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-fast-text">Analytics Dashboard</h1>
        <p className="text-sm text-fast-muted mt-1">
          Welcome back, {user?.name ?? 'User'}. Here is your performance overview.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-fast-panel rounded-card border border-gray-200 border-l-4 ${card.borderColor} p-5`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-fast-muted uppercase tracking-wide">{card.label}</p>
              <div className={`w-9 h-9 ${card.iconBg} rounded flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-semibold text-fast-text">{card.value}</p>
            <p className={`text-xs mt-1 ${card.label === 'Escalated' && escalated > 0 ? 'text-fast-escalated font-medium' : 'text-fast-muted'}`}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-fast-panel rounded-card border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-fast-text mb-5">Case Status Distribution</h2>
          <div className="space-y-3">
            {statusBars.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
                <span className="text-sm text-fast-text w-24">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-fast-muted w-16 text-right tabular-nums">
                  {item.count} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-fast-panel rounded-card border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-fast-text mb-5">Priority Distribution</h2>
          <div className="space-y-3">
            {priorityBars.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-fast-text w-20">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.count / priorityMax) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-fast-muted w-6 text-right tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="bg-fast-panel rounded-card border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-fast-text">Recent Cases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="px-6 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Case ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fast-muted uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myCases.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-fast-teal">{c.id}</td>
                  <td className="px-6 py-3 text-sm text-fast-text">{c.applicantName}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-0.5 text-2xs font-medium rounded-full ${
                      c.status === 'APPROVED'    ? 'bg-fast-green-light text-fast-approved' :
                      c.status === 'DECLINED'    ? 'bg-fast-red-light text-fast-declined' :
                      c.status === 'ESCALATED'   ? 'bg-fast-orange-light text-fast-escalated' :
                      c.status === 'IN_PROGRESS' ? 'bg-fast-teal-light text-fast-teal' :
                                                   'bg-amber-50 text-amber-700'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm font-medium" style={{
                    color: c.priority === 'URGENT' ? '#f44336' : c.priority === 'HIGH' ? '#ff9800' : '#64748b'
                  }}>
                    {c.priority}
                  </td>
                </tr>
              ))}
              {myCases.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-fast-muted text-sm">
                    No cases assigned to you.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
