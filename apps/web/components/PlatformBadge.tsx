import { Camera, Share2, Share, Link, Play, Music2, Globe } from 'lucide-react';

type PlatformConfig = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  label: string;
};

const PLATFORMS: Record<string, PlatformConfig> = {
  INSTAGRAM: { icon: Camera, color: '#E1306C', label: 'Instagram' },
  FACEBOOK: { icon: Share2, color: '#1877F2', label: 'Facebook' },
  TWITTER: { icon: Share, color: '#1DA1F2', label: 'Twitter/X' },
  LINKEDIN: { icon: Link, color: '#0A66C2', label: 'LinkedIn' },
  YOUTUBE: { icon: Play, color: '#FF0000', label: 'YouTube' },
  TIKTOK: { icon: Music2, color: '#ff0050', label: 'TikTok' },
};

export function PlatformBadge({ platform }: { platform: string }) {
  const p: PlatformConfig = PLATFORMS[platform?.toUpperCase()] ?? { icon: Globe, color: 'var(--text-secondary)', label: platform };
  const Icon = p.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: p.color }} title={p.label}>
      <Icon size={14} color={p.color} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.label}</span>
    </span>
  );
}
