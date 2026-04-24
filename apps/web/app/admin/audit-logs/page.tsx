'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function adminFetch(path: string) {
    return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
}

type Log = { id: string; adminId: string; action: string; targetId: string | null; detail: string | null; createdAt: string; };

const ACTION_COLOR: Record<string, string> = {
    USER_UPDATED: '#f59e0b',
    USER_DELETED: '#dc2626',
    FLAG_TOGGLED: '#2563eb',
};

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch('/admin/audit-logs').then(r => r.json()).then(data => setLogs(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Audit Logs</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Read-only record of all administrative actions taken on the platform.
                </p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <p style={{ padding: '1.5rem', color: 'var(--text-dim)' }}>Loading logs…</p>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                        <p>No audit events recorded yet. Admin actions will appear here.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Target ID</th>
                                    <th>Detail</th>
                                    <th>Admin ID</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: 5,
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                backgroundColor: `${ACTION_COLOR[log.action] ?? '#888'}22`,
                                                color: ACTION_COLOR[log.action] ?? '#888',
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.targetId ?? '—'}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 200 }}>{log.detail ?? '—'}</td>
                                        <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.adminId.slice(0, 8)}…</td>
                                        <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
