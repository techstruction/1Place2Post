'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearToken } from '../../lib/api';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, FileText, Calendar, Image, LayoutTemplate,
  Sparkles, BarChart2, Send, Rss, MessageSquare, Users, Bell,
  CheckSquare, Link as LinkIcon, Globe, Bot, UserCog, CreditCard,
  LifeBuoy, BookOpen, ShieldCheck, LogOut, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { AccountHealthDot, getAccountHealth } from '../../components/AccountHealthDot';
import { PublishFailureBanner } from '../../components/PublishFailureBanner';

type SocialAccount = {
  id: string;
  platform: string;
  handle: string | null;
  isActive: boolean;
  tokenExpiresAt: string | null;
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/posts', label: 'Posts', icon: FileText },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/media', label: 'Media', icon: Image },
  { href: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/dashboard/ai-studio', label: 'AI Studio', icon: Sparkles },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/jobs', label: 'Publish Queue', icon: Send },
  { href: '/dashboard/inbox', label: 'Unified Inbox', icon: MessageSquare },
  { href: '/dashboard/leads', label: 'Leads Pipeline', icon: Users },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/approvals', label: 'Approvals', icon: CheckSquare },
  { href: '/dashboard/rss-campaigns', label: 'RSS Campaigns', icon: Rss },
  { href: '/dashboard/outgoing-webhooks', label: 'Webhooks', icon: Zap },
  { href: '/dashboard/connections', label: 'Connections', icon: LinkIcon },
  { href: '/dashboard/link-pages', label: 'Link Pages', icon: Globe },
  { href: '/dashboard/bot-rules', label: 'Bot Rules', icon: Bot },
  { href: '/dashboard/team', label: 'Team', icon: UserCog },
  { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { href: '/docs/user', label: 'Documentation', icon: BookOpen },
];

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TWITTER: 'Twitter/X',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);

  useEffect(() => {
    try {
      const token = localStorage.getItem('1p2p_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.role === 'ADMIN');
      }
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('1p2p_token');
    if (!token) return () => controller.abort();
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/social-accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : [])
      .then(setAccounts)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  function logout() {
    clearToken();
    router.push('/login');
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const allNavItems = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Console', icon: ShieldCheck, exact: false }] : []),
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="logo-icon" style={{ cursor: 'pointer', marginRight: isCollapsed ? 0 : 10 }}>1</span>
          {!isCollapsed && (
            <>
              <span className="logo-text">Place</span>
              <span className="nav-item-label">2Post</span>
            </>
          )}
          {!isCollapsed && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsCollapsed(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}
              title="Collapse"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1rem', alignSelf: 'center' }}
            title="Expand"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {allNavItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item${isActive(href, exact) ? ' active' : ''}`}
              title={isCollapsed ? label : undefined}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span className="nav-item-label">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Account Health */}
        {accounts.length > 0 && !isCollapsed && (
          <div style={{
            borderTop: '1px solid var(--border-default)',
            paddingTop: 12,
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              Connections
            </span>
            {accounts.slice(0, 5).map(account => {
              const { status, tooltip } = getAccountHealth(account);
              return (
                <Link
                  key={account.id}
                  href="/dashboard/connections"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                  }}
                  title={tooltip}
                >
                  <AccountHealthDot status={status} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {PLATFORM_LABELS[account.platform] ?? account.platform}
                    {account.handle && (
                      <span style={{ color: 'var(--text-dim)' }}> @{account.handle}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={logout}
          className="nav-item btn-ghost"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginTop: 8 }}
          title="Log out"
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          <span className="nav-item-label">Log out</span>
        </button>
      </aside>

      {/* Main content area */}
      <div className={`main-content ${isCollapsed ? 'expanded' : ''}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0 }}>
        <PublishFailureBanner />
        <div style={{ flex: 1, padding: '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
