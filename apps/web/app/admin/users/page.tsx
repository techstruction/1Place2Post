'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function adminFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

type User = { id: string; email: string; name: string | null; role: string; plan?: string; createdAt: string; _count: { posts: number; socialAccounts: number }; };

const ROLE_COLORS: Record<string, string> = { ADMIN: '#6f42c1', USER: '#059669' };

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    useEffect(() => {
        adminFetch('/admin/users')
            .then(async (r) => {
                if (!r.ok) {
                    if (r.status === 401 || r.status === 403) throw new Error('Unauthorized or Session Expired');
                    throw new Error('Failed to load users');
                }
                const data = await r.json();
                if (Array.isArray(data)) setUsers(data);
                else throw new Error('Invalid users data payload');
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    async function changeRole(id: string, role: string) {
        try {
            const res = await adminFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
            if (!res.ok) throw new Error('Failed to update role');
            setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
        } catch (e: any) {
            alert(e.message);
        }
    }

    // Mock function to simulate Plan Assignment
    async function changePlan(id: string, plan: string) {
        // In a real scenario, this would persist the change via an API
        setUsers(prev => prev.map(u => u.id === id ? { ...u, plan } : u));
    }

    async function deleteUser(id: string) {
        await adminFetch(`/admin/users/${id}`, { method: 'DELETE' });
        setUsers(prev => prev.filter(u => u.id !== id));
        setConfirmDelete(null);
    }

    const filtered = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name ?? '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-heading)', marginBottom: '0.4rem' }}>User Management</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {users.length} registered users · Edit roles and manage accounts.
                </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    className="form-input"
                    placeholder="🔍 Search by name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 380 }}
                />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <p style={{ padding: '1.5rem', color: 'var(--text-dim)' }}>Loading users…</p>
                ) : error ? (
                    <div style={{ padding: '1.5rem' }}>
                        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
                        <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role & Plan</th>
                                    <th>Posts</th>
                                    <th>Accounts</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--color-heading)' }}>{user.name ?? 'No name'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '0.2rem 0.6rem',
                                                    borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                                                    backgroundColor: `${ROLE_COLORS[user.role] ?? '#888'}22`,
                                                    color: ROLE_COLORS[user.role] ?? '#888',
                                                }}>{user.role}</span>
                                                <select
                                                    className="form-input"
                                                    style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', width: 'auto', backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                                                    value={user.plan || 'free'}
                                                    onChange={e => changePlan(user.id, e.target.value)}
                                                >
                                                    <option value="free">Free (Starter)</option>
                                                    <option value="low">Low (Creator)</option>
                                                    <option value="medium">Medium (Pro)</option>
                                                    <option value="high">High (Enterprise)</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{user._count.posts}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{user._count.socialAccounts}</td>
                                        <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                <select
                                                    className="form-input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                                                    value={user.role}
                                                    onChange={e => changeRole(user.id, e.target.value)}
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                                {confirmDelete === user.id ? (
                                                    <>
                                                        <button className="btn btn-ghost" style={{ fontSize: '0.75rem', color: '#dc2626', padding: '0.25rem 0.5rem' }} onClick={() => deleteUser(user.id)}>Confirm</button>
                                                        <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                                                    </>
                                                ) : (
                                                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', color: '#dc2626', padding: '0.25rem 0.5rem' }} onClick={() => setConfirmDelete(user.id)}>Delete</button>
                                                )}
                                            </div>
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
