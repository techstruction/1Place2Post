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
  tokenExpiresAt: string | null;
}): { status: HealthStatus; tooltip: string } {
  if (!account.isActive) {
    return { status: 'disconnected', tooltip: 'Account disconnected — reconnect' };
  }
  if (account.tokenExpiresAt) {
    const daysLeft = Math.floor(
      (new Date(account.tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) {
      return { status: 'disconnected', tooltip: 'Token expired — reconnect' };
    }
    if (daysLeft < 7) {
      return { status: 'expiring', tooltip: `Token expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — reconnect` };
    }
  }
  return { status: 'healthy', tooltip: 'Connected' };
}
