type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

const styles: Record<PostStatus, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: 'rgba(136, 136, 170, 0.15)', color: 'var(--text-secondary)', label: 'Draft' },
  SCHEDULED: { bg: 'rgba(255, 170, 0, 0.15)', color: 'var(--warning)', label: 'Scheduled' },
  PUBLISHED: { bg: 'rgba(0, 214, 143, 0.15)', color: 'var(--success)', label: 'Published' },
  FAILED: { bg: 'rgba(255, 77, 109, 0.15)', color: 'var(--danger)', label: 'Failed' },
};

export function PostStatusBadge({ status }: { status: string }) {
  const s = styles[status as PostStatus] ?? styles.DRAFT;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.02em',
      backgroundColor: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}
