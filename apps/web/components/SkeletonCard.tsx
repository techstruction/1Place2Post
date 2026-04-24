export function SkeletonCard() {
  return (
    <div className="stat-card" style={{ animation: 'skeleton-pulse 1.5s ease-in-out infinite' }}>
      <div style={{
        height: 12, width: '60%', borderRadius: 6,
        backgroundColor: 'var(--bg-hover)', marginBottom: 12,
      }} />
      <div style={{
        height: 28, width: '40%', borderRadius: 6,
        backgroundColor: 'var(--bg-hover)',
      }} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr style={{ animation: 'skeleton-pulse 1.5s ease-in-out infinite' }}>
      <td><div style={{ height: 14, width: '80%', borderRadius: 4, backgroundColor: 'var(--bg-hover)' }} /></td>
      <td><div style={{ height: 20, width: 70, borderRadius: 6, backgroundColor: 'var(--bg-hover)' }} /></td>
      <td><div style={{ height: 14, width: '50%', borderRadius: 4, backgroundColor: 'var(--bg-hover)' }} /></td>
    </tr>
  );
}
