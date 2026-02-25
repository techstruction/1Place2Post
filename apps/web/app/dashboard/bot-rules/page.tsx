'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { botRulesApi } from '../../../lib/api';

type BotRule = { id: string; name: string; matchType: string; matchValue: string; replyText: string; webhookUrl: string | null; active: boolean; triggerType: string; platform: string | null; socialAccountId: string | null; replyMode: string; cooldownSeconds: number; };

export default function BotRulesPage() {
    const router = useRouter();
    const [rules, setRules] = useState<BotRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', matchType: 'CONTAINS', matchValue: '', replyText: '', webhookUrl: '', triggerType: 'comment', platform: '', socialAccountId: '', replyMode: 'reply', cooldownSeconds: 0 });
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function loadData() {
        setLoadError(null);
        try {
            const data = await botRulesApi.list();
            setRules(data);
        } catch (err: any) {
            if (err?.status === 401 || err?.message?.includes('401')) { router.push('/login'); return; }
            setLoadError(err?.message || 'Failed to load bot rules');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const rule = await botRulesApi.create({
                name: form.name,
                matchType: form.matchType,
                matchValue: form.matchValue,
                replyText: form.replyText,
                webhookUrl: form.webhookUrl || undefined,
                triggerType: form.triggerType,
                platform: form.platform || undefined,
                socialAccountId: form.socialAccountId || undefined,
                replyMode: form.replyMode,
                cooldownSeconds: Number(form.cooldownSeconds),
                active: true,
            });
            setRules(prev => [rule, ...prev]);
            setShowCreate(false);
            setForm({ name: '', matchType: 'CONTAINS', matchValue: '', replyText: '', webhookUrl: '', triggerType: 'comment', platform: '', socialAccountId: '', replyMode: 'reply', cooldownSeconds: 0 });
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    async function toggleActive(rule: BotRule) {
        const updated = await botRulesApi.update(rule.id, { active: !rule.active });
        setRules(prev => prev.map(r => r.id === rule.id ? updated : r));
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this bot rule?')) return;
        await botRulesApi.delete(id);
        setRules(prev => prev.filter(r => r.id !== id));
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Bot Rules</h1>
                <button id="create-bot-rule-btn" onClick={() => setShowCreate(s => !s)} className="btn btn-primary">
                    {showCreate ? '✕ Cancel' : '+ New Rule'}
                </button>
            </div>

            {loadError && (
                <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-danger, #e53e3e)', marginBottom: '1rem' }}>
                    <p style={{ color: 'var(--color-danger, #e53e3e)', margin: 0 }}>⚠️ {loadError}</p>
                    <button className="btn btn-ghost" style={{ marginTop: '0.8rem', fontSize: '0.85rem' }} onClick={loadData}>Retry</button>
                </div>
            )}

            {showCreate && (
                <div className="card" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Create Rule</h2>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">Rule Name *</label>
                            <input id="rule-name" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder='e.g. "Pricing reply"' />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Trigger Type</label>
                                <select className="form-input" value={form.triggerType} onChange={e => setForm(f => ({ ...f, triggerType: e.target.value }))}>
                                    <option value="comment">Comment</option>
                                    <option value="dm">Direct Message (DM)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Platform (Optional)</label>
                                <select className="form-input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                                    <option value="">All Platforms</option>
                                    <option value="INSTAGRAM">Instagram</option>
                                    <option value="TIKTOK">TikTok</option>
                                    <option value="FACEBOOK">Facebook</option>
                                    <option value="TWITTER">Twitter/X</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Match Type</label>
                                <select className="form-input" value={form.matchType} onChange={e => setForm(f => ({ ...f, matchType: e.target.value }))}>
                                    <option value="CONTAINS">Contains</option>
                                    <option value="REGEX">Regex</option>
                                    <option value="ANY">Any message</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Match Value</label>
                                <input id="rule-match-value" className="form-input" value={form.matchValue} onChange={e => setForm(f => ({ ...f, matchValue: e.target.value }))} placeholder='e.g. "pricing"' disabled={form.matchType === 'ANY'} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Reply Mode</label>
                                <select className="form-input" value={form.replyMode} onChange={e => setForm(f => ({ ...f, replyMode: e.target.value }))}>
                                    <option value="reply">Thread Reply</option>
                                    <option value="dm">Send DM</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reply Text *</label>
                                <textarea id="rule-reply" className="form-input" required value={form.replyText} onChange={e => setForm(f => ({ ...f, replyText: e.target.value }))} placeholder="Here are our prices…" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Webhook URL (optional)</label>
                            <input className="form-input" type="url" value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))} placeholder="https://your-endpoint.com/webhook" />
                        </div>
                        <button id="save-bot-rule-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : '🤖 Create Rule'}</button>
                    </form>
                </div>
            )}

            <div className="card">
                {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading…</p> : rules.length === 0 ? (
                    <div className="empty"><h3>No bot rules yet</h3><p>Create a rule to auto-reply to incoming messages.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Name</th><th>Match</th><th>Reply</th><th>Status</th><th></th></tr></thead>
                            <tbody>
                                {rules.map(rule => (
                                    <tr key={rule.id}>
                                        <td style={{ fontWeight: 500 }}>{rule.name}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <span className="badge badge-draft">{rule.matchType}</span>
                                            {rule.matchType !== 'ANY' && <span style={{ marginLeft: '0.4rem' }}>{rule.matchValue}</span>}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.replyText}</td>
                                        <td>
                                            <span className={`badge ${rule.active ? 'badge-published' : 'badge-draft'}`}>{rule.active ? 'Active' : 'Inactive'}</span>
                                        </td>
                                        <td style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => toggleActive(rule)}>
                                                {rule.active ? 'Pause' : 'Enable'}
                                            </button>
                                            <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)' }} onClick={() => handleDelete(rule.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
