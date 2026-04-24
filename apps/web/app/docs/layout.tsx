import Link from 'next/link';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
            <aside style={{
                width: 250,
                borderRight: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card)',
                padding: '1.5rem',
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflowY: 'auto'
            }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2rem' }}>
                    1<span>Place</span>2Post Docs
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem' }}>Guides</div>
                    <Link href="/docs/user" className="nav-item">📚 User Manual</Link>
                    <Link href="/docs/admin" className="nav-item">⚙️ Admin Guide</Link>

                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2rem', marginBottom: '0.5rem' }}>App</div>
                    <Link href="/dashboard" className="nav-item" style={{ opacity: 0.8 }}>← Back to Dashboard</Link>
                </nav>
            </aside>
            <main style={{ flex: 1, padding: '2rem 4rem', maxWidth: 900, overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
