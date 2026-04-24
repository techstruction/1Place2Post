'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { inboxApi } from '../../../lib/api';
import { SentimentBadge } from '../../../components/SentimentBadge';
import { PlatformBadge } from '../../../components/PlatformBadge';

type InboxMessage = {
  id: string;
  platform: string | null;
  kind: string;
  fromHandle: string | null;
  message: string;
  receivedAt: string;
  isRead: boolean;
};

const PLATFORMS = ['ALL', 'INSTAGRAM', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'TIKTOK'];

export default function InboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    const token = localStorage.getItem('1p2p_token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: InboxMessage[] = await res.json();
      setMessages(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleMarkRead(id: string) {
    try {
      await inboxApi.markRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch { /* silent */ }
  }

  async function handleMarkAllRead() {
    try {
      await inboxApi.markAllRead();
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    } catch { /* silent */ }
  }

  const platformCounts = PLATFORMS.reduce<Record<string, number>>((acc, p) => {
    acc[p] = p === 'ALL'
      ? messages.length
      : messages.filter(m => m.platform === p).length;
    return acc;
  }, {});

  const filtered = selectedPlatform === 'ALL'
    ? messages
    : messages.filter(m => m.platform === selectedPlatform);

  const selected = messages.find(m => m.id === selectedId) ?? null;
  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">
          Unified Inbox
          {unreadCount > 0 && <span className="badge badge-brand" style={{ marginLeft: '0.8rem' }}>{unreadCount} new</span>}
        </h1>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={handleMarkAllRead}>✓ Mark All as Read</button>
        )}
      </div>

      {error && (
        <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--danger)', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>⚠ {error}</p>
          <button className="btn btn-ghost" style={{ marginTop: '0.8rem', fontSize: '0.85rem' }} onClick={loadData}>Retry</button>
        </div>
      )}

      <div className="card" style={{
        padding: 0,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '120px 280px 1fr',
        height: 'calc(100vh - 220px)',
        minHeight: 400,
      }}>
        {/* Column 1: Platform filter */}
        <div style={{ borderRight: '1px solid var(--border-default)', overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-dim)', textTransform: 'uppercase', padding: '0 8px', marginBottom: 4 }}>
            Accounts
          </span>
          {PLATFORMS.filter(p => p === 'ALL' || platformCounts[p] > 0).map(p => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: selectedPlatform === p ? 600 : 400,
                backgroundColor: selectedPlatform === p ? 'var(--brand-muted)' : 'transparent',
                color: selectedPlatform === p ? 'var(--brand-500)' : 'var(--text-secondary)',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span>{p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}</span>
              <span style={{
                fontSize: 10,
                backgroundColor: selectedPlatform === p ? 'var(--brand-500)' : 'var(--bg-hover)',
                color: selectedPlatform === p ? '#fff' : 'var(--text-dim)',
                borderRadius: 10,
                padding: '1px 6px',
                minWidth: 20,
                textAlign: 'center',
              }}>
                {platformCounts[p]}
              </span>
            </button>
          ))}
        </div>

        {/* Column 2: Thread list */}
        <div style={{ borderRight: '1px solid var(--border-default)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: 16, color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--text-dim)', fontSize: 13, textAlign: 'center' }}>No messages</div>
          ) : (
            filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => { setSelectedId(msg.id); if (!msg.isRead) handleMarkRead(msg.id); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '12px 14px',
                  border: 'none',
                  borderBottomWidth: 1,
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'var(--border-subtle)',
                  cursor: 'pointer',
                  backgroundColor: selectedId === msg.id
                    ? 'var(--brand-muted)'
                    : msg.isRead ? 'transparent' : 'rgba(79, 110, 247, 0.04)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: msg.isRead ? 500 : 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.fromHandle ? `@${msg.fromHandle}` : 'Anonymous'}
                  </span>
                  <SentimentBadge message={msg.message} />
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {msg.message}
                </p>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  {new Date(msg.receivedAt).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Column 3: Thread view */}
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {selected ? (
            <>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selected.fromHandle ? `@${selected.fromHandle}` : 'Anonymous'}
                  </div>
                  {selected.platform && (
                    <div style={{ marginTop: 4 }}>
                      <PlatformBadge platform={selected.platform} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {new Date(selected.receivedAt).toLocaleString()}
                </span>
              </div>

              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <div style={{
                  backgroundColor: 'var(--bg-hover)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  maxWidth: 560,
                }}>
                  {selected.message}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                  via {selected.kind}
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
                <textarea
                  placeholder="Write a reply…"
                  className="form-input"
                  style={{ width: '100%', minHeight: 80, resize: 'vertical', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ fontSize: 13 }}>Send Reply</button>
                  <button className="btn btn-ghost" style={{ fontSize: 13 }}>Save Draft</button>
                </div>
                <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                  Note: Reply sending requires platform API integration (Phase 11).
                </p>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              Select a message to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
