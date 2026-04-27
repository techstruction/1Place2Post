import { RateLimitService } from './rate-limit.service';

describe('RateLimitService.withinDailyLimit', () => {
  it('returns true when post count is below Instagram limit', () => {
    expect(RateLimitService.withinDailyLimit('INSTAGRAM', 10)).toBe(true);
  });

  it('returns false when post count is at Instagram limit of 25', () => {
    expect(RateLimitService.withinDailyLimit('INSTAGRAM', 25)).toBe(false);
  });

  it('returns false when post count exceeds Instagram limit', () => {
    expect(RateLimitService.withinDailyLimit('INSTAGRAM', 30)).toBe(false);
  });

  it('returns true for platforms with no defined limit', () => {
    expect(RateLimitService.withinDailyLimit('FACEBOOK', 200)).toBe(true);
  });

  it('returns true for TWITTER below threshold', () => {
    expect(RateLimitService.withinDailyLimit('TWITTER', 50)).toBe(true);
  });
});

describe('RateLimitService.computeStaggeredTimes', () => {
  const baseTime = new Date('2026-04-28T09:00:00Z');

  it('returns single time unchanged for count of 1', () => {
    const times = RateLimitService.computeStaggeredTimes(baseTime, 1, 'INSTAGRAM');
    expect(times).toHaveLength(1);
    expect(times[0]).toEqual(baseTime);
  });

  it('adds minimum 2-minute spacing for Instagram', () => {
    const times = RateLimitService.computeStaggeredTimes(baseTime, 3, 'INSTAGRAM');
    expect(times).toHaveLength(3);
    expect(times[1].getTime() - times[0].getTime()).toBeGreaterThanOrEqual(2 * 60 * 1000);
    expect(times[2].getTime() - times[1].getTime()).toBeGreaterThanOrEqual(2 * 60 * 1000);
  });

  it('adds minimum 5-minute spacing for TikTok', () => {
    const times = RateLimitService.computeStaggeredTimes(baseTime, 2, 'TIKTOK');
    expect(times[1].getTime() - times[0].getTime()).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });

  it('returns times in ascending order', () => {
    const times = RateLimitService.computeStaggeredTimes(baseTime, 5, 'INSTAGRAM');
    for (let i = 1; i < times.length; i++) {
      expect(times[i].getTime()).toBeGreaterThan(times[i - 1].getTime());
    }
  });
});
