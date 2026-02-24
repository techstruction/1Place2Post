'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../../../lib/api';

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [status, setStatus] = useState('DRAFT');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        postsApi.get(id)
            .then(post => {
                setCaption(post.caption);
                setHashtags((post.hashtags || []).join(' '));
                setStatus(post.status);
                if (post.scheduledAt) {
                    const d = new Date(post.scheduledAt);
                    setScheduledAt(d.toISOString().slice(0, 16));
                }
            })
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [id, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await postsApi.update(id, {
                caption,
                hashtags: hashtags.split(' ').map(h => h.trim()).filter(Boolean),
                scheduledAt: scheduledAt || undefined,
                status: scheduledAt ? 'SCHEDULED' : status,
            });
            router.push('/dashboard/posts');
        } catch (err: any) {
            setError(err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div style={{ color: 'var(--text-dim)', padding: '2rem' }}>Loading…</div>;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Edit Post</h1>
                <Link href="/dashboard/posts" className="btn btn-ghost">← Back</Link>
            </div>

            <div className="card" style={{ maxWidth: 680 }}>
                {error && <div className="alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Caption *</label>
                        <textarea id="edit-caption" className="form-input" value={caption}
                            onChange={e => setCaption(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Hashtags (space-separated)</label>
                        <input id="edit-hashtags" type="text" className="form-input" value={hashtags}
                            onChange={e => setHashtags(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Schedule for (optional)</label>
                        <input id="edit-scheduled-at" type="datetime-local" className="form-input" value={scheduledAt}
                            onChange={e => setScheduledAt(e.target.value)} />
                    </div>
                    {!scheduledAt && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select id="edit-status" className="form-input" value={status}
                                onChange={e => setStatus(e.target.value)}>
                                <option value="DRAFT">Draft</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button id="save-post-btn" type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : '💾 Save Changes'}
                        </button>
                        <Link href="/dashboard/posts" className="btn btn-ghost">Cancel</Link>
                    </div>
                </form>
            </div>
        </>
    );
}
