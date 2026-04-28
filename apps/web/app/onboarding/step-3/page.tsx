'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlatformGrid from '../../../components/PlatformGrid';
import { getActiveWorkspaceId } from '../../../lib/api';

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div style={{ display:'flex',gap:8,justifyContent:'center',marginBottom:'1.5rem' }}>
            {Array.from({length:total}).map((_,i)=>(
                <div key={i} style={{ width:i+1===current?24:8,height:8,borderRadius:4,background:i+1<=current?'var(--brand-500)':'var(--border-default)',transition:'all 0.2s' }} />
            ))}
        </div>
    );
}

export default function OnboardingStep3() {
    const router = useRouter();
    const [workspaceId, setWorkspaceId] = useState('');
    const [connected, setConnected] = useState<string[]>([]);

    useEffect(() => {
        const wsId = getActiveWorkspaceId();
        if (!wsId) { router.push('/onboarding/step-2'); return; }
        setWorkspaceId(wsId);
    }, [router]);

    function handleConnected(platform: string) {
        setConnected(c => [...c, platform]);
    }

    if (!workspaceId) return null;

    return (
        <div>
            <StepIndicator current={3} total={4} />
            <div style={{ padding:'0 0 1rem' }}>
                <h1 style={{ fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem' }}>Add your social accounts</h1>
                <p style={{ color:'var(--text-muted)',marginBottom:'1.5rem' }}>
                    Connect the platforms you manage. You can add more from the Connections page anytime.
                </p>
                {connected.length > 0 && (
                    <div style={{ marginBottom:'1rem',padding:'0.5rem 0.75rem',borderRadius:8,background:'rgba(75,142,196,0.1)',border:'1px solid rgba(75,142,196,0.3)',fontSize:'0.875rem',color:'var(--text-primary)' }}>
                        ✓ Connected: {connected.join(', ')}
                    </div>
                )}
                <PlatformGrid workspaceId={workspaceId} onConnected={handleConnected} />
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'2rem' }}>
                    <button onClick={()=>router.back()} className="btn btn-ghost">← Back</button>
                    <button className="btn btn-primary" onClick={()=>router.push('/onboarding/step-4')}>
                        {connected.length > 0 ? 'Continue →' : 'Skip for now →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
