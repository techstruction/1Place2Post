'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, setToken } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authApi.register(email, password, name);
            setToken(res.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-box">
                <h1 className="auth-title">Create account</h1>
                <p className="auth-sub">Start managing all your social posts in one place</p>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name (optional)</label>
                        <input id="name" type="text" className="form-input" value={name}
                            onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input id="register-email" type="email" className="form-input" value={email}
                            onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password (min 8 chars)</label>
                        <input id="register-password" type="password" className="form-input" value={password}
                            onChange={e => setPassword(e.target.value)} required minLength={8} />
                    </div>
                    <button id="register-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }}></div>
                    <span style={{ padding: '0 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>or</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }}></div>
                </div>

                <a href={`${API_URL}/auth/google`} className="btn btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'white', color: '#333', border: '1px solid #d1d5db', transition: 'background-color 0.2s', textDecoration: 'none', fontWeight: 600 }}>
                    <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 18, height: 18 }} />
                    Continue with Google
                </a>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link href="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
