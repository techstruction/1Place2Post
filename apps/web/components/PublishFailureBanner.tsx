'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';

export function PublishFailureBanner() {
  const [failedCount, setFailedCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('1p2p_token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api'}/publish-jobs?status=FAILED&acknowledged=false`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then((jobs: unknown[]) => setFailedCount(jobs.length))
      .catch(() => {});
  }, []);

  if (dismissed || failedCount === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 20px',
      backgroundColor: 'rgba(255, 77, 109, 0.12)',
      borderBottom: '1px solid var(--danger)',
      color: 'var(--danger)',
      fontSize: 13,
      fontWeight: 500,
    }}>
      <AlertTriangle size={16} />
      <span>
        {failedCount} post{failedCount !== 1 ? 's' : ''} failed to publish —{' '}
        <Link href="/dashboard/jobs?filter=failed" style={{ color: 'var(--danger)', textDecoration: 'underline' }}>
          View details
        </Link>
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
