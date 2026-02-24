'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

type MediaAsset = { id: string; originalName: string; mimeType: string; urlPath: string; sizeBytes: number; createdAt: string; };

function sizeLabel(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaPage() {
    const router = useRouter();
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const SERVING_BASE = API_BASE.replace('/api', '');

    useEffect(() => {
        fetch(`${API_BASE}/media`, { headers: authHeaders() })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setAssets)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/media/upload`, { method: 'POST', headers: authHeaders(), body: fd });
            const asset = await res.json();
            setAssets(a => [asset, ...a]);
        } catch { /* silent */ }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this file?')) return;
        await fetch(`${API_BASE}/media/${id}`, { method: 'DELETE', headers: authHeaders() });
        setAssets(a => a.filter(x => x.id !== id));
    }

    function copyUrl(asset: MediaAsset) {
        const url = `${SERVING_BASE}${asset.urlPath}`;
        navigator.clipboard.writeText(url);
        setCopied(asset.id);
        setTimeout(() => setCopied(null), 2000);
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Media Library</h1>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {uploading && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Uploading…</span>}
                    <button id="upload-media-btn" className="btn btn-primary" onClick={() => fileRef.current?.click()}>⬆ Upload</button>
                    <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleUpload} />
                </div>
            </div>

            {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> :
                assets.length === 0 ? <div className="card"><div className="empty"><h3>No media yet</h3><p>Upload images or videos to use in your posts.</p></div></div> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                        {assets.map(a => {
                            const url = `${SERVING_BASE}${a.urlPath}`;
                            const isImage = a.mimeType.startsWith('image/');
                            return (
                                <div key={a.id} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ aspectRatio: '1', background: 'var(--bg-input)', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isImage ? (
                                            <img src={url} alt={a.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '2rem' }}>🎬</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.originalName}>{a.originalName}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{sizeLabel(a.sizeBytes)}</div>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.75rem', padding: '0.3rem' }} onClick={() => copyUrl(a)}>
                                            {copied === a.id ? '✓ Copied!' : '📋 Copy URL'}
                                        </button>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.3rem', color: 'var(--danger)' }} onClick={() => handleDelete(a.id)}>✕</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
        </>
    );
}
