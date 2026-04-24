'use client';

export default function AdminSettingsPage() {
    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>System Settings</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Platform-wide configuration and operational settings.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Environment Info */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Environment Configuration</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {[
                            { label: 'API URL', value: process.env.NEXT_PUBLIC_API_URL || 'localhost:35763/api' },
                            { label: 'App Environment', value: 'Staging' },
                            { label: 'Database', value: 'PostgreSQL 15' },
                            { label: 'Auth Method', value: 'JWT + Google OAuth' },
                        ].map(item => (
                            <div key={item.label} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-base)', borderRadius: 8 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 12, padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#dc2626' }}>⚠️ Danger Zone</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        These actions are irreversible. Proceed with extreme caution.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn"
                            style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.3)', fontWeight: 600 }}
                            onClick={() => alert('This feature requires manual server access on the VPS. Contact your system administrator.')}
                        >
                            🗑️ Flush Publish Queue
                        </button>
                        <button
                            className="btn"
                            style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.3)', fontWeight: 600 }}
                            onClick={() => alert('Maintenance mode can be toggled via the Feature Flags page.')}
                        >
                            🔒 Enable Maintenance Mode
                        </button>
                    </div>
                </div>

                {/* Google OAuth Info */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Google OAuth Configuration</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Configure "Sign in with Google" for your users. Credentials are stored as environment variables on the server.
                    </p>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: 'var(--bg-base)', padding: '1rem', borderRadius: 8, color: 'var(--text-dim)' }}>
                        GOOGLE_CLIENT_ID=your-client-id<br />
                        GOOGLE_CLIENT_SECRET=your-secret<br />
                        GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        Set these in <code>.env.staging</code> on the VPS, then redeploy to activate Google login.
                    </p>
                </div>
            </div>
        </div>
    );
}
