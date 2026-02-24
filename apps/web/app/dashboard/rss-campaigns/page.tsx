'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

type Campaign = { id: string; name: string; rssUrl: string; template: string; isActive: boolean; lastFetchedAt?: string; lastItemGuid?: string; };

export default function RssCampaignsPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', rssUrl: '', template: '{{title}} {{link}}' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        authFetch('/rss-campaigns').then(r => r.ok ? r.json() : Promise.reject())
            .then(setCampaigns).catch(() => router.push('/login')).finally(() => setLoading(false));
    }, [router]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault(); setError(''); setSaving(true);
        try {
            const res = await authFetch('/rss-campaigns', { method: 'POST', body: JSON.stringify(form) });
            if (!res.ok) throw new Error((await res.json()).message);
            const created = await res.json();
            setCampaigns(c => [created, ...c]);
            setShowCreate(false); setForm({ name: '', rssUrl: '', template: '{{title}} {{link}}' });
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function toggleActive(id: string, isActive: boolean) {
        const res = await authFetch(`/rss-campaigns/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) });
        const updated = await res.json();
        setCampaigns(c => c.map(x => x.id === id ? updated : x));
    }

    async function remove(id: string) {
        if (!confirm('Delete this campaign?')) return;
        await authFetch(`/rss-campaigns/${id}`, { method: 'DELETE' });
        setCampaigns(c => c.filter(x => x.id !== id));
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">RSS Campaigns</h1>
                <button id="create-rss-btn" className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>{showCreate ? '✕ Cancel' : '+ New Campaign'}</button>
            </div>

            {showCreate && (
                <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleCreate}>
                        <div className="form-group"><label className="form-label">Name *</label><input id="rss-name" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">RSS Feed URL *</label><input id="rss-url" type="url" className="form-input" required value={form.rssUrl} onChange={e => setForm(f => ({ ...f, rssUrl: e.target.value }))} placeholder="https://example.com/feed.xml" /></div>
                        <div className="form-group"><label className="form-label">Post Template</label><input className="form-input" value={form.template} onChange={e => setForm(f => ({ ...f, template: e.target.value }))} placeholder="{{title}} {{link}}" /><span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Use {'{{title}}'} and {'{{link}}'} as placeholders</span></div>
                        <button id="save-rss-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : '📡 Create Campaign'}</button>
                    </form>
                </div>
            )}

            {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> :
                campaigns.length === 0 ? <div className="card"><div className="empty"><h3>No RSS campaigns yet</h3><p>Create a campaign to auto-post from any RSS feed every 15 minutes.</p></div></div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {campaigns.map(c => (
                            <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {c.name}
                                        <span className={`badge ${c.isActive ? 'badge-published' : 'badge-draft'}`}>{c.isActive ? 'Active' : 'Paused'}</span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.25rem', wordBreak: 'break-all' }}>{c.rssUrl}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Template: <code style={{ background: 'var(--bg-input)', padding: '0 4px', borderRadius: 3 }}>{c.template}</code></div>
                                    {c.lastFetchedAt && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Last fetched: {new Date(c.lastFetchedAt).toLocaleString()}</div>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }} onClick={() => toggleActive(c.id, c.isActive)}>{c.isActive ? '⏸ Pause' : '▶ Resume'}</button>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.85rem', color: 'var(--danger)' }} onClick={() => remove(c.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </>
    );
}
