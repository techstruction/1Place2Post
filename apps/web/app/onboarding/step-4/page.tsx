'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '../../../lib/api';

export default function OnboardingStep4() {
    const router = useRouter();

    useEffect(() => {
        userApi.updateProfile({ onboardingCompletedAt: new Date() }).catch(() => {});
    }, []);

    return (
        <div>
            <div style={{ display:'flex',gap:8,justifyContent:'center',marginBottom:'1.5rem' }}>
                {[1,2,3,4].map(i=>(
                    <div key={i} style={{ width:24,height:8,borderRadius:4,background:'var(--brand-500)' }} />
                ))}
            </div>
            <div className="card" style={{ padding:'2.5rem',textAlign:'center' }}>
                <div style={{ fontSize:'3rem',marginBottom:'1rem' }}>🎉</div>
                <h1 style={{ fontSize:'1.75rem',fontWeight:800,marginBottom:'0.75rem' }}>You&apos;re all set!</h1>
                <p style={{ color:'var(--text-muted)',marginBottom:'2rem',lineHeight:1.6 }}>
                    Your workspace is ready. Start by scheduling your first post or exploring the dashboard.
                </p>
                <div style={{ display:'flex',flexDirection:'column',gap:'0.75rem' }}>
                    <button className="btn btn-primary" style={{ fontSize:'1rem',padding:'0.875rem' }} onClick={()=>router.push('/dashboard/posts/new')}>
                        ✏️ Create Your First Post
                    </button>
                    <button className="btn btn-ghost" onClick={()=>router.push('/dashboard')}>
                        Take me to the Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
