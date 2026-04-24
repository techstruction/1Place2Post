'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function adminFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

const DEFAULT_FLAGS = [
    { key: 'enable_registrations', description: 'Allow new user sign-ups', enabled: true },
    { key: 'enable_ai_studio', description: 'Enable AI Studio for caption generation', enabled: true },
    { key: 'enable_bot_rules', description: 'Enable automated Bot Rule processing', enabled: true },
    { key: 'maintenance_mode', description: 'Put site into read-only maintenance mode', enabled: false },
];

type Flag = { key: string; description: string; enabled: boolean; };

export default function AdminFlagsPage() {
    const [flags, setFlags] = useState<Flag[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    useEffect(() => {
        adminFetch('/admin/flags')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setFlags(data);
                } else {
                    // seed local defaults since the AuditLog/FeatureFlag tables may not be migrated yet
                    setFlags(DEFAULT_FLAGS);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    async function toggle(key: string, enabled: boolean) {
        setToggling(key);
        try {
            await adminFetch(`/admin/flags/${key}`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
            setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled } : f));
        } finally {
            setToggling(null);
        }
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Feature Flags</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Toggle platform features without deploying code. Changes take effect immediately.
                </p>
            </div>

            {loading ? (
                <p style={{ color: 'var(--text-dim)' }}>Loading flags…</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {flags.map(flag => (
                        <div key={flag.key} style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '1.1rem 1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>{flag.key}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{flag.description}</div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                                <span style={{ fontSize: '0.85rem', color: flag.enabled ? '#059669' : 'var(--text-muted)', fontWeight: 600 }}>
                                    {flag.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <div
                                    onClick={() => toggle(flag.key, !flag.enabled)}
                                    style={{
                                        width: 44, height: 24, borderRadius: 12,
                                        backgroundColor: flag.enabled ? '#059669' : 'var(--border)',
                                        position: 'relative',
                                        transition: 'background-color 0.2s',
                                        cursor: toggling === flag.key ? 'not-allowed' : 'pointer',
                                        opacity: toggling === flag.key ? 0.6 : 1,
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 3, left: flag.enabled ? 23 : 3,
                                        width: 18, height: 18, borderRadius: '50%',
                                        backgroundColor: 'white',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                    }} />
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
