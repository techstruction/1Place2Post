'use client';
import { useState } from 'react';
import InstagramModal from './platform-modals/InstagramModal';
import FacebookModal from './platform-modals/FacebookModal';
import TwitterModal from './platform-modals/TwitterModal';
import YoutubeModal from './platform-modals/YoutubeModal';
import ThreadsModal from './platform-modals/ThreadsModal';
import TelegramModal from './platform-modals/TelegramModal';
import TikTokModal from './platform-modals/TikTokModal';

export type PlatformDef = {
    id: string;
    label: string;
    icon: string;
    color: string;
    implemented: boolean;
};

const PLATFORMS: PlatformDef[] = [
    { id: 'INSTAGRAM',  label: 'Instagram',   icon: '📸', color: '#E1306C', implemented: true },
    { id: 'FACEBOOK',   label: 'Facebook',    icon: '👥', color: '#1877F2', implemented: true },
    { id: 'TWITTER',    label: 'Twitter / X', icon: '✕',  color: '#000000', implemented: true },
    { id: 'YOUTUBE',    label: 'YouTube',     icon: '▶',  color: '#FF0000', implemented: true },
    { id: 'THREADS',    label: 'Threads',     icon: '@',  color: '#000000', implemented: true },
    { id: 'TELEGRAM',   label: 'Telegram',    icon: '✈',  color: '#2CA5E0', implemented: true },
    { id: 'TIKTOK',     label: 'TikTok',      icon: '♪',  color: '#010101', implemented: true },
    { id: 'LINKEDIN',   label: 'LinkedIn',    icon: 'in', color: '#0A66C2', implemented: false },
    { id: 'PINTEREST',  label: 'Pinterest',   icon: '𝙿',  color: '#E60023', implemented: false },
    { id: 'BLUESKY',    label: 'Bluesky',     icon: '🦋', color: '#0085FF', implemented: false },
    { id: 'MASTODON',   label: 'Mastodon',    icon: '🐘', color: '#6364FF', implemented: false },
    { id: 'SNAPCHAT',   label: 'Snapchat',    icon: '👻', color: '#FFFC00', implemented: false },
];

type Props = {
    workspaceId: string;
    onConnected?: (platform: string) => void;
};

export default function PlatformGrid({ workspaceId, onConnected }: Props) {
    const [openModal, setOpenModal] = useState<string | null>(null);

    function handleClick(platform: PlatformDef) {
        if (!platform.implemented) return;
        setOpenModal(platform.id);
    }

    function handleClose(connected?: boolean) {
        if (connected && openModal) onConnected?.(openModal);
        setOpenModal(null);
    }

    return (
        <>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '1rem',
            }}>
                {PLATFORMS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handleClick(p)}
                        disabled={!p.implemented}
                        style={{
                            position: 'relative',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '0.75rem', padding: '1.5rem 1rem',
                            border: '1.5px solid var(--border-default)', borderRadius: 12,
                            background: 'var(--bg-card)', cursor: p.implemented ? 'pointer' : 'default',
                            transition: 'border-color 0.15s, box-shadow 0.15s',
                            opacity: p.implemented ? 1 : 0.5,
                        }}
                        onMouseEnter={e => { if (p.implemented) (e.currentTarget as HTMLElement).style.borderColor = p.color; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
                    >
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.25rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                            {p.icon}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</span>
                        {!p.implemented && (
                            <span style={{
                                position: 'absolute', top: 8, right: 8,
                                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
                                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                                borderRadius: 4, padding: '2px 5px', color: 'var(--text-muted)',
                            }}>
                                SOON
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {openModal === 'INSTAGRAM' && <InstagramModal workspaceId={workspaceId} onClose={handleClose} />}
            {openModal === 'FACEBOOK'  && <FacebookModal  workspaceId={workspaceId} onClose={handleClose} />}
            {openModal === 'TWITTER'   && <TwitterModal   workspaceId={workspaceId} onClose={handleClose} />}
            {openModal === 'YOUTUBE'   && <YoutubeModal   workspaceId={workspaceId} onClose={handleClose} />}
            {openModal === 'THREADS'   && <ThreadsModal   workspaceId={workspaceId} onClose={handleClose} />}
            {openModal === 'TELEGRAM'  && <TelegramModal  workspaceId={workspaceId} onClose={handleClose} />}
            {openModal === 'TIKTOK'    && <TikTokModal    workspaceId={workspaceId} onClose={handleClose} />}
        </>
    );
}
