'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../lib/api';

type Post = { id: string; caption: string; status: string; scheduledAt: string | null; createdAt: string; };

export default function DashboardPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        postsApi.list()
            .then(setPosts)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    const stats = {
        total: posts.length,
        scheduled: posts.filter(p => p.status === 'SCHEDULED').length,
        drafts: posts.filter(p => p.status === 'DRAFT').length,
        published: posts.filter(p => p.status === 'PUBLISHED').length,
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Overview</h1>
                <Link href="/dashboard/posts/new" className="btn btn-primary" id="new-post-btn">+ New Post</Link>
            </div>

            <div className="card-grid">
                <div className="stat-card"><div className="stat-label">Total Posts</div><div className="stat-value">{stats.total}</div></div>
                <div className="stat-card"><div className="stat-label">Scheduled</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.scheduled}</div></div>
                <div className="stat-card"><div className="stat-label">Drafts</div><div className="stat-value" style={{ color: 'var(--text-muted)' }}>{stats.drafts}</div></div>
                <div className="stat-card"><div className="stat-label">Published</div><div className="stat-value" style={{ color: 'var(--success)' }}>{stats.published}</div></div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Posts</h2>
                    <Link href="/dashboard/posts" style={{ fontSize: '0.85rem' }}>View all →</Link>
                </div>
                {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading…</p> : posts.length === 0 ? (
                    <div className="empty"><h3>No posts yet</h3><p>Create your first post to get started.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Caption</th><th>Status</th><th>Scheduled</th></tr></thead>
                            <tbody>
                                {posts.slice(0, 5).map(post => (
                                    <tr key={post.id}>
                                        <td style={{ maxWidth: 280 }}><Link href={`/dashboard/posts/${post.id}`}>{post.caption.slice(0, 60)}{post.caption.length > 60 ? '…' : ''}</Link></td>
                                        <td><span className={`badge badge-${post.status.toLowerCase()}`}>{post.status}</span></td>
                                        <td style={{ color: 'var(--text-muted)' }}>{post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : '—'}</td>
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
