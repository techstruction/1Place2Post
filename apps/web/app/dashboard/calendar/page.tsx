'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '../../../lib/api';

type Post = { id: string; caption: string; status: string; scheduledAt: string | null; };

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
    const router = useRouter();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        postsApi.list()
            .then(setPosts)
            .catch(() => router.push('/login'));
    }, [router]);

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    function getPostsForDay(day: number): Post[] {
        return posts.filter(p => {
            if (!p.scheduledAt) return false;
            const d = new Date(p.scheduledAt);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });
    }

    function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
    function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Calendar</h1>
                <Link href="/dashboard/posts/new" className="btn btn-primary" id="cal-new-post-btn">+ New Post</Link>
            </div>

            <div className="card">
                {/* Month navigator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem' }}>‹</button>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{MONTHS[month]} {year}</span>
                    <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem' }}>›</button>
                </div>

                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                    {DAYS.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, padding: '0.25rem' }}>{d}</div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {/* Empty cells before first day */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} style={{ minHeight: 72 }} />
                    ))}
                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayPosts = getPostsForDay(day);
                        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                        return (
                            <div key={day} style={{
                                minHeight: 72, padding: '0.35rem', borderRadius: 8,
                                background: isToday ? 'var(--accent-muted)' : 'var(--bg-input)',
                                border: `1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}`,
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent-hover)' : 'var(--text-muted)', marginBottom: '0.25rem' }}>{day}</div>
                                {dayPosts.map(p => (
                                    <Link key={p.id} href={`/dashboard/posts/${p.id}`}
                                        style={{ display: 'block', fontSize: '0.7rem', background: 'var(--accent-muted)', color: 'var(--accent-hover)', borderRadius: 4, padding: '2px 4px', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                        {p.caption.slice(0, 24)}
                                    </Link>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
