'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { inboxApi } from '../../../lib/api';

type InboxMessage = {
    id: string;
    platform: string | null;
    kind: string;
    fromHandle: string | null;
    message: string;
    receivedAt: string;
    isRead: boolean;
};

export default function InboxPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadData() {
        try {
            const data = await inboxApi.list();
            setMessages(data);
        } catch (err) {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [router]);

    async function handleMarkRead(id: string) {
        await inboxApi.markRead(id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    }

    async function handleMarkAllRead() {
        await inboxApi.markAllRead();
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    }

    const unreadCount = messages.filter(m => !m.isRead).length;

    return (
        <div className="inbox-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className="page-title">Unified Inbox {unreadCount > 0 && <span className="badge badge-brand" style={{ marginLeft: '0.8rem' }}>{unreadCount} new</span>}</h1>
                {unreadCount > 0 && (
                    <button className="btn btn-ghost" onClick={handleMarkAllRead}>
                        ✓ Mark All as Read
                    </button>
                )}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '2rem', color: 'var(--text-dim)' }}>Loading inbox...</div>
                ) : messages.length === 0 ? (
                    <div className="empty" style={{ padding: '3rem 2rem' }}>
                        <h3>Inbox is empty</h3>
                        <p>When users DM or comment, they will appear here.</p>
                    </div>
                ) : (
                    <div className="msg-list" style={{ display: 'flex', flexDirection: 'column' }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{
                                padding: '1.2rem',
                                borderBottom: '1px solid var(--border)',
                                backgroundColor: msg.isRead ? 'transparent' : 'rgba(111, 66, 193, 0.04)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem',
                                transition: 'background-color 0.2s',
                            }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--bg-card-hover)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    fontSize: '1.2rem'
                                }}>
                                    {msg.platform === 'INSTAGRAM' ? '📸' : msg.platform === 'TIKTOK' ? '🎵' : msg.platform === 'TWITTER' ? '🐦' : msg.platform === 'FACEBOOK' ? '📘' : '💬'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <div style={{ fontWeight: msg.isRead ? 500 : 700, color: 'var(--color-heading)' }}>
                                            {msg.fromHandle ? `@${msg.fromHandle}` : 'Anonymous'}
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 400 }}>via {msg.kind}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                            {new Date(msg.receivedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, color: msg.isRead ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                        {msg.message}
                                    </p>
                                </div>
                                {!msg.isRead && (
                                    <button
                                        onClick={() => handleMarkRead(msg.id)}
                                        className="btn btn-ghost"
                                        style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}>
                                        Mark Read
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
