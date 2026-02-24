'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, setToken } from '../../lib/api';

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

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link href="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
