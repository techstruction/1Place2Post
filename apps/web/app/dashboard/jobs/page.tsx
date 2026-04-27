'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

type Job = {
    id: string;
    postId: string;
    status: string;
    errorClass: string | null;
    attempts: number;
    maxAttempts: number;
    nextRunAt: string;
    lastError?: string;
    post: { id: string; caption: string; status: string; scheduledAt?: string };
};

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    PENDING:      { icon: '⏳', label: 'Pending',      color: 'var(--text-dim)' },
    RUNNING:      { icon: '⚙️', label: 'Publishing…', color: 'var(--brand-500)' },
    RETRY:        { icon: '↺',  label: 'Retrying',     color: 'var(--warning)' },
    SUCCESS:      { icon: '✅', label: 'Published',    color: 'var(--success)' },
    VERIFY_FAILED:{ icon: '⚠️', label: 'Unconfirmed',  color: 'var(--warning)' },
    FAILED:       { icon: '❌', label: 'Failed',       color: 'var(--danger)' },
    BLOCKED:      { icon: '🔒', label: 'Blocked',      color: 'var(--danger)' },
    CANCELLED:    { icon: '🚫', label: 'Cancelled',    color: 'var(--text-dim)' },
};

const ERROR_CLASS_LABELS: Record<string, string> = {
    PERMANENT:       'Bad content (400)',
    TRANSIENT:       'Platform error — retrying',
    RATE_LIMIT:      'Rate limited — retrying',
    TOKEN_EXPIRED:   'Token expired — reconnect account',
    PLATFORM_OUTAGE: 'Platform outage',
    UNKNOWN:         'Unknown error',
};

const TABS = ['All', 'Active', 'Failed', 'Blocked'] as const;
type Tab = typeof TABS[number];

function matchesTab(job: Job, tab: Tab): boolean {
    if (tab === 'All') return true;
    if (tab === 'Active') return ['PENDING', 'RUNNING', 'RETRY'].includes(job.status);
    if (tab === 'Failed') return ['FAILED', 'VERIFY_FAILED'].includes(job.status);
    if (tab === 'Blocked') return job.status === 'BLOCKED';
    return true;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function timeUntil(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'now';
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `in ${mins}m`;
    return `in ${Math.floor(mins / 60)}h`;
}

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('All');
    const [acting, setActing] = useState<string | null>(null);

    const load = () => authFetch('/jobs')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(setJobs)
        .catch(() => router.push('/login'))
        .finally(() => setLoading(false));

    useEffect(() => { load(); }, []);

    async function retry(postId: string) {
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

    const filtered = jobs.filter(j => matchesTab(j, tab));

    const counts: Record<Tab, number> = {
        All:     jobs.length,
        Active:  jobs.filter(j => matchesTab(j, 'Active')).length,
        Failed:  jobs.filter(j => matchesTab(j, 'Failed')).length,
        Blocked: jobs.filter(j => matchesTab(j, 'Blocked')).length,
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Publish Queue</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 4 }}>
                        Real-time status of every scheduled post. Failed jobs retry automatically — blocked jobs need account reconnection.
                    </p>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }} onClick={load}>↻ Refresh</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-default)', marginBottom: 20 }}>
                {TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: tab === t ? '2px solid var(--brand-500)' : '2px solid transparent',
                            color: tab === t ? 'var(--brand-500)' : 'var(--text-secondary)',
                            fontWeight: tab === t ? 600 : 400,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {t}
                        {counts[t] > 0 && (
                            <span style={{
                                background: t === 'Blocked' ? 'var(--danger)' : t === 'Failed' ? 'var(--warning)' : 'var(--bg-card)',
                                color: (t === 'Blocked' || t === 'Failed') ? '#fff' : 'var(--text-secondary)',
                                borderRadius: 10,
                                padding: '1px 7px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                            }}>
                                {counts[t]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div>
            ) : filtered.length === 0 ? (
                <div className="card">
                    <div className="empty">
                        <h3>No jobs in {tab === 'All' ? 'queue' : `"${tab}" category`}</h3>
                        {tab === 'All' && <p>Schedule a post to add it to the publish queue.</p>}
                        {tab === 'Blocked' && <p>Blocked posts are waiting for account reconnection. Go to <Link href="/dashboard/connections">Connections</Link> to reconnect.</p>}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map(j => {
                        const cfg = STATUS_CONFIG[j.status] ?? { icon: '?', label: j.status, color: 'var(--text-dim)' };
                        const errLabel = j.errorClass ? ERROR_CLASS_LABELS[j.errorClass] : null;
                        return (
                            <div key={j.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 500, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {j.post.caption.slice(0, 90)}{j.post.caption.length > 90 ? '…' : ''}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: '0.82rem' }}>
                                        {/* Status badge */}
                                        <span style={{ color: cfg.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span>{cfg.icon}</span> {cfg.label}
                                        </span>
                                        {/* Error class */}
                                        {errLabel && (
                                            <span style={{ color: 'var(--text-dim)', borderLeft: '1px solid var(--border-default)', paddingLeft: 12 }}>
                                                {errLabel}
                                            </span>
                                        )}
                                        {/* Attempts */}
                                        <span style={{ color: 'var(--text-dim)', borderLeft: '1px solid var(--border-default)', paddingLeft: 12 }}>
                                            {j.attempts}/{j.maxAttempts} attempts
                                        </span>
                                        {/* Timing */}
                                        {['RETRY', 'PENDING'].includes(j.status) && (
                                            <span style={{ color: 'var(--text-dim)', borderLeft: '1px solid var(--border-default)', paddingLeft: 12 }}>
                                                Next run {timeUntil(j.nextRunAt)}
                                            </span>
                                        )}
                                        {j.status === 'SUCCESS' && j.post.scheduledAt && (
                                            <span style={{ color: 'var(--text-dim)', borderLeft: '1px solid var(--border-default)', paddingLeft: 12 }}>
                                                Published {timeAgo(j.nextRunAt)}
                                            </span>
                                        )}
                                    </div>
                                    {j.lastError && (
                                        <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {j.lastError}
                                        </p>
                                    )}
                                </div>
                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    {j.status === 'BLOCKED' && (
                                        <Link href="/dashboard/connections" className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>
                                            Reconnect
                                        </Link>
                                    )}
                                    {['PENDING', 'RETRY', 'FAILED', 'VERIFY_FAILED'].includes(j.status) && (
                                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} disabled={acting === j.postId} onClick={() => retry(j.postId)}>
                                            ▶ Now
                                        </button>
                                    )}
                                    {['PENDING', 'RETRY'].includes(j.status) && (
                                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--danger)' }} disabled={acting === j.postId} onClick={() => cancel(j.postId)}>
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
