'use client';
import React from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';

type Props = { workspaceId: string; onClose: (connected?: boolean) => void };

export default function InstagramModal({ workspaceId, onClose }: Props) {
    function connectViaFacebook() {
        const token = localStorage.getItem('1p2p_token');
        window.location.href = `${API}/social/instagram/auth?token=${token}&workspaceId=${workspaceId}`;
    }

    return (
        <ModalShell title="Connect Instagram" onClose={onClose}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Instagram requires a <strong>Professional account</strong> (Business or Creator) linked to a Facebook Page.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                <button className="btn btn-primary" style={{ background: '#1877F2' }} onClick={connectViaFacebook}>
                    🔗 Connect via Facebook (Professional)
                </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '1rem' }}>
                Make sure your Instagram account is linked to a Facebook Page before connecting. Personal accounts are not supported.
            </p>
        </ModalShell>
    );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="card" style={{ width: 420, maxWidth: '90vw', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h2>
                    <button onClick={() => onClose()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}
