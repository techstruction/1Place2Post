type HealthStatus = 'healthy' | 'expiring' | 'disconnected';

interface AccountHealthDotProps {
  status: HealthStatus;
  tooltip?: string;
}

const colorMap: Record<HealthStatus, string> = {
  healthy: 'var(--success)',
  expiring: 'var(--warning)',
  disconnected: 'var(--danger)',
};

export function AccountHealthDot({ status, tooltip }: AccountHealthDotProps) {
  return (
    <span
      title={tooltip}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: colorMap[status],
        flexShrink: 0,
      }}
    />
  );
}

export function getAccountHealth(account: {
  isActive: boolean;
  tokenStatus?: string | null;
  tokenExpiresAt?: string | null;
}): { status: HealthStatus; tooltip: string } {
  if (!account.isActive) {
    return { status: 'disconnected', tooltip: 'Account disconnected — reconnect' };
  }
  // Use persisted tokenStatus from the cron health monitor (preferred)
  if (account.tokenStatus) {
    switch (account.tokenStatus) {
      case 'TOKEN_EXPIRED':
      case 'DISCONNECTED':
        return { status: 'disconnected', tooltip: 'Token expired — reconnect account' };
      case 'TOKEN_CRITICAL':
        return { status: 'expiring', tooltip: 'Token expires very soon — reconnect now' };
      case 'TOKEN_EXPIRING':
        return { status: 'expiring', tooltip: 'Token expires within 7 days — reconnect soon' };
      case 'ACTIVE':
      default:
        return { status: 'healthy', tooltip: 'Connected' };
    }
  }
  // Legacy fallback: compute from tokenExpiresAt if tokenStatus not present
  if (account.tokenExpiresAt) {
    const daysLeft = Math.floor(
      (new Date(account.tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) return { status: 'disconnected', tooltip: 'Token expired — reconnect' };
    if (daysLeft < 7) return { status: 'expiring', tooltip: `Token expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — reconnect` };
  }
  return { status: 'healthy', tooltip: 'Connected' };
}
