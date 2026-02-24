'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { linkPagesApi } from '../../../lib/api';

type LinkItem = { id: string; label: string; url: string; active: boolean; sortOrder: number; };
type LinkPage = { id: string; slug: string; title: string; published: boolean; items: LinkItem[]; _count?: { clicks: number }; };

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:35763';

export default function LinkPagesPage() {
    const router = useRouter();
    const [pages, setPages] = useState<LinkPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [slug, setSlug] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');

    useEffect(() => {
        linkPagesApi.list()
            .then(setPages)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const p = await linkPagesApi.create({ slug, title, bio: bio || undefined });
            setPages(prev => [{ ...p, _count: { clicks: 0 } }, ...prev]);
            setShowCreate(false);
            setSlug(''); setTitle(''); setBio('');
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function togglePublish(page: LinkPage) {
        const updated = await linkPagesApi.update(page.id, { published: !page.published });
        setPages(prev => prev.map(p => p.id === page.id ? { ...updated, _count: p._count } : p));
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this link page?')) return;
        await linkPagesApi.delete(id);
        setPages(prev => prev.filter(p => p.id !== id));
    }

    async function addItem(pageId: string) {
        if (!newItemLabel || !newItemUrl) return;
        const item = await linkPagesApi.addItem(pageId, { label: newItemLabel, url: newItemUrl });
        setPages(prev => prev.map(p => p.id === pageId ? { ...p, items: [...p.items, item] } : p));
        setNewItemLabel(''); setNewItemUrl('');
    }

    async function removeItem(pageId: string, itemId: string) {
        await linkPagesApi.removeItem(pageId, itemId);
        setPages(prev => prev.map(p => p.id === pageId ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p));
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Link Pages</h1>
                <button id="create-link-page-btn" onClick={() => setShowCreate(s => !s)} className="btn btn-primary">
                    {showCreate ? '✕ Cancel' : '+ New Page'}
                </button>
            </div>

            {showCreate && (
                <div className="card" style={{ maxWidth: 520, marginBottom: '1.5rem' }}>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">Slug (URL path) *</label>
                            <input id="lp-slug" className="form-input" required value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="my-links" />
                            <small style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Public URL: {API_BASE}/l/{slug || '…'}</small>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input id="lp-title" className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="My Links" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bio (optional)</label>
                            <textarea className="form-input" value={bio} onChange={e => setBio(e.target.value)} style={{ minHeight: 60 }} />
                        </div>
                        <button id="save-link-page-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : '🌐 Create Page'}</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> :
                    pages.length === 0 ? <div className="card"><div className="empty"><h3>No link pages yet</h3></div></div> :
                        pages.map(page => (
                            <div key={page.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{page.title}</div>
                                        <a href={`${API_BASE}/l/${page.slug}`} target="_blank" rel="noreferrer"
                                            style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>/l/{page.slug}</a>
                                        <span style={{ marginLeft: '0.75rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                            {page._count?.clicks ?? 0} click{page._count?.clicks !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                            onClick={() => setExpandedId(expandedId === page.id ? null : page.id)}>
                                            {expandedId === page.id ? 'Collapse' : `✏️ Edit Items (${page.items.length})`}
                                        </button>
                                        <button className={`btn ${page.published ? 'btn-ghost' : 'btn-primary'}`}
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                                            onClick={() => togglePublish(page)}>
                                            {page.published ? '🔒 Unpublish' : '🚀 Publish'}
                                        </button>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', color: 'var(--danger)' }}
                                            onClick={() => handleDelete(page.id)}>Delete</button>
                                    </div>
                                </div>

                                {expandedId === page.id && (
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                        {page.items.map(item => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                                                <div>
                                                    <span style={{ fontWeight: 500 }}>{item.label}</span>
                                                    <a href={item.url} target="_blank" rel="noreferrer" style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.url.slice(0, 40)}</a>
                                                </div>
                                                <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                                    onClick={() => removeItem(page.id, item.id)}>✕</button>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                            <input className="form-input" placeholder="Label" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} style={{ flex: 1, minWidth: 120 }} />
                                            <input className="form-input" placeholder="https://…" value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} style={{ flex: 2, minWidth: 180 }} />
                                            <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => addItem(page.id)}>+ Add</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
            </div>
        </>
    );
}
