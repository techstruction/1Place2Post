'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearToken } from '../../lib/api';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        try {
            const token = localStorage.getItem('1p2p_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setIsAdmin(payload.role === 'ADMIN');
            }
        } catch { /* non-critical */ }
    }, []);

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
        { href: '/dashboard/team', label: '👥 Team', icon: '👥' },
        { href: '/dashboard/subscription', label: '💳 Subscription Plans', icon: '💳' },
        { href: '/dashboard/support', label: '🎫 Support', icon: '🎫' },
        { href: '/docs/user', label: '📖 Documentation', icon: '📖' },
    ];

    const adminItems = isAdmin ? [{ href: '/admin', label: '🔒 Admin Console', icon: '🔒' }] : [];

    // Separate icon and text based on label string format "icon word(s)"
    const parseLabel = (label: string) => {
        const parts = label.split(' ');
        const icon = parts[0];
        const text = parts.slice(1).join(' ');
        return { icon, text };
    };

    return (
        <div className="layout">
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-logo">
                    <span className="logo-icon" style={{ cursor: 'pointer', marginRight: isCollapsed ? 0 : '10px' }}>1</span>
                    <span className="logo-text">Place</span>
                    <span className="nav-item-label">2Post</span>
                    {!isCollapsed && (
                        <button
                            className="sidebar-toggle-btn"
                            onClick={() => setIsCollapsed(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto' }}
                            title="Collapse Sidebar"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                    )}
                </div>
                {isCollapsed && (
                    <button
                        className="sidebar-toggle-btn"
                        onClick={() => setIsCollapsed(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem' }}
                        title="Expand Sidebar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                )}

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {[...navItems, ...adminItems].map(item => {
                        const { icon, text } = parseLabel(item.label);
                        return (
                            <Link key={item.href} href={item.href}
                                className={`nav-item${pathname.startsWith(item.href) && item.href !== '/dashboard' ? ' active' : pathname === item.href ? ' active' : ''}`}
                                title={text}>
                                <span>{icon}</span>
                                <span className="nav-item-label">{text}</span>
                            </Link>
                        );
                    })}
                </nav>
                <button id="logout-btn" onClick={logout} className="nav-item btn-ghost"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginTop: 'auto' }}
                    title="Log out">
                    <span>🚪</span>
                    <span className="nav-item-label">Log out</span>
                </button>
            </aside>
            <main className={`main-content ${isCollapsed ? 'expanded' : ''}`}>{children}</main>
        </div>
    );
}
