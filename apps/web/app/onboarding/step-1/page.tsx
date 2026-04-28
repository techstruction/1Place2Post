'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '../../../lib/api';

const ROLES = [
    { value: 'CREATOR', label: 'Freelance Creator / Influencer' },
    { value: 'BUSINESS_OWNER', label: 'Small Business Owner' },
    { value: 'SOCIAL_MEDIA_MANAGER', label: 'Social Media Manager' },
    { value: 'AGENCY', label: 'Marketing Agency' },
    { value: 'OTHER', label: 'Other' },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: '1.5rem' }}>
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{
                    width: i + 1 === current ? 24 : 8, height: 8, borderRadius: 4,
                    background: i + 1 <= current ? 'var(--brand-500)' : 'var(--border-default)',
                    transition: 'all 0.2s',
                }} />
            ))}
        </div>
    );
}

export default function OnboardingStep1() {
    const router = useRouter();
    const [role, setRole] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleContinue() {
        if (!role) return;
        setSaving(true);
        try { await userApi.updateProfile({ userRole: role }); }
        catch { /* non-critical */ }
        finally { setSaving(false); }
        router.push('/onboarding/step-2');
    }

    return (
        <div>
            <StepIndicator current={1} total={4} />
            <div className="card" style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>First, tell us about yourself</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>This helps us tailor your experience.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {ROLES.map(r => (
                        <button
                            key={r.value}
                            onClick={() => setRole(r.value)}
                            style={{
                                padding: '0.875rem 1rem', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                fontWeight: 500, fontSize: '0.9rem',
                                border: role === r.value ? '2px solid var(--brand-500)' : '1.5px solid var(--border-default)',
                                background: role === r.value ? 'rgba(224,96,40,0.08)' : 'var(--bg-card)',
                                color: role === r.value ? 'var(--brand-500)' : 'var(--text-primary)',
                                transition: 'all 0.1s',
                            }}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => router.push('/onboarding/step-2')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>Skip</button>
                    <button className="btn btn-primary" onClick={handleContinue} disabled={!role || saving}>
                        {saving ? 'Saving…' : 'Continue →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
