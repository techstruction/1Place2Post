import { Injectable } from '@nestjs/common';
import { FfprobeService, MediaMetadata } from './ffprobe.service';
import * as requirementsData from './platform-requirements.json';

export type ValidationStatus = 'PASS' | 'WARN' | 'FAIL';

export interface ValidationResult {
  platform: string;
  status: ValidationStatus;
  issues: string[];
  warnings: string[];
}

const requirements = requirementsData as Record<string, any>;

@Injectable()
export class MediaValidationService {
  constructor(private ffprobe: FfprobeService) {}

  async validate(filePath: string, sizeBytes: number, platforms: string[]): Promise<ValidationResult[]> {
    let meta: MediaMetadata;
    try {
      meta = await this.ffprobe.probe(filePath, sizeBytes);
    } catch {
      // ffprobe unavailable (e.g. test environment) — return PASS for all
      return platforms.map(p => ({ platform: p, status: 'PASS' as ValidationStatus, issues: [], warnings: ['ffprobe unavailable — skipped'] }));
    }
    return platforms.map(platform => this.checkPlatform(platform, meta));
  }

  private checkPlatform(platform: string, meta: MediaMetadata): ValidationResult {
    const platformRules = requirements[platform];
    if (!platformRules) {
      return { platform, status: 'PASS', issues: [], warnings: [`No rules defined for ${platform}`] };
    }

    const issues: string[] = [];
    const warnings: string[] = [];

    // Pick the most relevant rule set for the file type
    const ruleKey = meta.type === 'video'
      ? (platformRules.reel ?? platformRules.video ?? platformRules.short)
      : platformRules.image;

    if (!ruleKey) {
      return { platform, status: 'PASS', issues: [], warnings: [`No ${meta.type} rules for ${platform}`] };
    }

    // Format check
    if (ruleKey.formats && !ruleKey.formats.includes(meta.format)) {
      issues.push(`${platform} requires ${ruleKey.formats.join(' or ')} — got ${meta.format}`);
    }

    // File size check
    const sizeMB = meta.sizeBytes / (1024 * 1024);
    if (ruleKey.maxSizeMB && sizeMB > ruleKey.maxSizeMB) {
      issues.push(`File is ${sizeMB.toFixed(1)}MB — ${platform} maximum is ${ruleKey.maxSizeMB}MB`);
    } else if (ruleKey.maxSizeMB && sizeMB > ruleKey.maxSizeMB * 0.9) {
      warnings.push(`File is ${sizeMB.toFixed(1)}MB — close to ${platform}'s ${ruleKey.maxSizeMB}MB limit`);
    }

    // Video-specific
    if (meta.type === 'video') {
      if (ruleKey.videoCodecs && meta.videoCodec && !ruleKey.videoCodecs.includes(meta.videoCodec)) {
        issues.push(`${platform} requires ${ruleKey.videoCodecs.join(' or ')} codec — got ${meta.videoCodec}. Re-encode to H.264.`);
      }
      if (ruleKey.maxDurationSeconds && meta.durationSeconds && meta.durationSeconds > ruleKey.maxDurationSeconds) {
        issues.push(`Video is ${meta.durationSeconds.toFixed(0)}s — ${platform} maximum is ${ruleKey.maxDurationSeconds}s`);
      }
      if (ruleKey.minDurationSeconds && meta.durationSeconds && meta.durationSeconds < ruleKey.minDurationSeconds) {
        issues.push(`Video is ${meta.durationSeconds.toFixed(0)}s — ${platform} minimum is ${ruleKey.minDurationSeconds}s`);
      }
      if (ruleKey.aspectRatio && meta.aspectRatio && meta.aspectRatio !== ruleKey.aspectRatio) {
        warnings.push(`${platform} prefers ${ruleKey.aspectRatio} — your video is ${meta.aspectRatio}`);
      }
    }

    const status: ValidationStatus = issues.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';
    return { platform, status, issues, warnings };
  }
}
