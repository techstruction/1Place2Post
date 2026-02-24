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
