'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function adminFetch(path: string) {
    return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
}

function HealthBadge({ ok }: { ok: boolean }) {
    return (
        <span style={{
            display: 'inline-block', padding: '0.25rem 0.8rem', borderRadius: 20,
            fontSize: '0.8rem', fontWeight: 700,
            backgroundColor: ok ? 'rgba(5, 150, 105, 0.15)' : 'rgba(220, 38, 38, 0.15)',
            color: ok ? '#059669' : '#dc2626',
        }}>
            {ok ? '✓ Healthy' : '✕ Down'}
        </span>
    );
}

export default function AdminHealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<boolean>(false);

    function refresh() {
        setLoading(true);
        setError(false);
        adminFetch('/admin/health')
            .then(async (r) => {
                if (!r.ok) throw new Error('Health check failed');
                const data = await r.json();
                setHealth(data);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }

    useEffect(() => { refresh(); }, []);

    const uptime = health ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '—';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-heading)', marginBottom: '0.4rem' }}>Platform Health</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Live status of core system components.</p>
                </div>
                <button className="btn btn-ghost" onClick={refresh} disabled={loading}>🔄 Refresh</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                    { label: 'API Server', ok: health?.api ?? false, detail: `Uptime: ${uptime}` },
                    { label: 'Database (PostgreSQL)', ok: health?.database ?? false, detail: 'Primary DB connection' },
                    { label: 'Auth Service (JWT)', ok: health?.api ?? false, detail: 'Token validation active' },
                ].map(row => (
                    <div key={row.label} style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-heading)' }}>{row.label}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>{row.detail}</div>
                        </div>
                        {loading ? <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Checking…</span> : <HealthBadge ok={!error && row.ok} />}
                    </div>
                ))}
            </div>
        </div>
    );
}
