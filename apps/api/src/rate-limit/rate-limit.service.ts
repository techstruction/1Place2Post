import { Injectable } from '@nestjs/common';

const DAILY_POST_LIMITS: Record<string, number> = {
  INSTAGRAM: 25,
  TIKTOK: 10,
  LINKEDIN: 150,
};

const MIN_SPACING_SECONDS: Record<string, number> = {
  INSTAGRAM: 120,
  TIKTOK: 300,
  LINKEDIN: 60,
  TWITTER: 30,
  DEFAULT: 60,
};

@Injectable()
export class RateLimitService {
  static withinDailyLimit(platform: string, currentCount: number): boolean {
    const limit = DAILY_POST_LIMITS[platform];
    if (!limit) return true;
    return currentCount < limit;
  }

  static computeStaggeredTimes(baseTime: Date, count: number, platform: string): Date[] {
    if (count === 1) return [new Date(baseTime)];
    const spacingMs = (MIN_SPACING_SECONDS[platform] ?? MIN_SPACING_SECONDS.DEFAULT) * 1000;
    return Array.from({ length: count }, (_, i) => new Date(baseTime.getTime() + i * spacingMs));
  }
}
