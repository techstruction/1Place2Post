'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearToken } from '../../lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    function logout() {
        clearToken();
        router.push('/login');
    }

    const navItems = [
        { href: '/dashboard', label: '📊 Overview' },
        { href: '/dashboard/posts', label: '📝 Posts' },
        { href: '/dashboard/calendar', label: '📅 Calendar' },
        { href: '/dashboard/media', label: '📁 Media' },
        { href: '/dashboard/templates', label: '📋 Templates' },
        { href: '/dashboard/ai-studio', label: '🤖 AI Studio' },
        { href: '/dashboard/analytics', label: '📈 Analytics' },
        { href: '/dashboard/jobs', label: '⚙️ Publish Queue' },
        { href: '/dashboard/inbox', label: '📫 Unified Inbox' },
        { href: '/dashboard/leads', label: '🎯 Leads Pipeline' },
        { href: '/dashboard/notifications', label: '🔔 Notifications' },
        { href: '/dashboard/approvals', label: '✅ Approvals' },
        { href: '/dashboard/rss-campaigns', label: '📡 RSS Campaigns' },
        { href: '/dashboard/outgoing-webhooks', label: '📤 Webhooks' },
        { href: '/dashboard/connections', label: '🔗 Connections' },
        { href: '/dashboard/link-pages', label: '🌐 Link Pages' },
        { href: '/dashboard/bot-rules', label: '🤖 Bot Rules' },
        { href: '/dashboard/team', label: '👥 Team' },
        { href: '/dashboard/support', label: '🎫 Support' },
    ];

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-logo">1<span>Place</span>2Post</div>
                <nav style={{ flex: 1 }}>
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href}
                            className={`nav-item${pathname === item.href ? ' active' : ''}`}>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <button id="logout-btn" onClick={logout} className="nav-item btn-ghost"
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    🚪 Log out
                </button>
            </aside>
            <main className="main-content">{children}</main>
        </div>
    );
}
