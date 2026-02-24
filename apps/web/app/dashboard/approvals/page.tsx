'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts.headers } });
}

type Approval = { id: string; status: string; requestedAt: string; decidedAt?: string; decisionReason?: string; post: { id: string; caption: string; status: string; scheduledAt?: string }; requestedBy?: { name?: string; email: string }; };

const STATUS_BADGE: Record<string, string> = { REQUESTED: 'badge-scheduled', APPROVED: 'badge-published', REJECTED: 'badge-draft' };

export default function ApprovalsPage() {
    const router = useRouter();
    const [mine, setMine] = useState<Approval[]>([]);
    const [pending, setPending] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState<Record<string, string>>({});
    const [deciding, setDeciding] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            authFetch('/approvals').then(r => r.ok ? r.json() : []),
            authFetch('/approvals/pending').then(r => r.ok ? r.json() : []),
        ]).then(([m, p]) => { setMine(m); setPending(p); })
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    async function decide(approvalId: string, decision: 'APPROVED' | 'REJECTED') {
        setDeciding(approvalId);
        try {
            await authFetch(`/approvals/${approvalId}/decide`, { method: 'POST', body: JSON.stringify({ decision, reason: reason[approvalId] || undefined }) });
            setPending(p => p.filter(a => a.id !== approvalId));
        } finally { setDeciding(null); }
    }

    return (
        <>
            <div className="page-header"><h1 className="page-title">Approvals</h1></div>

            {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> : (
                <>
                    {/* Pending queue */}
                    <h2 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Pending Decision</h2>
                    {pending.length === 0 ? (
                        <div className="card" style={{ marginBottom: '1.5rem' }}><p style={{ color: 'var(--text-dim)' }}>No posts awaiting approval. ✅</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            {pending.map(a => (
                                <div key={a.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>"{a.post.caption.slice(0, 80)}{a.post.caption.length > 80 ? '…' : ''}"</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Requested by {a.requestedBy?.name ?? a.requestedBy?.email} · {new Date(a.requestedAt).toLocaleString()}</div>
                                        </div>
                                        <Link href={`/dashboard/posts/${a.post.id}`} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>View Post ↗</Link>
                                    </div>
                                    <div className="form-group">
                                        <input className="form-input" placeholder="Reason (optional)" value={reason[a.id] ?? ''} onChange={e => setReason(r => ({ ...r, [a.id]: e.target.value }))} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button id={`approve-${a.id}`} className="btn btn-primary" disabled={deciding === a.id} onClick={() => decide(a.id, 'APPROVED')}>✅ Approve</button>
                                        <button id={`reject-${a.id}`} className="btn btn-ghost" disabled={deciding === a.id} style={{ color: 'var(--danger)' }} onClick={() => decide(a.id, 'REJECTED')}>✕ Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* My submissions */}
                    <h2 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>My Submissions</h2>
                    {mine.length === 0 ? (
                        <div className="card"><p style={{ color: 'var(--text-dim)' }}>You haven't submitted any posts for approval yet.</p></div>
                    ) : (
                        <div className="table-wrap"><table>
                            <thead><tr><th>Caption</th><th>Status</th><th>Requested</th><th>Decision</th><th></th></tr></thead>
                            <tbody>
                                {mine.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.post.caption.slice(0, 60)}</td>
                                        <td><span className={`badge ${STATUS_BADGE[a.status] ?? 'badge-draft'}`}>{a.status}</span></td>
                                        <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{new Date(a.requestedAt).toLocaleDateString()}</td>
                                        <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{a.decisionReason ?? '—'}</td>
                                        <td><Link href={`/dashboard/posts/${a.post.id}`} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>View</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    )}
                </>
            )}
        </>
    );
}
