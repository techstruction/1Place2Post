'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../../lib/api';

type Post = { id: string; caption: string; status: string; scheduledAt: string | null; createdAt: string; };

export default function PostsPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        postsApi.list()
            .then(setPosts)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    async function handleDelete(id: string) {
        if (!confirm('Delete this post?')) return;
        await postsApi.delete(id);
        setPosts(p => p.filter(x => x.id !== id));
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Posts</h1>
                <Link href="/dashboard/posts/new" className="btn btn-primary" id="create-post-btn">+ New Post</Link>
            </div>

            <div className="card">
                {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading…</p> : posts.length === 0 ? (
                    <div className="empty"><h3>No posts yet</h3><p>Hit "New Post" to schedule your first post.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr><th>Caption</th><th>Status</th><th>Scheduled For</th><th>Created</th><th></th></tr>
                            </thead>
                            <tbody>
                                {posts.map(post => (
                                    <tr key={post.id}>
                                        <td style={{ maxWidth: 300 }}>
                                            <Link href={`/dashboard/posts/${post.id}`}>{post.caption.slice(0, 70)}{post.caption.length > 70 ? '…' : ''}</Link>
                                        </td>
                                        <td><span className={`badge badge-${post.status.toLowerCase()}`}>{post.status}</span></td>
                                        <td style={{ color: 'var(--text-muted)' }}>{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : '—'}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(post.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                                onClick={() => handleDelete(post.id)}>Delete</button>
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
