'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

const AVAILABLE_EVENTS = ['post.scheduled', 'post.published', 'post.failed', 'post.approval_requested', 'post.approved', 'post.rejected'];
type Webhook = { id: string; name: string; url: string; eventsJson: string; isActive: boolean; };

export default function OutgoingWebhooksPage() {
    const router = useRouter();
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', url: '', secret: '', events: [] as string[] });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        authFetch('/outgoing-webhooks').then(r => r.ok ? r.json() : Promise.reject())
            .then(setWebhooks).catch(() => router.push('/login')).finally(() => setLoading(false));
    }, [router]);

    function toggleEvent(event: string) {
        setForm(f => ({ ...f, events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event] }));
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault(); setError(''); setSaving(true);
        try {
            const res = await authFetch('/outgoing-webhooks', { method: 'POST', body: JSON.stringify({ name: form.name, url: form.url, secret: form.secret || undefined, events: form.events }) });
            if (!res.ok) throw new Error((await res.json()).message);
            const created = await res.json();
            setWebhooks(w => [created, ...w]);
            setShowCreate(false); setForm({ name: '', url: '', secret: '', events: [] });
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function toggleActive(id: string, isActive: boolean) {
        const res = await authFetch(`/outgoing-webhooks/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) });
        const updated = await res.json();
        setWebhooks(w => w.map(x => x.id === id ? updated : x));
    }

    async function remove(id: string) {
        if (!confirm('Delete this webhook?')) return;
        await authFetch(`/outgoing-webhooks/${id}`, { method: 'DELETE' });
        setWebhooks(w => w.filter(x => x.id !== id));
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Outgoing Webhooks</h1>
                <button id="create-webhook-btn" className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>{showCreate ? '✕ Cancel' : '+ Register Webhook'}</button>
            </div>

            {showCreate && (
                <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleCreate}>
                        <div className="form-group"><label className="form-label">Name *</label><input id="wh-name" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">URL *</label><input id="wh-url" type="url" className="form-input" required value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://your-endpoint.com/hook" /></div>
                        <div className="form-group"><label className="form-label">Secret (for HMAC signature)</label><input className="form-input" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder="Optional — adds X-1P2P-Signature header" /></div>
                        <div className="form-group">
                            <label className="form-label">Subscribe to Events (empty = all)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem' }}>
                                {AVAILABLE_EVENTS.map(ev => (
                                    <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} />
                                        <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 3 }}>{ev}</code>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button id="save-webhook-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Registering…' : '🔔 Register Webhook'}</button>
                    </form>
                </div>
            )}

            {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> :
                webhooks.length === 0 ? <div className="card"><div className="empty"><h3>No webhooks registered</h3><p>Register a URL to receive real-time notifications on post events.</p></div></div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {webhooks.map(w => {
                            const events: string[] = JSON.parse(w.eventsJson || '[]');
                            return (
                                <div key={w.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {w.name} <span className={`badge ${w.isActive ? 'badge-published' : 'badge-draft'}`}>{w.isActive ? 'Active' : 'Paused'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.2rem', wordBreak: 'break-all' }}>{w.url}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{events.length === 0 ? 'All events' : events.join(', ')}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }} onClick={() => toggleActive(w.id, w.isActive)}>{w.isActive ? '⏸ Pause' : '▶ Resume'}</button>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.85rem', color: 'var(--danger)' }} onClick={() => remove(w.id)}>Delete</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
        </>
    );
}
