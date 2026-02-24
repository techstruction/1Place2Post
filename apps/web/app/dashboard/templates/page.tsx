'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts.headers } });
}

type Template = { id: string; name: string; description: string | null; content: string; hashtags: string[]; platform: string | null; };

const PLATFORM_LABELS: Record<string, string> = { INSTAGRAM: '📸', TIKTOK: '🎵', FACEBOOK: '👥', YOUTUBE: '▶️', TWITTER: '🐦' };

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', content: '', hashtags: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        authFetch('/templates').then(r => r.ok ? r.json() : Promise.reject())
            .then(setTemplates)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const res = await authFetch('/templates', { method: 'POST', body: JSON.stringify({ name: form.name, description: form.description || undefined, content: form.content, hashtags: form.hashtags.split(' ').map(h => h.trim()).filter(Boolean) }) });
            if (!res.ok) throw new Error((await res.json()).message);
            const t = await res.json();
            setTemplates(prev => [t, ...prev]);
            setShowCreate(false);
            setForm({ name: '', description: '', content: '', hashtags: '' });
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this template?')) return;
        await authFetch(`/templates/${id}`, { method: 'DELETE' });
        setTemplates(prev => prev.filter(t => t.id !== id));
    }

    async function handleUse(id: string) {
        const res = await authFetch(`/templates/${id}/apply`, { method: 'POST' });
        const data = await res.json();
        router.push(`/dashboard/posts/new?caption=${encodeURIComponent(data.caption)}&hashtags=${encodeURIComponent(data.hashtags.join(' '))}&templateId=${id}`);
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Templates</h1>
                <button id="create-template-btn" onClick={() => setShowCreate(s => !s)} className="btn btn-primary">
                    {showCreate ? '✕ Cancel' : '+ New Template'}
                </button>
            </div>

            {showCreate && (
                <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleCreate}>
                        <div className="form-group"><label className="form-label">Name *</label><input id="tmpl-name" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Content *</label><textarea id="tmpl-content" className="form-input" required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={{ minHeight: 100 }} /></div>
                        <div className="form-group"><label className="form-label">Hashtags (space-separated)</label><input className="form-input" value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))} placeholder="#launch #product" /></div>
                        <button id="save-template-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : '📋 Create Template'}</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> :
                    templates.length === 0 ? <div className="card"><div className="empty"><h3>No templates yet</h3><p>Create reusable post templates to speed up your workflow.</p></div></div> :
                        templates.map(t => (
                            <div key={t.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {t.name}
                                        {t.platform && <span style={{ fontSize: '0.85rem' }}>{PLATFORM_LABELS[t.platform] ?? t.platform}</span>}
                                    </div>
                                    {t.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{t.description}</p>}
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>{t.content.slice(0, 120)}{t.content.length > 120 ? '…' : ''}</p>
                                    {t.hashtags.length > 0 && <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--accent)' }}>{t.hashtags.join(' ')}</div>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => handleUse(t.id)}>📝 Use Template</button>
                                    <button className="btn btn-ghost" style={{ fontSize: '0.85rem', color: 'var(--danger)' }} onClick={() => handleDelete(t.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
            </div>
        </>
    );
}
