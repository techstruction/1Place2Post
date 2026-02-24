'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

type Message = { id: string; sender: string; message: string; createdAt: string; };
type Ticket = { id: string; subject: string; status: string; createdAt: string; updatedAt: string; messages?: Message[]; };

export default function SupportPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ subject: '', message: '' });
    const [reply, setReply] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        authFetch('/support/tickets').then(r => r.ok ? r.json() : Promise.reject())
            .then(setTickets).catch(() => router.push('/login')).finally(() => setLoading(false));
    }, [router]);

    async function createTicket(e: React.FormEvent) {
        e.preventDefault(); setSaving(true); setError('');
        try {
            const res = await authFetch('/support/tickets', { method: 'POST', body: JSON.stringify(form) });
            if (!res.ok) throw new Error((await res.json()).message);
            const ticket = await res.json();
            setTickets(t => [ticket, ...t]);
            setShowCreate(false); setForm({ subject: '', message: '' });
            openTicket(ticket.id);
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function openTicket(id: string) {
        const t = await authFetch(`/support/tickets/${id}`).then(r => r.json());
        setActiveTicket(t);
    }

    async function sendReply(e: React.FormEvent) {
        e.preventDefault(); if (!activeTicket) return;
        setSaving(true);
        try {
            const res = await authFetch(`/support/tickets/${activeTicket.id}/messages`, { method: 'POST', body: JSON.stringify({ message: reply }) });
            const msg = await res.json();
            setActiveTicket(t => t ? { ...t, messages: [...(t.messages ?? []), msg] } : t);
            setReply('');
        } finally { setSaving(false); }
    }

    async function closeTicket(id: string) {
        if (!confirm('Close this ticket?')) return;
        await authFetch(`/support/tickets/${id}/close`, { method: 'PATCH' });
        setTickets(t => t.map(x => x.id === id ? { ...x, status: 'CLOSED' } : x));
        if (activeTicket?.id === id) setActiveTicket(t => t ? { ...t, status: 'CLOSED' } : t);
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Support</h1>
                <button id="new-ticket-btn" className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>{showCreate ? '✕ Cancel' : '+ New Ticket'}</button>
            </div>

            {showCreate && (
                <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={createTicket}>
                        <div className="form-group"><label className="form-label">Subject *</label><input id="ticket-subject" className="form-input" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
                        <div className="form-group"><label className="form-label">Message *</label><textarea id="ticket-message" className="form-input" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ minHeight: 80 }} /></div>
                        <button id="submit-ticket-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting…' : '🎫 Submit Ticket'}</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: activeTicket ? '280px 1fr' : '1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Ticket list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {loading ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div> :
                        tickets.length === 0 ? <div className="card"><p style={{ color: 'var(--text-dim)' }}>No tickets yet.</p></div> :
                            tickets.map(t => (
                                <div key={t.id} className="card" onClick={() => openTicket(t.id)} style={{ cursor: 'pointer', borderLeft: activeTicket?.id === t.id ? '3px solid var(--accent)' : 'none', paddingLeft: activeTicket?.id === t.id ? 'calc(var(--card-pad) - 3px)' : undefined }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{t.subject}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span className={`badge ${t.status === 'OPEN' ? 'badge-published' : 'badge-draft'}`}>{t.status}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(t.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                    }
                </div>

                {/* Thread view */}
                {activeTicket && (
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <div style={{ fontWeight: 700 }}>{activeTicket.subject}</div>
                            {activeTicket.status === 'OPEN' && (
                                <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => closeTicket(activeTicket.id)}>Close Ticket</button>
                            )}
                        </div>

                        {(activeTicket.messages ?? []).map(m => (
                            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'USER' ? 'flex-end' : 'flex-start' }}>
                                <div style={{ background: m.sender === 'USER' ? 'var(--accent-muted)' : 'var(--bg-input)', borderRadius: 10, padding: '0.6rem 0.9rem', maxWidth: '80%', fontSize: '0.88rem', lineHeight: 1.5 }}>
                                    {m.message}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>{m.sender === 'USER' ? 'You' : 'Support'} · {new Date(m.createdAt).toLocaleTimeString()}</span>
                            </div>
                        ))}

                        {activeTicket.status === 'OPEN' && (
                            <form onSubmit={sendReply} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <textarea id="reply-input" className="form-input" style={{ flex: 1, minHeight: 48 }} value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply…" required />
                                <button type="submit" className="btn btn-primary" disabled={saving || !reply.trim()}>Send</button>
                            </form>
                        )}
                        {activeTicket.status === 'CLOSED' && (
                            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '0.5rem' }}>This ticket is closed.</div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
