import { notFound } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';

type LinkItem = { id: string; label: string; url: string; };
type LinkPage = { id: string; slug: string; title: string; bio: string | null; avatarUrl: string | null; items: LinkItem[]; };

async function getPage(slug: string): Promise<LinkPage | null> {
    try {
        const res = await fetch(`${API_BASE}/l/${slug}`, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

export default async function PublicLinkPage({ params }: { params: { slug: string } }) {
    const page = await getPage(params.slug);
    if (!page) notFound();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #12101e 100%)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '3rem 1rem',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            <div style={{ width: '100%', maxWidth: 460 }}>
                {/* Profile card */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {page.avatarUrl && (
                        <img src={page.avatarUrl} alt={page.title}
                            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(124,92,252,0.4)', marginBottom: '1rem' }} />
                    )}
                    <h1 style={{ color: '#f0f0ff', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{page.title}</h1>
                    {page.bio && <p style={{ color: '#8888aa', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>{page.bio}</p>}
                </div>

                {/* Link items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {page.items.map(item => (
                        <a key={item.id} href={item.url} target="_blank" rel="noreferrer"
                            onClick={() => {
                                fetch(`${API_BASE}/l/${page.slug}/click`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ itemId: item.id }),
                                }).catch(() => { });
                            }}
                            style={{
                                display: 'block',
                                padding: '1rem 1.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 12,
                                color: '#f0f0ff',
                                textDecoration: 'none',
                                textAlign: 'center',
                                fontWeight: 500,
                                fontSize: '0.95rem',
                                transition: 'all 0.15s',
                                backdropFilter: 'blur(10px)',
                            }}
                            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,92,252,0.4)'; }}
                            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>

                {/* Powered by footer */}
                <p style={{ textAlign: 'center', marginTop: '2.5rem', color: '#444466', fontSize: '0.75rem' }}>
                    Powered by <strong style={{ color: '#7c5cfc' }}>1Place2Post</strong>
                </p>
            </div>
        </div>
    );
}
