'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('1p2p_token') : null; }
function authFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } });
}

type Member = { id: string; role: string; userId: string; user: { id: string; name: string | null; email: string; }; };
type Team = { id: string; name: string; ownerId: string; members: Member[]; };

const ROLE_BADGE: Record<string, string> = { OWNER: 'badge-published', ADMIN: 'badge-scheduled', MEMBER: 'badge-draft' };

export default function TeamPage() {
    const router = useRouter();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [teamName, setTeamName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        authFetch('/teams/mine').then(r => r.ok ? r.json() : null)
            .then(setTeam)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    async function createTeam(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const res = await authFetch('/teams', { method: 'POST', body: JSON.stringify({ name: teamName }) });
            if (!res.ok) throw new Error((await res.json()).message);
            setTeam(await res.json());
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function invite(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const res = await authFetch('/teams/members', { method: 'POST', body: JSON.stringify({ email: inviteEmail }) });
            if (!res.ok) throw new Error((await res.json()).message);
            const member = await res.json();
            setTeam(t => t ? { ...t, members: [...t.members, member] } : t);
            setInviteEmail('');
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function removeMember(userId: string) {
        if (!confirm('Remove this member?')) return;
        await authFetch(`/teams/members/${userId}`, { method: 'DELETE' });
        setTeam(t => t ? { ...t, members: t.members.filter(m => m.user.id !== userId) } : t);
    }

    if (loading) return <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div>;

    return (
        <>
            <div className="page-header"><h1 className="page-title">Team</h1></div>

            {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {!team ? (
                <div className="card" style={{ maxWidth: 480 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Create a team workspace</h2>
                    <form onSubmit={createTeam}>
                        <div className="form-group">
                            <label className="form-label">Team Name *</label>
                            <input id="team-name-input" className="form-input" required value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="My Agency" />
                        </div>
                        <button id="create-team-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : '👥 Create Team'}</button>
                    </form>
                </div>
            ) : (
                <>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{team.name}</div>

                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
                                <tbody>
                                    {team.members.map(m => (
                                        <tr key={m.id}>
                                            <td style={{ fontWeight: 500 }}>{m.user.name ?? '—'}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{m.user.email}</td>
                                            <td><span className={`badge ${ROLE_BADGE[m.role] ?? 'badge-draft'}`}>{m.role}</span></td>
                                            <td>
                                                {m.role !== 'OWNER' && (
                                                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }} onClick={() => removeMember(m.user.id)}>Remove</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card" style={{ maxWidth: 480 }}>
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Invite Member by Email</h2>
                        <form onSubmit={invite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <input id="invite-email-input" type="email" className="form-input" style={{ flex: 1 }} required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" />
                            <button id="invite-member-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Inviting…' : '✉️ Invite'}</button>
                        </form>
                    </div>
                </>
            )}
        </>
    );
}
