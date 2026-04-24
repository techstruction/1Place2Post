'use client';
import { useEffect, useState, useRef } from 'react';

type MediaAsset = { id: string; originalName: string; mimeType: string; urlPath: string; sizeBytes: number; createdAt: string; folder: string; };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

export default function MediaSelectorModal({
    onClose,
    onSelect,
    multiple = true
}: {
    onClose: () => void;
    onSelect: (assets: MediaAsset[]) => void;
    multiple?: boolean;
}) {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const fileRef = useRef<HTMLInputElement>(null);

    const SERVING_BASE = API_BASE.replace('/api', '');

    useEffect(() => {
        fetch(`${API_BASE}/media`, { headers: authHeaders() })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setAssets)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        // By default, media selected from this modal goes to 'root' or a selected folder context
        // Currently we just let it go to 'root'
        try {
            const res = await fetch(`${API_BASE}/media/upload`, { method: 'POST', headers: authHeaders(), body: fd });
            if (res.ok) {
                const asset = await res.json();
                setAssets(a => [asset, ...a]);
                if (multiple) {
                    setSelected(prev => new Set(prev).add(asset.id));
                } else {
                    setSelected(new Set([asset.id]));
                }
            }
        } catch { /* silent */ }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
    }

    function toggleSelect(assetId: string) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(assetId)) {
                next.delete(assetId);
            } else {
                if (!multiple) next.clear();
                next.add(assetId);
            }
            return next;
        });
    }

    function handleConfirm() {
        const selectedAssets = assets.filter(a => selected.has(a.id));
        onSelect(selectedAssets);
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
            <div className="card" style={{
                width: '100%', maxWidth: '800px', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', padding: '1.5rem',
                backgroundColor: 'var(--bg-card)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Select Media</h2>
                    <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.2rem 0.5rem' }}>✕</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    {uploading && <span style={{ marginRight: '1rem', color: 'var(--text-muted)' }}>Uploading…</span>}
                    <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>⬆ Upload New</button>
                    <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleUpload} />
                </div>

                <div style={{
                    flex: 1, overflowY: 'auto',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '1rem', paddingBottom: '1rem', minHeight: '300px'
                }}>
                    {loading ? <p>Loading library...</p> : assets.length === 0 ? <p>No media found.</p> :
                        assets.map(a => {
                            const isSelected = selected.has(a.id);
                            const url = `${SERVING_BASE}${a.urlPath}`;
                            const isImage = a.mimeType.startsWith('image/');
                            return (
                                <div key={a.id}
                                    onClick={() => toggleSelect(a.id)}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '1',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        border: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                                        overflow: 'hidden',
                                        backgroundColor: 'var(--bg-input)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                    {isImage ? (
                                        <img src={url} alt={a.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2rem' }}>🎬</span>
                                    )}
                                    {isSelected && (
                                        <div style={{
                                            position: 'absolute', top: '0.5rem', right: '0.5rem',
                                            backgroundColor: 'var(--primary)', color: 'white',
                                            borderRadius: '50%', width: '20px', height: '20px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.8rem'
                                        }}>✓</div>
                                    )}
                                </div>
                            );
                        })
                    }
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleConfirm} disabled={selected.size === 0}>
                        Add {selected.size > 0 ? `(${selected.size})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
