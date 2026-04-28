import { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg-base)', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>
                    <span style={{ color: '#E06028' }}>1</span>
                    <span style={{ color: '#4B8EC4' }}>Place</span>
                    <span style={{ color: '#E06028' }}>2</span>
                    <span style={{ color: '#4B8EC4' }}>Post</span>
                </span>
            </div>
            <div style={{ width: '100%', maxWidth: 560 }}>
                {children}
            </div>
        </div>
    );
}
