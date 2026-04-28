'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveWorkspaceId, workspaceApi } from '../../../lib/api';
import PlatformGrid from '../../../components/PlatformGrid';

const PLATFORM_LABELS: Record<string, string> = {
    INSTAGRAM:'Instagram', FACEBOOK:'Facebook', TWITTER:'Twitter/X',
    YOUTUBE:'YouTube', THREADS:'Threads', TELEGRAM:'Telegram', TIKTOK:'TikTok',
};

const TOKEN_STATUS_BADGE: Record<string, string> = {
    ACTIVE:'badge-published', TOKEN_EXPIRING:'badge-scheduled',
    TOKEN_CRITICAL:'badge-scheduled', TOKEN_EXPIRED:'badge-failed', DISCONNECTED:'badge-failed',
};

type SocialAccount = {
    id: string; platform: string; username: string | null; displayName: string | null;
    tokenStatus: string; tokenExpiry: string | null; isActive: boolean;
};

export default function ConnectionsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const wsId = getActiveWorkspaceId();
        if (!wsId) { router.push('/dashboard'); return; }
        setWorkspaceId(wsId);

        workspaceApi.socialAccounts(wsId)
            .then(setAccounts)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));

        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) setSuccessMsg('Successfully connected!');
    }, [router]);

    async function handleDisconnect(id: string) {
        if (!confirm('Disconnect this account?')) return;
        const token = localStorage.getItem('1p2p_token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/social-accounts/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        setAccounts(a => a.filter(x => x.id !== id));
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Connections</h1>
                <button className="btn btn-primary" onClick={() => setShowAdd(s => !s)}>
                    {showAdd ? '✕ Hide' : '+ Connect Account'}
                </button>
            </div>

            {successMsg && (
                <div style={{ marginBottom:'1rem',padding:'0.75rem 1rem',borderRadius:8,background:'rgba(75,142,196,0.1)',border:'1px solid rgba(75,142,196,0.3)',fontSize:'0.875rem' }}>
                    ✓ {successMsg}
                </div>
            )}

            {showAdd && workspaceId && (
                <div className="card" style={{ marginBottom:'1.5rem' }}>
                    <h2 style={{ fontSize:'1rem',fontWeight:600,marginBottom:'1.25rem' }}>Choose a platform to connect</h2>
                    <PlatformGrid workspaceId={workspaceId} onConnected={() => {
                        workspaceApi.socialAccounts(workspaceId).then(setAccounts);
                        setShowAdd(false);
                    }} />
                </div>
            )}

            <div className="card">
                {loading ? (
                    <p style={{ color:'var(--text-dim)' }}>Loading…</p>
                ) : accounts.length === 0 ? (
                    <div className="empty">
                        <h3>No connected accounts</h3>
                        <p>Click &quot;Connect Account&quot; above to add your first social platform.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Platform</th><th>Account</th><th>Status</th><th>Expiry</th><th></th></tr></thead>
                            <tbody>
                                {accounts.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight:500 }}>{PLATFORM_LABELS[a.platform] ?? a.platform}</td>
                                        <td style={{ color:'var(--text-muted)' }}>{a.username ?? a.displayName ?? '—'}</td>
                                        <td><span className={`badge ${TOKEN_STATUS_BADGE[a.tokenStatus] ?? 'badge-draft'}`}>{a.tokenStatus}</span></td>
                                        <td style={{ color:'var(--text-muted)',fontSize:'0.8rem' }}>
                                            {a.tokenExpiry ? new Date(a.tokenExpiry).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost" style={{ fontSize:'0.8rem',padding:'0.3rem 0.6rem' }} onClick={() => handleDisconnect(a.id)}>
                                                Disconnect
                                            </button>
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
