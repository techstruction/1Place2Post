'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string) { return fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } }); }

type Summary = { totals: Record<string, number>; byPlatform: Record<string, Record<string, number>>; };
type Timeline = Record<string, Record<string, number>>;

const METRICS = ['LIKES', 'VIEWS', 'COMMENTS', 'SHARES', 'CLICKS', 'FOLLOWERS'];
const METRIC_ICONS: Record<string, string> = { LIKES: '❤️', VIEWS: '👁', COMMENTS: '💬', SHARES: '🔄', CLICKS: '🖱', FOLLOWERS: '👥' };

export default function AnalyticsPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<Summary | null>(null);
    const [timeline, setTimeline] = useState<Timeline>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            authFetch('/analytics/summary').then(r => r.ok ? r.json() : null),
            authFetch('/analytics/timeline').then(r => r.ok ? r.json() : {}),
        ]).then(([s, t]) => { setSummary(s); setTimeline(t); })
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    // Build timeline for a chart-like bar display
    const days = Object.keys(timeline).slice(-14).sort();
    const maxVal = Math.max(1, ...days.map(d => Object.values(timeline[d] || {}).reduce((a, b) => a + b, 0)));

    return (
        <>
            <div className="page-header"><h1 className="page-title">Analytics</h1></div>

            {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> : (
                <>
                    {/* Stat cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {METRICS.map(m => (
                            <div key={m} className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{METRIC_ICONS[m]}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{(summary?.totals[m] ?? 0).toLocaleString()}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m}</div>
                            </div>
                        ))}
                    </div>

                    {/* Last 14 days timeline bar chart */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last 14 Days</h2>
                        {days.length === 0 ? <p style={{ color: 'var(--text-dim)' }}>No data yet. Record events via the API to see your timeline.</p> : (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 80 }}>
                                {days.map(d => {
                                    const total = Object.values(timeline[d] || {}).reduce((a, b) => a + b, 0);
                                    const pct = (total / maxVal) * 100;
                                    return (
                                        <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <div style={{ width: '100%', background: 'var(--accent-muted)', borderRadius: 4, height: `${Math.max(4, pct)}%`, transition: 'height 0.3s' }} title={`${d}: ${total}`} />
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', writingMode: 'vertical-rl', opacity: 0.7 }}>{d.slice(5)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Per-platform breakdown */}
                    {summary && Object.keys(summary.byPlatform).length > 0 && (
                        <div className="card">
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Breakdown</h2>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr><th>Platform</th>{METRICS.map(m => <th key={m}>{METRIC_ICONS[m]} {m}</th>)}</tr></thead>
                                    <tbody>
                                        {Object.entries(summary.byPlatform).map(([platform, metrics]) => (
                                            <tr key={platform}>
                                                <td style={{ fontWeight: 500 }}>{platform}</td>
                                                {METRICS.map(m => <td key={m} style={{ color: 'var(--text-muted)' }}>{(metrics[m] ?? 0).toLocaleString()}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
