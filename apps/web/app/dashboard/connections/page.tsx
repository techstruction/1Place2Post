'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { socialApi } from '../../../lib/api';

const PLATFORMS = [
    { value: 'INSTAGRAM', label: '📸 Instagram' },
    { value: 'TIKTOK', label: '🎵 TikTok' },
    { value: 'FACEBOOK', label: '👥 Facebook' },
    { value: 'YOUTUBE', label: '▶️ YouTube' },
    { value: 'TWITTER', label: '🐦 Twitter/X' },
];

type SocialAccount = {
    id: string; platform: string; username: string | null; displayName: string | null;
    tokenExpiring: boolean; tokenExpired: boolean; tokenExpiry: string | null;
};

export default function ConnectionsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ platform: 'INSTAGRAM', platformId: '', username: '', accessToken: '', tokenExpiry: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        socialApi.list()
            .then(setAccounts)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const created = await socialApi.create({
                platform: form.platform,
                platformId: form.platformId,
                username: form.username || undefined,
                accessToken: form.accessToken,
                tokenExpiry: form.tokenExpiry || undefined,
            });
            setAccounts(a => [{ ...created, tokenExpiring: false, tokenExpired: false }, ...a]);
            setShowAdd(false);
            setForm({ platform: 'INSTAGRAM', platformId: '', username: '', accessToken: '', tokenExpiry: '' });
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm('Disconnect this account?')) return;
        await socialApi.delete(id);
        setAccounts(a => a.filter(x => x.id !== id));
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Connections</h1>
                <button id="add-account-btn" onClick={() => setShowAdd(s => !s)} className="btn btn-primary">
                    {showAdd ? '✕ Cancel' : '+ Connect Account'}
                </button>
            </div>

            {showAdd && (
                <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Add Account (manual token)</h2>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleAdd}>
                        <div className="form-group">
                            <label className="form-label">Platform</label>
                            <select className="form-input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Platform User/Page ID *</label>
                            <input className="form-input" required value={form.platformId} onChange={e => setForm(f => ({ ...f, platformId: e.target.value }))} placeholder="e.g. 17841400123456789" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Username (optional)</label>
                            <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="@handle" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Access Token *</label>
                            <input className="form-input" required type="password" value={form.accessToken} onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))} placeholder="Paste your access token" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Token Expiry (optional)</label>
                            <input className="form-input" type="datetime-local" value={form.tokenExpiry} onChange={e => setForm(f => ({ ...f, tokenExpiry: e.target.value }))} />
                        </div>
                        <button id="save-account-btn" type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Connecting…' : '🔗 Connect'}
                        </button>
                    </form>
                </div>
            )}

            <div className="card">
                {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading…</p> : accounts.length === 0 ? (
                    <div className="empty"><h3>No connected accounts</h3><p>Connect a social account to start publishing.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Platform</th><th>Account</th><th>Token Status</th><th>Expiry</th><th></th></tr></thead>
                            <tbody>
                                {accounts.map(a => (
                                    <tr key={a.id}>
                                        <td>{PLATFORMS.find(p => p.value === a.platform)?.label ?? a.platform}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{a.username ?? a.displayName ?? '—'}</td>
                                        <td>
                                            {a.tokenExpired
                                                ? <span className="badge badge-failed">Expired</span>
                                                : a.tokenExpiring
                                                    ? <span className="badge badge-scheduled">Expiring Soon</span>
                                                    : <span className="badge badge-published">Active</span>}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {a.tokenExpiry ? new Date(a.tokenExpiry).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                                onClick={() => handleDelete(a.id)}>Disconnect</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
