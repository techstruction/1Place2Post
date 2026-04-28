'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearToken } from '../../lib/api';
import { useEffect, useState } from 'react';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  OverviewIcon, PostsIcon, CalendarIcon, MediaIcon, TemplatesIcon,
  AIStudioIcon, AnalyticsIcon, PublishQueueIcon, InboxIcon, LeadsIcon,
  NotificationsIcon, ApprovalsIcon, RSSIcon, WebhooksIcon, ConnectionsIcon,
  LinkPagesIcon, BotRulesIcon, TeamIcon, SubscriptionIcon, SupportIcon,
  DocsIcon, AdminIcon,
} from '../../components/nav-icons';
import { AccountHealthDot, getAccountHealth } from '../../components/AccountHealthDot';
import { PublishFailureBanner } from '../../components/PublishFailureBanner';
import { ThemeToggle } from '../../components/theme-toggle';

type SocialAccount = {
  id: string;
  platform: string;
  username: string | null;
  handle?: string | null;
  isActive: boolean;
  tokenStatus: string | null;
  tokenExpiresAt?: string | null;
};

const NAV_ITEMS = [
  { href: '/dashboard',                   label: 'Overview',       icon: OverviewIcon,      exact: true },
  { href: '/dashboard/posts',             label: 'Posts',          icon: PostsIcon },
  { href: '/dashboard/calendar',          label: 'Calendar',       icon: CalendarIcon },
  { href: '/dashboard/media',             label: 'Media',          icon: MediaIcon },
  { href: '/dashboard/templates',         label: 'Templates',      icon: TemplatesIcon },
  { href: '/dashboard/ai-studio',         label: 'AI Studio',      icon: AIStudioIcon },
  { href: '/dashboard/analytics',         label: 'Analytics',      icon: AnalyticsIcon },
  { href: '/dashboard/jobs',              label: 'Publish Queue',  icon: PublishQueueIcon },
  { href: '/dashboard/inbox',             label: 'Unified Inbox',  icon: InboxIcon },
  { href: '/dashboard/leads',             label: 'Leads Pipeline', icon: LeadsIcon },
  { href: '/dashboard/notifications',     label: 'Notifications',  icon: NotificationsIcon },
  { href: '/dashboard/approvals',         label: 'Approvals',      icon: ApprovalsIcon },
  { href: '/dashboard/rss-campaigns',     label: 'RSS Campaigns',  icon: RSSIcon },
  { href: '/dashboard/outgoing-webhooks', label: 'Webhooks',       icon: WebhooksIcon },
  { href: '/dashboard/connections',       label: 'Connections',    icon: ConnectionsIcon },
  { href: '/dashboard/link-pages',        label: 'Link Pages',     icon: LinkPagesIcon },
  { href: '/dashboard/bot-rules',         label: 'Bot Rules',      icon: BotRulesIcon },
  { href: '/dashboard/workspace',          label: 'Workspace',      icon: TeamIcon },
  { href: '/dashboard/subscription',      label: 'Subscription',   icon: SubscriptionIcon },
  { href: '/dashboard/support',           label: 'Support',        icon: SupportIcon },
  { href: '/docs/user',                   label: 'Documentation',  icon: DocsIcon },
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
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; myRole: string }[]>([]);
  const [activeWsName, setActiveWsName] = useState<string>('');
  const [showWsSwitcher, setShowWsSwitcher] = useState(false);

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

  useEffect(() => {
    const token = localStorage.getItem('1p2p_token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/workspaces/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then((list: { id: string; name: string; myRole: string }[]) => {
        setWorkspaces(list);
        const activeId = localStorage.getItem('1p2p_activeWorkspace') ?? list[0]?.id;
        const active = list.find(w => w.id === activeId) ?? list[0];
        if (active) {
          setActiveWsName(active.name);
          localStorage.setItem('1p2p_activeWorkspace', active.id);
        }
      })
      .catch(() => {});
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
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Console', icon: AdminIcon, exact: false }] : []),
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="1Place2Post"
            style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, objectFit: 'cover' }}
          />
          {!isCollapsed && (
            <>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em', whiteSpace: 'nowrap', marginLeft: 10, lineHeight: 1 }}>
                <span style={{ color: '#E06028' }}>1</span>
                <span style={{ color: '#4B8EC4' }}>Place</span>
                <span style={{ color: '#E06028' }}>2</span>
                <span style={{ color: '#4B8EC4' }}>Post</span>
              </span>
              <button
                className="sidebar-toggle-btn"
                onClick={e => { e.stopPropagation(); setIsCollapsed(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}
                title="Collapse"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          )}
        </div>

        {/* Workspace switcher */}
        {workspaces.length > 0 && !isCollapsed && (
          <div style={{ padding: '0.25rem 0', borderBottom: '1px solid var(--border-default)', marginBottom: '0.5rem' }}>
            <button
              onClick={() => setShowWsSwitcher(s => !s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 8,
                padding: '6px 10px', cursor: 'pointer', color: 'var(--text-primary)',
                fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: 6, background: 'var(--brand-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {activeWsName.charAt(0).toUpperCase() || '?'}
              </span>
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeWsName || 'Select workspace'}
              </span>
              <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
            </button>
            {showWsSwitcher && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {workspaces.map(ws => (
                  <button key={ws.id}
                    onClick={() => {
                      localStorage.setItem('1p2p_activeWorkspace', ws.id);
                      setActiveWsName(ws.name);
                      setShowWsSwitcher(false);
                      window.location.reload();
                    }}
                    style={{
                      background: 'none', border: 'none', textAlign: 'left',
                      padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                      color: 'var(--text-secondary)', fontSize: '0.8rem',
                    }}
                  >
                    {ws.name}
                  </button>
                ))}
                <button
                  onClick={() => { router.push('/dashboard/workspace'); setShowWsSwitcher(false); }}
                  style={{ background: 'none', border: 'none', textAlign: 'left', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', color: 'var(--brand-500)', fontSize: '0.8rem' }}
                >
                  + New Workspace
                </button>
              </div>
            )}
          </div>
        )}

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
              <Icon />
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
                    {(account.username ?? account.handle) && (
                      <span style={{ color: 'var(--text-dim)' }}> @{account.username ?? account.handle}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Theme toggle + Logout */}
        <div style={{ marginTop: 8 }}>
          <ThemeToggle collapsed={isCollapsed} />
          <button
            id="logout-btn"
            onClick={logout}
            className="nav-item btn-ghost"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Log out"
          >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            <span className="nav-item-label">Log out</span>
          </button>
        </div>
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
