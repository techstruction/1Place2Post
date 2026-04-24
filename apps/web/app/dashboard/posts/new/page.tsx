'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../../../lib/api';
import MediaSelectorModal from '../../../../components/MediaSelectorModal';

type MediaAsset = { id: string; urlPath: string; mimeType: string; originalName: string };

function NewPostForm() {
    const router = useRouter();
    const params = useSearchParams();
    const [caption, setCaption] = useState(params.get('caption') ?? '');
    const [hashtags, setHashtags] = useState(params.get('hashtags') ?? '');
    const [scheduledAt, setScheduledAt] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED'>('DRAFT');
    const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
    const [showMediaModal, setShowMediaModal] = useState(false);
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
                mediaAssetIds: mediaAssets.map(a => a.id),
            });
            router.push('/dashboard/posts');
        } catch (err: any) {
            setError(err.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card" style={{ maxWidth: 680 }}>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Media</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {mediaAssets.map(a => (
                            <div key={a.id} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', backgroundColor: 'var(--bg-input)' }}>
                                {a.mimeType.startsWith('image/') ? (
                                    <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:35763'}${a.urlPath}`} alt={a.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🎬</div>
                                )}
                            </div>
                        ))}
                        <button type="button" className="btn btn-ghost" style={{ width: 80, height: 80, border: '2px dashed var(--border)' }} onClick={() => setShowMediaModal(true)}>+</button>
                    </div>
                </div>
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
            {showMediaModal && <MediaSelectorModal onClose={() => setShowMediaModal(false)} onSelect={(assets) => { setMediaAssets(assets); setShowMediaModal(false); }} />}
        </div>
    );
}

export default function NewPostPage() {
    return (
        <>
            <div className="page-header">
                <h1 className="page-title">New Post</h1>
                <Link href="/dashboard/posts" className="btn btn-ghost">← Back</Link>
            </div>
            <Suspense fallback={<div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div>}>
                <NewPostForm />
            </Suspense>
        </>
    );
}
