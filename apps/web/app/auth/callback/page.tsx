'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('1p2p_token', token);
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [router, searchParams]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                <h1 style={{ color: 'var(--color-heading)', marginBottom: '0.5rem' }}>Authenticating...</h1>
                <p style={{ color: 'var(--text-muted)' }}>Securely logging you in.</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}><p style={{ color: 'var(--text-dim)' }}>Loading...</p></div>}>
            <CallbackContent />
        </Suspense>
    );
}
