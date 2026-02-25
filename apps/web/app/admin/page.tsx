'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function adminFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
    return (
        <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 12,
            padding: '1.5rem',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
        }}>
            <div style={{
                width: 52, height: 52, borderRadius: 12,
                backgroundColor: `${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</div>
            </div>
        </div>
    );
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch('/admin/stats')
            .then(r => r.json())
            .then(setStats)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-heading)', marginBottom: '0.4rem' }}>
                    Overview
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Platform-wide metrics at a glance.
                </p>
            </div>

            {loading ? (
                <p style={{ color: 'var(--text-dim)' }}>Loading stats…</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <StatCard label="Total Users" value={stats?.userCount ?? '—'} icon="👤" color="#6f42c1" />
                    <StatCard label="Total Posts" value={stats?.postCount ?? '—'} icon="📝" color="#2563eb" />
                    <StatCard label="Connected Accounts" value={stats?.socialAccountCount ?? '—'} icon="🔗" color="#059669" />
                    <StatCard label="Queue Depth" value={stats?.queueDepth ?? '—'} icon="⚙️" color={stats?.queueDepth > 10 ? '#dc2626' : '#f59e0b'} />
                </div>
            )}

            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem', color: 'var(--color-heading)' }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <a href="/admin/users" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'rgba(111, 66, 193, 0.12)', borderRadius: 8, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                        Manage Users →
                    </a>
                    <a href="/admin/flags" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'rgba(5, 150, 105, 0.1)', borderRadius: 8, color: '#059669', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                        Feature Flags →
                    </a>
                    <a href="/admin/health" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 8, color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                        System Health →
                    </a>
                    <a href="/admin/audit-logs" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, color: '#f59e0b', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                        Audit Logs →
                    </a>
                </div>
            </div>
        </div>
    );
}
