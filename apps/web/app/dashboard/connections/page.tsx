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
    const [activeWorkspaceId, setWorkspaceIdState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ platform: 'INSTAGRAM', platformId: '', username: '', accessToken: '', tokenExpiry: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const wsId = localStorage.getItem('1p2p_activeWorkspace');
        setWorkspaceIdState(wsId);
        if (!wsId) { setLoading(false); return; }
        const token = localStorage.getItem('1p2p_token');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/social-accounts/workspace/${wsId}`, {
            headers: { Authorization: `Bearer ${token || ''}` },
        })
            .then(r => r.ok ? r.json() : [])
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
                workspaceId: activeWorkspaceId!,
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowHelp(s => !s)} className="btn btn-ghost">
                        {showHelp ? '✕ Hide Help' : '📖 Manual Guide'}
                    </button>
                    <button id="add-account-btn" onClick={() => setShowAdd(s => !s)} className="btn btn-primary">
                        {showAdd ? '✕ Cancel' : '+ Connect Account'}
                    </button>
                </div>
            </div>

            {showHelp && (
                <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent-glow)', background: 'rgba(99, 102, 241, 0.05)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-glow)' }}>How to get your Manual ID & Token</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', fontSize: '0.875rem' }}>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>1. Get Access Token</h3>
                            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
                                <li>Go to the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" style={{ color: 'var(--accent-glow)' }}>Meta Graph Explorer</a>.</li>
                                <li>Ensure your App is selected in the top-right dropdown.</li>
                                <li>Click <b>"Generate Access Token"</b> and follow the prompts.</li>
                                <li>Copy the resulting string into the <b>Access Token</b> field.</li>
                            </ol>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>2. Find Your Page/User ID</h3>
                            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
                                <li><b>Facebook:</b> Go to your Page {' > '} Meta Business Suite {' > '} Settings {' > '} Page ID.</li>
                                <li><b>Instagram:</b> In the Graph Explorer, run a GET request to <code>me/accounts?fields=instagram_business_account</code> to find your Instagram Business ID.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {showAdd && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ flex: '1 1 300px' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Automated Connection</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Securely connect your Instagram or Facebook accounts via official Meta login.
                        </p>
                        <button
                            onClick={() => {
                                const token = localStorage.getItem('1p2p_token');
                                const wsId = localStorage.getItem('1p2p_activeWorkspace');
                                window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/social/instagram/auth?token=${token}&workspaceId=${wsId}`;
                            }}
                            className="btn btn-primary"
                            style={{ width: '100%', background: '#4267B2' }}
                        >
                            🔗 Connect via Meta
                        </button>
                    </div>

                    <div className="card" style={{ flex: '1 1 300px' }}>
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
