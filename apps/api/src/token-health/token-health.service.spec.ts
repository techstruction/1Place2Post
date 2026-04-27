import { TokenHealthService } from './token-health.service';

describe('TokenHealthService.computeStatus', () => {
  const now = new Date('2026-04-27T12:00:00Z');

  it('returns ACTIVE when expiry is > 7 days away', () => {
    const expiry = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    expect(TokenHealthService.computeStatus(expiry, now)).toBe('ACTIVE');
  });

  it('returns TOKEN_EXPIRING when expiry is 4-7 days away', () => {
    const expiry = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    expect(TokenHealthService.computeStatus(expiry, now)).toBe('TOKEN_EXPIRING');
  });

  it('returns TOKEN_CRITICAL when expiry is < 3 days away', () => {
    const expiry = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    expect(TokenHealthService.computeStatus(expiry, now)).toBe('TOKEN_CRITICAL');
  });

  it('returns TOKEN_EXPIRED when expiry has passed', () => {
    const expiry = new Date(now.getTime() - 1000);
    expect(TokenHealthService.computeStatus(expiry, now)).toBe('TOKEN_EXPIRED');
  });

  it('returns ACTIVE when tokenExpiry is null (non-expiring token)', () => {
    expect(TokenHealthService.computeStatus(null, now)).toBe('ACTIVE');
  });
});
