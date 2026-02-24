'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE', 'TWITTER'];
const TONES = ['professional', 'casual', 'witty', 'inspirational', 'urgent'];
const PLATFORM_ICONS: Record<string, string> = { INSTAGRAM: '📸', TIKTOK: '🎵', FACEBOOK: '👥', YOUTUBE: '▶️', TWITTER: '🐦' };

type Result = { caption: string; hashtags: string[]; mode: 'mock' | 'llm'; };

export default function AiStudioPage() {
    const router = useRouter();
    const [form, setForm] = useState({ topic: '', platform: 'INSTAGRAM', tone: 'professional' });
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function generate(e: React.FormEvent) {
        e.preventDefault(); setError(''); setResult(null); setLoading(true);
        try {
            const res = await authFetch('/ai/generate-caption', { method: 'POST', body: JSON.stringify(form) });
            if (!res.ok) throw new Error((await res.json()).message);
            setResult(await res.json());
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    }

    function useCaption() {
        if (!result) return;
        const q = new URLSearchParams({ caption: result.caption, hashtags: result.hashtags.join(' ') });
        router.push(`/dashboard/posts/new?${q.toString()}`);
    }

    function copyCaption() {
        if (!result) return;
        navigator.clipboard.writeText(`${result.caption}\n\n${result.hashtags.join(' ')}`);
    }

    return (
        <>
            <div className="page-header"><h1 className="page-title">🤖 AI Studio</h1></div>

            {/* Mock mode banner */}
            <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: 12, padding: '0.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🧪</span>
                <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Running in Mock Mode</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>Captions are generated from templates. Set <code style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 4px', borderRadius: 3 }}>AI_MODE=openai</code> and add LLM credentials to enable real AI generation in Phase 5.</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Input form */}
                <div className="card">
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Create a Caption</h2>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={generate}>
                        <div className="form-group">
                            <label className="form-label">Topic / Prompt *</label>
                            <textarea id="ai-topic" className="form-input" required value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. New product launch for our fitness app" style={{ minHeight: 80 }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Platform</label>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {PLATFORMS.map(p => (
                                    <button key={p} type="button" className={`btn ${form.platform === p ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={() => setForm(f => ({ ...f, platform: p }))}>
                                        {PLATFORM_ICONS[p]} {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tone</label>
                            <select id="ai-tone" className="form-input" value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
                                {TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                        <button id="generate-caption-btn" type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? '✨ Generating…' : '✨ Generate Caption'}
                        </button>
                    </form>
                </div>

                {/* Result */}
                <div className="card" style={{ minHeight: 200 }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Generated Caption</h2>
                    {!result && !loading && <p style={{ color: 'var(--text-dim)' }}>Your generated caption will appear here.</p>}
                    {loading && <p style={{ color: 'var(--text-dim)' }}>✨ Generating your caption…</p>}
                    {result && (
                        <>
                            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '0.875rem', marginBottom: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                {result.caption}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '1rem' }}>{result.hashtags.join(' ')}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button id="use-caption-btn" className="btn btn-primary" onClick={useCaption}>📝 Use in New Post</button>
                                <button className="btn btn-ghost" onClick={copyCaption}>📋 Copy All</button>
                                <button className="btn btn-ghost" onClick={generate} disabled={loading}>↻ Regenerate</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
