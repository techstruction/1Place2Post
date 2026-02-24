'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

type Notification = { id: string; type: string; title: string; body?: string; isRead: boolean; createdAt: string; };
const TYPE_ICON: Record<string, string> = { PUBLISH_SUCCESS: '✅', PUBLISH_FAILED: '❌', APPROVAL: '✔️', SUPPORT: '🎫', SUCCESS: '✅', WARNING: '⚠️', ERROR: '❌', INFO: 'ℹ️' };

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch('/notifications').then(r => r.ok ? r.json() : Promise.reject())
            .then(setNotifications).catch(() => router.push('/login')).finally(() => setLoading(false));
    }, [router]);

    async function markRead(id: string) {
        await authFetch(`/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    }

    async function markAllRead() {
        await authFetch('/notifications/read-all', { method: 'PATCH' });
        setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    }

    const unread = notifications.filter(n => !n.isRead).length;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">
                    Notifications
                    {unread > 0 && <span style={{ marginLeft: '0.6rem', background: 'var(--accent)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, borderRadius: 999, padding: '2px 8px' }}>{unread}</span>}
                </h1>
                {unread > 0 && <button className="btn btn-ghost" style={{ fontSize: '0.85rem' }} onClick={markAllRead}>✓ Mark All Read</button>}
            </div>

            {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> :
                notifications.length === 0 ? (
                    <div className="card"><div className="empty"><h3>No notifications</h3><p>Events like post publishing, approvals, and support tickets will appear here.</p></div></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {notifications.map(n => (
                            <div key={n.id} className="card" style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', opacity: n.isRead ? 0.65 : 1, borderLeft: n.isRead ? 'none' : '3px solid var(--accent)', paddingLeft: n.isRead ? undefined : 'calc(var(--card-pad) - 3px)', cursor: n.isRead ? 'default' : 'pointer' }}
                                onClick={() => !n.isRead && markRead(n.id)} role="button">
                                <span style={{ fontSize: '1.3rem', marginTop: '0.1rem', flexShrink: 0 }}>{TYPE_ICON[n.type] ?? 'ℹ️'}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: n.isRead ? 400 : 600 }}>{n.title}</div>
                                    {n.body && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{n.body}</div>}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                </div>
                                {!n.isRead && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', whiteSpace: 'nowrap', alignSelf: 'center' }}>Click to read</span>}
                            </div>
                        ))}
                    </div>
                )
            }
        </>
    );
}
