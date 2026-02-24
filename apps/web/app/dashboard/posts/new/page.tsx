'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../../../lib/api';

export default function NewPostPage() {
    const router = useRouter();
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED'>('DRAFT');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await postsApi.create({
                caption,
                hashtags: hashtags.split(' ').map(h => h.trim()).filter(Boolean),
                scheduledAt: scheduledAt || undefined,
                status: scheduledAt ? 'SCHEDULED' : status,
            });
            router.push('/dashboard/posts');
        } catch (err: any) {
            setError(err.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">New Post</h1>
                <Link href="/dashboard/posts" className="btn btn-ghost">← Back</Link>
            </div>

            <div className="card" style={{ maxWidth: 680 }}>
                {error && <div className="alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Caption *</label>
                        <textarea id="caption" className="form-input" value={caption}
                            onChange={e => setCaption(e.target.value)} required placeholder="Write your post caption…" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Hashtags (space-separated)</label>
                        <input id="hashtags" type="text" className="form-input" value={hashtags}
                            onChange={e => setHashtags(e.target.value)} placeholder="#socialmedia #content" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Schedule for (optional)</label>
                        <input id="scheduled-at" type="datetime-local" className="form-input" value={scheduledAt}
                            onChange={e => setScheduledAt(e.target.value)} />
                    </div>
                    {!scheduledAt && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select id="status" className="form-input" value={status}
                                onChange={e => setStatus(e.target.value as 'DRAFT' | 'SCHEDULED')}>
                                <option value="DRAFT">Draft</option>
                                <option value="SCHEDULED">Scheduled</option>
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button id="submit-post-btn" type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating…' : scheduledAt ? '🗓 Schedule Post' : '💾 Save as Draft'}
                        </button>
                        <Link href="/dashboard/posts" className="btn btn-ghost">Cancel</Link>
                    </div>
                </form>
            </div>
        </>
    );
}
