'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types';
import { UserPlus, Shield, Settings, ArrowUp, CheckCircle2, XCircle, ClipboardList, Clock } from 'lucide-react';
import type { ReactNode } from 'react';

const TYPE_CONFIG: Record<NotificationType, { icon: ReactNode; bg: string; borderLeft: string; label: string }> = {
  USER_CREATED:         { icon: <UserPlus className="w-4 h-4" />,       bg: 'bg-fast-purple-light', borderLeft: 'border-l-fast-admin',     label: 'User Created' },
  ROLE_UPDATED:         { icon: <Shield className="w-4 h-4" />,          bg: 'bg-fast-purple-light', borderLeft: 'border-l-fast-admin',     label: 'Role Updated' },
  SYSTEM_ALERT:         { icon: <Settings className="w-4 h-4" />,        bg: 'bg-gray-50',           borderLeft: 'border-l-gray-400',       label: 'System Alert' },
  ESCALATION_ASSIGNED:  { icon: <ArrowUp className="w-4 h-4" />,         bg: 'bg-fast-orange-light', borderLeft: 'border-l-fast-escalated', label: 'Escalation' },
  CASE_APPROVED:        { icon: <CheckCircle2 className="w-4 h-4" />,    bg: 'bg-fast-green-light',  borderLeft: 'border-l-fast-approved',  label: 'Case Approved' },
  CASE_DECLINED:        { icon: <XCircle className="w-4 h-4" />,         bg: 'bg-fast-red-light',    borderLeft: 'border-l-fast-declined',  label: 'Case Declined' },
  CASE_ASSIGNED:        { icon: <ClipboardList className="w-4 h-4" />,    bg: 'bg-fast-teal-light',   borderLeft: 'border-l-fast-teal',       label: 'Case Assigned' },
  DEADLINE_APPROACHING: { icon: <Clock className="w-4 h-4" />,           bg: 'bg-fast-red-light',    borderLeft: 'border-l-fast-declined',  label: 'Deadline' },
};

type FilterTab = 'ALL' | 'UNREAD' | 'SYSTEM' | 'ESCALATIONS' | 'CASES';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: apiNotifs } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(apiNotifs?.notifications ?? []);
  }, [apiNotifs]);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'UNREAD':      return notifications.filter((n) => !n.read);
      case 'SYSTEM':      return notifications.filter((n) => n.type === 'SYSTEM_ALERT' || n.type === 'ROLE_UPDATED' || n.type === 'USER_CREATED');
      case 'ESCALATIONS': return notifications.filter((n) => n.type === 'ESCALATION_ASSIGNED');
      case 'CASES':       return notifications.filter((n) => ['CASE_APPROVED','CASE_DECLINED','CASE_ASSIGNED','DEADLINE_APPROACHING'].includes(n.type));
      default:            return notifications;
    }
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markReadMutation.mutate(id);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'ALL',        label: `All (${notifications.length})` },
    { id: 'UNREAD',     label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { id: 'SYSTEM',     label: 'System' },
    { id: 'ESCALATIONS', label: 'Escalations' },
    ...(user?.role !== 'ADMIN' ? [{ id: 'CASES' as FilterTab, label: 'Case Updates' }] : []),
  ];

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-fast-text">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-fast-declined text-white rounded-full text-2xs font-semibold">
                {unreadCount} Unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-medium text-fast-teal hover:underline flex items-center gap-1"
            >
              Mark all as read
            </button>
          )}
        </div>
        <p className="text-sm text-fast-muted mt-1">
          {user?.role === 'ADMIN'
            ? 'System alerts, user management events, and escalation notices'
            : 'Case assignments, deadlines, escalations, and system updates'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-fast-teal text-white'
                : 'bg-gray-200 text-fast-muted hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-fast-panel rounded-card border border-gray-200 p-10 text-center">
            <p className="text-fast-muted text-sm">No notifications in this category.</p>
          </div>
        ) : (
          filtered.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type as NotificationType] ?? TYPE_CONFIG['SYSTEM_ALERT'];
            return (
              <div
                key={notif.id}
                className={`${cfg.bg} border-l-4 ${cfg.borderLeft} bg-fast-panel rounded-card border border-gray-200 p-4 flex items-start justify-between gap-3 ${
                  !notif.read ? 'ring-1 ring-inset ring-black/5' : 'opacity-80'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center flex-shrink-0 text-fast-muted">
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {!notif.read && (
                        <span className="w-2 h-2 bg-fast-teal rounded-full flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-fast-text text-sm">{notif.title}</h3>
                      <span className={`text-2xs px-2 py-0.5 rounded-full ${cfg.bg} text-fast-muted`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-fast-text">{notif.message}</p>
                    <p className="text-2xs text-fast-muted mt-1">{formatTime(notif.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {!notif.read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="px-2 py-1 text-2xs text-fast-teal hover:bg-white/60 rounded transition-colors"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
