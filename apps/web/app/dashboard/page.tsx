'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postsApi } from '../../lib/api';

type Post = {
  id: string;
  caption: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getUserName(): string {
  if (typeof window === 'undefined') return '';
  try {
    const token = localStorage.getItem('1p2p_token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    const name: string = payload.name || payload.email || '';
    return name.split(' ')[0];
  } catch {
    return '';
  }
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'PUBLISHED' ? 'var(--success)' :
    status === 'SCHEDULED' ? 'var(--warning)' :
    status === 'FAILED'    ? 'var(--danger)' :
    status === 'BLOCKED'   ? 'var(--danger)' :
    'var(--text-dim)';
  return (
    <span style={{
      display: 'inline-block',
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      marginTop: 1,
    }} />
  );
}

const QUICK_ACTIONS = [
  {
    label: 'Create Post',
    description: 'Write and schedule your next post',
    href: '/dashboard/posts/new',
    accent: '#E06028',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    ),
  },
  {
    label: 'Connect Account',
    description: 'Link a social media platform',
    href: '/dashboard/connections',
    accent: '#4B8EC4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M8 2v4M16 2v4"/>
        <rect x="5" y="6" width="14" height="7" rx="1"/>
        <path d="M8 13v3a4 4 0 0 0 8 0v-3"/>
      </svg>
    ),
  },
  {
    label: 'Browse Templates',
    description: 'Start from a proven format',
    href: '/dashboard/templates',
    accent: '#E06028',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M2 8.5 12 3l10 5.5-10 5.5z"/>
        <path d="M2 13l10 5.5L22 13"/>
        <path d="M2 17.5l10 5.5L22 17.5"/>
      </svg>
    ),
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const name = getUserName();

  useEffect(() => {
    postsApi.list()
      .then(setPosts)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const stats = {
    total:     posts.length,
    scheduled: posts.filter(p => p.status === 'SCHEDULED').length,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
  };

  const recent = posts.slice(0, 5);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* Greeting */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--brand-secondary)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}>
          {getGreeting()}{name ? `, ${name}` : ''}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          margin: 0,
        }}>
          Welcome to{' '}
          <span style={{ color: '#E06028' }}>1</span>
          <span style={{ color: '#4B8EC4' }}>Place</span>
          <span style={{ color: '#E06028' }}>2</span>
          <span style={{ color: '#4B8EC4' }}>Post</span>
        </h1>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: '1.25rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, transform 0.1s',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = action.accent;
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            <span style={{ color: action.accent }}>{action.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                {action.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Posts', value: loading ? '—' : stats.total,     color: 'var(--text-primary)' },
          { label: 'Scheduled',   value: loading ? '—' : stats.scheduled, color: 'var(--warning)' },
          { label: 'Published',   value: loading ? '—' : stats.published, color: 'var(--success)' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Posts */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Recent Posts</span>
          <button
            onClick={() => router.push('/dashboard/posts')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'var(--brand-secondary)',
              fontWeight: 500,
              padding: 0,
            }}
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            Loading…
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              No posts yet
            </div>
            <button
              onClick={() => router.push('/dashboard/posts/new')}
              style={{
                background: '#E06028',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Create your first post
            </button>
          </div>
        ) : (
          recent.map((post, i) => (
            <div
              key={post.id}
              onClick={() => router.push(`/dashboard/posts/${post.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.85rem 1.25rem',
                borderBottom: i < recent.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              <StatusDot status={post.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {post.caption || '(no caption)'}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', flexShrink: 0 }}>
                {post.status.toLowerCase()}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
