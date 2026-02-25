'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_NAV = [
    { href: '/admin', label: '📊 Overview', exact: true },
    { href: '/admin/users', label: '👤 Users' },
    { href: '/admin/health', label: '🟢 Platform Health' },
    { href: '/admin/audit-logs', label: '📋 Audit Logs' },
    { href: '/admin/flags', label: '🚩 Feature Flags' },
    { href: '/admin/settings', label: '⚙️ Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Check token has ADMIN role
        const token = localStorage.getItem('1p2p_token');
        if (!token) { router.push('/login'); return; }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role !== 'ADMIN') { router.push('/dashboard'); return; }
            setAuthorized(true);
        } catch {
            router.push('/login');
        }
    }, [router]);

    if (!authorized) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
            <p style={{ color: 'var(--text-dim)' }}>Verifying admin access…</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
            {/* Sidebar */}
            <aside style={{
                width: 240,
                backgroundColor: 'var(--bg-card)',
                borderRight: '1px solid var(--border)',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflowY: 'auto',
            }}>
                <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                        1Place2Post
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-heading)' }}>
                        🔒 Admin Console
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    {ADMIN_NAV.map(item => {
                        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                        return (
                            <Link key={item.href} href={item.href} style={{
                                display: 'block',
                                padding: '0.55rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: active ? 600 : 400,
                                color: active ? 'var(--primary)' : 'var(--text-dim)',
                                backgroundColor: active ? 'rgba(111, 66, 193, 0.1)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                            }}>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <Link href="/dashboard" style={{ display: 'block', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', borderRadius: '6px' }}>
                        ← Back to Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', maxWidth: 1100 }}>
                {children}
            </main>
        </div>
    );
}
