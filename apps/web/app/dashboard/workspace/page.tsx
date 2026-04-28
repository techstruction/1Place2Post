'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  workspaceApi, getActiveWorkspaceId, setActiveWorkspaceId,
} from '../../../lib/api';
import type { WorkspaceWithRole, WorkspaceDetail } from '../../../lib/api';

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'badge-published', ADMIN: 'badge-scheduled',
  SUPERVISOR: 'badge-draft', MEMBER: 'badge-draft',
};
const ROLE_OPTIONS = ['ADMIN', 'SUPERVISOR', 'MEMBER'];
const INDUSTRIES = [
  'Advertising & Marketing', 'Agency', 'E-commerce', 'Education', 'Entertainment',
  'Fashion & Beauty', 'Finance', 'Food & Beverage', 'Health & Wellness',
  'Non-profit', 'Real Estate', 'Retail', 'Technology', 'Travel & Hospitality', 'Other',
];

export default function WorkspacePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [active, setActive] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const list = await workspaceApi.list();
      setWorkspaces(list);
      if (list.length === 0) { setLoading(false); return; }
      const activeId = getActiveWorkspaceId() ?? list[0].id;
      const matched = list.find(w => w.id === activeId) ?? list[0];
      setActiveWorkspaceId(matched.id);
      const detail = await workspaceApi.get(matched.id);
      setActive(detail);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const ws = await workspaceApi.create({ name: newName, industry: newIndustry || undefined });
      setWorkspaces(w => [...w, ws]);
      setActiveWorkspaceId(ws.id);
      const detail = await workspaceApi.get(ws.id);
      setActive(detail);
      setCreating(false); setNewName(''); setNewIndustry('');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); if (!active) return; setSaving(true); setError('');
    try {
      const member = await workspaceApi.invite(active.id, { email: inviteEmail, role: inviteRole });
      setActive(a => a ? { ...a, members: [...a.members, member] } : a);
      setInviteEmail('');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleRemove(userId: string) {
    if (!active || !confirm('Remove this member?')) return;
    await workspaceApi.removeMember(active.id, userId);
    setActive(a => a ? { ...a, members: a.members.filter(m => m.user.id !== userId) } : a);
  }

  async function handleRoleChange(userId: string, role: string) {
    if (!active) return;
    await workspaceApi.updateRole(active.id, userId, role);
    setActive(a => a ? { ...a, members: a.members.map(m => m.user.id === userId ? { ...m, role } : m) } : a);
  }

  function switchWorkspace(id: string) {
    setActiveWorkspaceId(id);
    workspaceApi.get(id).then(setActive);
  }

  if (loading) return <div className="card"><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div>;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Workspace</h1>
        <button className="btn btn-primary" onClick={() => setCreating(c => !c)}>
          {creating ? '✕ Cancel' : '+ New Workspace'}
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {creating && (
        <div className="card" style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Create Workspace</h2>
          <form onSubmit={createWorkspace}>
            <div className="form-group">
              <label className="form-label">Workspace Name *</label>
              <input className="form-input" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Acme Agency" />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="form-input" value={newIndustry} onChange={e => setNewIndustry(e.target.value)}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
          </form>
        </div>
      )}

      {workspaces.length > 1 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Your Workspaces</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {workspaces.map(ws => (
              <button key={ws.id} onClick={() => switchWorkspace(ws.id)}
                className={`btn ${active?.id === ws.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.875rem' }}>
                {ws.name}
                <span style={{ marginLeft: 6, opacity: 0.6, fontSize: '0.75rem' }}>{ws.myRole}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!active && workspaces.length === 0 ? (
        <div className="card empty">
          <h3>No workspace yet</h3>
          <p>Create a workspace to connect social accounts and invite team members.</p>
        </div>
      ) : active && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{active.name}</div>
                {active.industry && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{active.industry}</div>}
              </div>
              <span className="badge badge-published">{active.myRole}</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
                <tbody>
                  {active.members.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.user.name ?? '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.user.email}</td>
                      <td>
                        {m.role === 'OWNER' || active.myRole !== 'OWNER'
                          ? <span className={`badge ${ROLE_BADGE[m.role] ?? 'badge-draft'}`}>{m.role}</span>
                          : (
                            <select className="form-input"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: 'auto' }}
                              value={m.role} onChange={e => handleRoleChange(m.user.id, e.target.value)}>
                              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          )}
                      </td>
                      <td>
                        {m.role !== 'OWNER' && ['OWNER', 'ADMIN'].includes(active.myRole) && (
                          <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                            onClick={() => handleRemove(m.user.id)}>Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {['OWNER', 'ADMIN'].includes(active.myRole) && (
            <div className="card" style={{ maxWidth: 480 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Invite Member</h2>
              <form onSubmit={handleInvite}>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" required value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Inviting…' : 'Send Invite'}</button>
              </form>
            </div>
          )}
        </>
      )}
    </>
  );
}
