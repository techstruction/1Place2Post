'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { workspaceApi, setActiveWorkspaceId } from '../../../lib/api';

const INDUSTRIES = [
    'Advertising & Marketing', 'Agency', 'E-commerce', 'Education', 'Entertainment',
    'Fashion & Beauty', 'Finance', 'Food & Beverage', 'Health & Wellness',
    'Non-profit', 'Real Estate', 'Retail', 'Technology', 'Travel & Hospitality', 'Other',
];

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div style={{ display:'flex',gap:8,justifyContent:'center',marginBottom:'1.5rem' }}>
            {Array.from({length:total}).map((_,i)=>(
                <div key={i} style={{ width:i+1===current?24:8,height:8,borderRadius:4,background:i+1<=current?'var(--brand-500)':'var(--border-default)',transition:'all 0.2s' }} />
            ))}
        </div>
    );
}

export default function OnboardingStep2() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [industry, setIndustry] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const ws = await workspaceApi.create({ name, industry: industry || undefined });
            setActiveWorkspaceId(ws.id);
            router.push('/onboarding/step-3');
        } catch (err: any) { setError(err.message); }
        finally { setSaving(false); }
    }

    return (
        <div>
            <StepIndicator current={2} total={4} />
            <div className="card" style={{ padding:'2rem' }}>
                <h1 style={{ fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem' }}>Create your workspace</h1>
                <p style={{ color:'var(--text-muted)',marginBottom:'1.5rem' }}>
                    A workspace holds your social accounts, posts, and team members. You can create more workspaces later.
                </p>
                {error && <div className="alert-error" style={{ marginBottom:'1rem' }}>{error}</div>}
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label className="form-label">Workspace Name *</label>
                        <input className="form-input" required value={name} onChange={e=>setName(e.target.value)} placeholder="My Brand, Acme Agency…" autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Industry</label>
                        <select className="form-input" value={industry} onChange={e=>setIndustry(e.target.value)}>
                            <option value="">Select your industry…</option>
                            {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1.5rem' }}>
                        <button type="button" onClick={()=>router.back()} className="btn btn-ghost">← Back</button>
                        <button type="submit" className="btn btn-primary" disabled={!name||saving}>
                            {saving?'Creating…':'Create Workspace →'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
