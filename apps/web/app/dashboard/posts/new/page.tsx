'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../../../lib/api';
import MediaSelectorModal from '../../../../components/MediaSelectorModal';

type MediaAsset = { id: string; urlPath: string; mimeType: string; originalName: string };
type Platform = 'INSTAGRAM' | 'TWITTER' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK';

const PLATFORM_LIMITS: Record<Platform, number> = {
  INSTAGRAM: 2200,
  TWITTER: 280,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  TIKTOK: 2200,
};

const PLATFORM_LABELS: Record<Platform, string> = {
  INSTAGRAM: 'Instagram',
  TWITTER: 'Twitter/X',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:35763';

function PreviewPane({ caption, activeTab, onTabChange }: {
  caption: string;
  activeTab: Platform;
  onTabChange: (p: Platform) => void;
}) {
  const limit = PLATFORM_LIMITS[activeTab];
  const count = caption.length;
  const isOver = count > limit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Platform tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(Object.keys(PLATFORM_LIMITS) as Platform[]).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onTabChange(p)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === p ? 'var(--brand-500)' : 'var(--bg-hover)',
              color: activeTab === p ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Mock preview card */}
      <div style={{
        backgroundColor: 'var(--bg-hover)',
        borderRadius: 10,
        padding: 16,
        minHeight: 200,
        border: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--bg-input)' }} />
          <div>
            <div style={{ height: 10, width: 80, borderRadius: 4, backgroundColor: 'var(--bg-input)' }} />
            <div style={{ height: 8, width: 60, borderRadius: 4, backgroundColor: 'var(--bg-input)', marginTop: 4 }} />
          </div>
        </div>
        <p style={{
          fontSize: 13,
          color: caption ? 'var(--text-primary)' : 'var(--text-dim)',
          lineHeight: 1.6,
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {caption || 'Your caption will appear here…'}
        </p>
      </div>

      {/* Character count */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        fontSize: 12,
        color: isOver ? 'var(--danger)' : count > limit * 0.9 ? 'var(--warning)' : 'var(--text-secondary)',
        fontWeight: isOver ? 600 : 400,
      }}>
        {isOver && <span style={{ marginRight: 6 }}>&#9888;</span>}
        {count.toLocaleString()} / {limit.toLocaleString()} chars
        {isOver && <span style={{ marginLeft: 6 }}>({PLATFORM_LABELS[activeTab]} limit exceeded)</span>}
      </div>
    </div>
  );
}

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
  const [activePreviewTab, setActivePreviewTab] = useState<Platform>('INSTAGRAM');

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
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      {/* Left: Compose form */}
      <div className="card">
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Media</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {mediaAssets.map(a => (
                <div key={a.id} style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', backgroundColor: 'var(--bg-input)' }}>
                  {a.mimeType.startsWith('image/') ? (
                    <img src={`${API_BASE}${a.urlPath}`} alt={a.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20 }}>&#127916;</div>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-ghost"
                style={{ width: 72, height: 72, border: '2px dashed var(--border-default)' }}
                onClick={() => setShowMediaModal(true)}>+</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="caption">Caption *</label>
            <textarea id="caption" className="form-input" value={caption}
              onChange={e => setCaption(e.target.value)} required
              placeholder="Write your post caption…"
              style={{ minHeight: 120, resize: 'vertical' }} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hashtags">Hashtags (space-separated)</label>
            <input id="hashtags" type="text" className="form-input" value={hashtags}
              onChange={e => setHashtags(e.target.value)} placeholder="#socialmedia #content" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="scheduled-at">Schedule for (optional)</label>
            <input id="scheduled-at" type="datetime-local" className="form-input" value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)} />
          </div>

          {!scheduledAt && (
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select id="status" className="form-input" value={status}
                onChange={e => setStatus(e.target.value as 'DRAFT' | 'SCHEDULED')}>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button id="submit-post-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : scheduledAt ? 'Schedule Post' : 'Save as Draft'}
            </button>
            <Link href="/dashboard/posts" className="btn btn-ghost">Cancel</Link>
          </div>
        </form>
        {showMediaModal && (
          <MediaSelectorModal
            onClose={() => setShowMediaModal(false)}
            onSelect={(assets) => { setMediaAssets(assets); setShowMediaModal(false); }}
          />
        )}
      </div>

      {/* Right: Preview pane */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Preview
        </h3>
        <PreviewPane caption={caption} activeTab={activePreviewTab} onTabChange={setActivePreviewTab} />
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">New Post</h1>
        <Link href="/dashboard/posts" className="btn btn-ghost">&larr; Back</Link>
      </div>
      <Suspense fallback={
        <div className="card" style={{ maxWidth: 680 }}>
          <p style={{ color: 'var(--text-dim)' }}>Loading…</p>
        </div>
      }>
        <NewPostForm />
      </Suspense>
    </>
  );
}
