'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Bell,
  Settings,
  AlertTriangle,
  Users,
  FileText,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

const iconCls = 'w-[18px] h-[18px] flex-shrink-0';

const caseworkerNav: NavItem[] = [
  { href: '/dashboard',     label: 'Dashboard',       icon: <LayoutDashboard className={iconCls} /> },
  { href: '/cases',         label: 'Case Management', icon: <FolderOpen className={iconCls} /> },
  { href: '/notifications', label: 'Notifications',   icon: <Bell className={iconCls} /> },
  { href: '/settings',      label: 'Settings',        icon: <Settings className={iconCls} /> },
];

const managerNav: NavItem[] = [
  { href: '/dashboard',     label: 'Dashboard',       icon: <LayoutDashboard className={iconCls} /> },
  { href: '/cases',         label: 'Case Management', icon: <FolderOpen className={iconCls} /> },
  { href: '/escalated',     label: 'Escalated Cases', icon: <AlertTriangle className={iconCls} /> },
  { href: '/notifications', label: 'Notifications',   icon: <Bell className={iconCls} /> },
  { href: '/settings',      label: 'Settings',        icon: <Settings className={iconCls} /> },
];

const adminNav: NavItem[] = [
  { href: '/dashboard',       label: 'Dashboard',         icon: <LayoutDashboard className={iconCls} /> },
  { href: '/admin/users',     label: 'User Management',   icon: <Users className={iconCls} /> },
  { href: '/admin/policies',  label: 'Policy Management', icon: <FileText className={iconCls} /> },
  { href: '/notifications',   label: 'Notifications',     icon: <Bell className={iconCls} /> },
  { href: '/settings',        label: 'Settings',          icon: <Settings className={iconCls} /> },
];

const ADMIN_RESTRICTED = ['/cases', '/escalated', '/email-review'];
const CASEWORKER_RESTRICTED = ['/admin'];
const ESCALATED_ONLY_MANAGER = '/escalated';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { data: notifsData } = useNotifications();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    if (
      user.role === 'ADMIN' &&
      ADMIN_RESTRICTED.some((r) => pathname?.startsWith(r))
    ) {
      router.replace('/dashboard');
      return;
    }
    if (
      (user.role === 'CASEWORKER' || user.role === 'MANAGER') &&
      CASEWORKER_RESTRICTED.some((r) => pathname?.startsWith(r))
    ) {
      router.replace('/dashboard');
      return;
    }
    if (user.role === 'CASEWORKER' && pathname === ESCALATED_ONLY_MANAGER) {
      router.replace('/dashboard');
    }
  }, [pathname, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fast-bg">
        <p className="text-fast-muted text-sm">Loading...</p>
      </div>
    );
  }

  const navItems = user.role === 'ADMIN' ? adminNav : user.role === 'MANAGER' ? managerNav : caseworkerNav;

  const unreadCount = (notifsData?.notifications ?? []).filter((n) => !n.read).length;
  const navWithBadges = navItems.map((item) =>
    item.href === '/notifications' && unreadCount > 0
      ? { ...item, badge: unreadCount }
      : item
  );

  const initials = (user.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'U';

  const roleBadgeColor =
    user.role === 'ADMIN'   ? 'bg-fast-admin text-white' :
    user.role === 'MANAGER' ? 'bg-fast-manager text-white' :
                              'bg-fast-green-light text-fast-approved';

  const roleLabel =
    user.role === 'ADMIN'   ? 'Admin' :
    user.role === 'MANAGER' ? 'Manager' : 'Caseworker';

  return (
    <div className="flex min-h-screen bg-fast-bg">
      {/* Sidebar */}
      <aside className="w-60 bg-fast-sidebar flex flex-col flex-shrink-0 border-r border-white/5">
        {/* Logo + branding */}
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-5">
            <img
              src="/version1-logo.svg"
              alt="Version 1"
              className="h-8 w-auto object-contain"
            />
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-fast-cyan">VERSION 1</p>
              <p className="text-xs text-white font-medium">FastStartAI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-2xs font-medium rounded-full ${roleBadgeColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navWithBadges.map(({ href, label, icon, badge }) => {
            const isActive =
              pathname === href ||
              (href !== '/dashboard' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors relative',
                  isActive
                    ? 'bg-white/12 text-white border-l-2 border-white ml-0 pl-[10px]'
                    : 'text-white/70 hover:bg-white/8 hover:text-white border-l-2 border-transparent ml-0 pl-[10px]'
                )}
              >
                {icon}
                <span className="flex-1">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-fast-declined rounded-full flex items-center justify-center text-white text-2xs font-semibold">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium text-white/80 hover:bg-white/8 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-fast-bg">
        {children}
      </main>
    </div>
  );
}
