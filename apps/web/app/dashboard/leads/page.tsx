'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

type Lead = {
    id: string;
    handle: string;
    status: 'NEW' | 'CLICKED' | 'CLOSED';
    createdAt: string;
    sourceMessage?: { platform: string | null; message: string; };
};

export default function LeadsPage() {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadData() {
        setError(null);
        try {
            const res = await authFetch('/leads');
            if (res.status === 401) { router.push('/login'); return; }
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            setLeads(await res.json());
        } catch (err: any) {
            setError(err.message || 'Failed to load leads');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    async function handleStatusChange(id: string, status: string) {
        try {
            const res = await authFetch(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
            if (res.ok) setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as any } : l));
        } catch { /* silent */ }
    }

    if (loading) return <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading leads…</p></div>;

    return (
        <div className="leads-page">
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">Leads Pipeline</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                    Track users collected via AI bot interactions and link-in-bio clicks.
                </p>
            </div>

            {error && (
                <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-danger, #e53e3e)', marginBottom: '1rem' }}>
                    <p style={{ color: 'var(--color-danger, #e53e3e)', margin: 0 }}>⚠️ {error}</p>
                    <button className="btn btn-ghost" style={{ marginTop: '0.8rem', fontSize: '0.85rem' }} onClick={loadData}>Retry</button>
                </div>
            )}

            <div className="card">
                {leads.length === 0 ? (
                    <div className="empty">
                        <h3>No leads yet</h3>
                        <p>Bot rules catching handles or link clicks will appear here.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Handle</th>
                                    <th>Source Event</th>
                                    <th>Status</th>
                                    <th>Date Added</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => (
                                    <tr key={lead.id}>
                                        <td style={{ fontWeight: 600 }}>@{lead.handle}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {lead.sourceMessage ? (
                                                <span title={lead.sourceMessage.message}>
                                                    Bot Reply ({lead.sourceMessage.platform || 'Unknown'})
                                                </span>
                                            ) : 'Link Click'}
                                        </td>
                                        <td>
                                            <span className={`badge ${lead.status === 'NEW' ? 'badge-draft' : lead.status === 'CLICKED' ? 'badge-primary' : 'badge-published'}`} style={{ fontSize: '0.75rem' }}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <select
                                                className="form-input"
                                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
                                                value={lead.status}
                                                onChange={e => handleStatusChange(lead.id, e.target.value)}
                                            >
                                                <option value="NEW">New</option>
                                                <option value="CLICKED">Clicked Link</option>
                                                <option value="CLOSED">Closed/Won</option>
                                            </select>
                                        </td>
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
