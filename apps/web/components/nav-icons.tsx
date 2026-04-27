const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="20"
    height="20"
  >
    {children}
  </svg>
);

export const OverviewIcon = () => (
  <Svg>
    <rect x="3" y="3" width="6" height="8" rx="1.5"/>
    <rect x="15" y="3" width="6" height="5" rx="1.5"/>
    <rect x="3" y="14" width="6" height="7" rx="1.5"/>
    <rect x="15" y="11" width="6" height="10" rx="1.5"/>
  </Svg>
);

export const PostsIcon = () => (
  <Svg>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/>
    <path d="M8 13h8M8 17h5"/>
  </Svg>
);

export const CalendarIcon = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="17" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
  </Svg>
);

export const MediaIcon = () => (
  <Svg>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-5-5L5 21"/>
  </Svg>
);

export const TemplatesIcon = () => (
  <Svg>
    <path d="M2 8.5 12 3l10 5.5-10 5.5z"/>
    <path d="M2 13l10 5.5L22 13"/>
    <path d="M2 17.5l10 5.5L22 17.5"/>
  </Svg>
);

export const AIStudioIcon = () => (
  <Svg>
    <circle cx="12" cy="5" r="2"/>
    <circle cx="5" cy="19" r="2"/>
    <circle cx="19" cy="19" r="2"/>
    <circle cx="12" cy="12" r="2.5"/>
    <path d="M12 7v2.5M10.04 13.74 7 17M13.96 13.74 17 17"/>
  </Svg>
);

export const AnalyticsIcon = () => (
  <Svg>
    <path d="M3 3v18h18"/>
    <path d="m7 16 4-5 4 3 4-7"/>
    <circle cx="7" cy="16" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="11" cy="11" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="19" cy="7" r="1.5" fill="currentColor" stroke="none"/>
  </Svg>
);

export const PublishQueueIcon = () => (
  <Svg>
    <path d="M22 2 11 13"/>
    <path d="m22 2-7 20-4-9-9-4 20-7z"/>
  </Svg>
);

export const InboxIcon = () => (
  <Svg>
    <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </Svg>
);

export const LeadsIcon = () => (
  <Svg>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>
  </Svg>
);

export const NotificationsIcon = () => (
  <Svg>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </Svg>
);

export const ApprovalsIcon = () => (
  <Svg>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </Svg>
);

export const RSSIcon = () => (
  <Svg>
    <path d="M4 11a9 9 0 0 1 9 9"/>
    <path d="M4 4a16 16 0 0 1 16 16"/>
    <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none"/>
  </Svg>
);

export const WebhooksIcon = () => (
  <Svg>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </Svg>
);

export const ConnectionsIcon = () => (
  <Svg>
    <path d="M8 2v4M16 2v4"/>
    <rect x="5" y="6" width="14" height="7" rx="1"/>
    <path d="M8 13v3a4 4 0 0 0 8 0v-3"/>
  </Svg>
);

export const LinkPagesIcon = () => (
  <Svg>
    <path d="M15 3h6v6"/>
    <path d="M10 14 21 3"/>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </Svg>
);

export const BotRulesIcon = () => (
  <Svg>
    <rect x="7" y="8" width="10" height="11" rx="2"/>
    <path d="M12 2v6M10 2h4"/>
    <path d="M9.5 13h.01M14.5 13h.01"/>
    <path d="M10 17h4"/>
    <path d="M3 12h4M17 12h4"/>
  </Svg>
);

export const TeamIcon = () => (
  <Svg>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>
);

export const SubscriptionIcon = () => (
  <Svg>
    <path d="M2.5 9.5 6 4h12l3.5 5.5-9.5 11z"/>
    <path d="M6 4 9 9.5M18 4l-3 5.5"/>
    <path d="M2.5 9.5h19"/>
  </Svg>
);

export const SupportIcon = () => (
  <Svg>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </Svg>
);

export const DocsIcon = () => (
  <Svg>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </Svg>
);

export const AdminIcon = () => (
  <Svg>
    <path d="M12 2 4.5 6.5v5C4.5 16 7.8 20 12 22c4.2-2 7.5-6 7.5-10.5v-5z"/>
    <path d="m9 12 2 2 4-4"/>
  </Svg>
);
