'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

type Job = { id: string; postId: string; status: string; attempts: number; maxAttempts: number; nextRunAt: string; lastError?: string; post: { id: string; caption: string; status: string; scheduledAt?: string }; };
const STATUS_BADGE: Record<string, string> = { PENDING: 'badge-scheduled', RUNNING: 'badge-scheduled', RETRY: 'badge-draft', SUCCESS: 'badge-published', FAILED: 'badge-draft', CANCELLED: 'badge-draft' };
const STATUS_ICON: Record<string, string> = { PENDING: '⏳', RUNNING: '⚙️', RETRY: '↺', SUCCESS: '✅', FAILED: '❌', CANCELLED: '🚫' };

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState<string | null>(null);

    const load = () => authFetch('/jobs').then(r => r.ok ? r.json() : Promise.reject())
        .then(setJobs).catch(() => router.push('/login')).finally(() => setLoading(false));

    useEffect(() => { load(); }, []);

    async function enqueue(postId: string) {
        setActing(postId);
        await authFetch(`/jobs/publish/${postId}`, { method: 'POST', body: '{}' });
        await load();
        setActing(null);
    }

    async function cancel(postId: string) {
        if (!confirm('Cancel this publish job?')) return;
        setActing(postId);
        await authFetch(`/jobs/cancel/${postId}`, { method: 'POST', body: '{}' });
        await load();
        setActing(null);
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Publish Queue</h1>
                <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }} onClick={() => load()}>↻ Refresh</button>
            </div>

            {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> :
                jobs.length === 0 ? (
                    <div className="card"><div className="empty"><h3>No jobs yet</h3><p>Schedule a post or click "Enqueue Now" on any scheduled post to add it to the publish queue.</p></div></div>
                ) : (
                    <div className="table-wrap"><table>
                        <thead><tr><th>Post</th><th>Status</th><th>Attempts</th><th>Next Run</th><th>Last Error</th><th></th></tr></thead>
                        <tbody>
                            {jobs.map(j => (
                                <tr key={j.id}>
                                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {j.post.caption.slice(0, 55)}{j.post.caption.length > 55 ? '…' : ''}
                                    </td>
                                    <td>
                                        <span className={`badge ${STATUS_BADGE[j.status] ?? 'badge-draft'}`}>
                                            {STATUS_ICON[j.status]} {j.status}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{j.attempts}/{j.maxAttempts}</td>
                                    <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{new Date(j.nextRunAt).toLocaleString()}</td>
                                    <td style={{ color: 'var(--danger)', fontSize: '0.78rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.lastError ?? '—'}</td>
                                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                                        {['PENDING', 'RETRY', 'FAILED'].includes(j.status) && (
                                            <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} disabled={acting === j.postId} onClick={() => enqueue(j.postId)}>▶ Now</button>
                                        )}
                                        {['PENDING', 'RETRY'].includes(j.status) && (
                                            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--danger)' }} disabled={acting === j.postId} onClick={() => cancel(j.postId)}>Cancel</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )
            }
        </>
    );
}
