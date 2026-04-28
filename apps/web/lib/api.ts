const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('1p2p_token');
}

export function setToken(token: string) {
    localStorage.setItem('1p2p_token', token);
}

export function clearToken() {
    localStorage.removeItem('1p2p_token');
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || 'Request failed');
    }

    return res.json();
}

// Auth
export const authApi = {
    register: (email: string, password: string, name?: string) =>
        apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    login: (email: string, password: string) =>
        apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};

// Posts
export const postsApi = {
    list: () => apiFetch('/posts'),
    get: (id: string) => apiFetch(`/posts/${id}`),
    create: (data: object) =>
        apiFetch('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) =>
        apiFetch(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
        apiFetch(`/posts/${id}`, { method: 'DELETE' }),
};

// Support
export const supportApi = {
    list: () => apiFetch('/support'),
    get: (id: string) => apiFetch(`/support/${id}`),
    create: (data: { subject: string; message: string }) => apiFetch('/support', { method: 'POST', body: JSON.stringify(data) }),
    reply: (id: string, data: { message: string }) => apiFetch(`/support/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
    close: (id: string) => apiFetch(`/support/${id}/close`, { method: 'PATCH' }),
};

// ── Inbox & Leads ────────────────────────────────────────────────────────
export const inboxApi = {
    list: () => apiFetch('/inbox'),
    getUnreadCount: () => apiFetch('/inbox/unread-count'),
    markRead: (id: string) => apiFetch(`/inbox/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => apiFetch('/inbox/read-all', { method: 'PATCH' }),
};

export const leadsApi = {
    list: () => apiFetch('/leads'),
    updateStatus: (id: string, status: string) => apiFetch(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// Social Accounts
export const socialApi = {
    list: () => apiFetch('/social-accounts'),
    create: (data: object) => apiFetch('/social-accounts', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/social-accounts/${id}`, { method: 'DELETE' }),
    listForWorkspace: (workspaceId: string) =>
        apiFetch(`/social-accounts/workspace/${workspaceId}`),
};

// Series
export const seriesApi = {
    list: () => apiFetch('/series'),
    create: (data: object) => apiFetch('/series', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/series/${id}`, { method: 'DELETE' }),
};

// Link Pages
export const linkPagesApi = {
    list: () => apiFetch('/link-pages'),
    create: (data: object) => apiFetch('/link-pages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) => apiFetch(`/link-pages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/link-pages/${id}`, { method: 'DELETE' }),
    addItem: (pageId: string, data: object) => apiFetch(`/link-pages/${pageId}/items`, { method: 'POST', body: JSON.stringify(data) }),
    removeItem: (pageId: string, itemId: string) => apiFetch(`/link-pages/${pageId}/items/${itemId}`, { method: 'DELETE' }),
};

// Bot Rules
export const botRulesApi = {
    list: () => apiFetch('/bot-rules'),
    create: (data: object) => apiFetch('/bot-rules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) => apiFetch(`/bot-rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/bot-rules/${id}`, { method: 'DELETE' }),
};

// ── Workspace ─────────────────────────────────────────────────────────────

export type WorkspaceWithRole = {
  id: string; name: string; slug: string; industry: string | null;
  ownerId: string; myRole: string;
  _count: { socialAccounts: number; members: number };
};

export type WorkspaceDetail = WorkspaceWithRole & {
  members: Array<{ id: string; role: string; user: { id: string; name: string | null; email: string } }>;
  _count: { socialAccounts: number; posts: number; members: number };
};

export const workspaceApi = {
  list: (): Promise<WorkspaceWithRole[]> =>
    apiFetch('/workspaces/mine'),

  create: (body: { name: string; industry?: string }): Promise<WorkspaceWithRole> =>
    apiFetch('/workspaces', { method: 'POST', body: JSON.stringify(body) }),

  get: (id: string): Promise<WorkspaceDetail> =>
    apiFetch(`/workspaces/${id}`),

  invite: (workspaceId: string, body: { email: string; role?: string }) =>
    apiFetch(`/workspaces/${workspaceId}/members`, { method: 'POST', body: JSON.stringify(body) }),

  updateRole: (workspaceId: string, userId: string, role: string) =>
    apiFetch(`/workspaces/${workspaceId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  removeMember: (workspaceId: string, userId: string) =>
    apiFetch(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' }),

  socialAccounts: (workspaceId: string) =>
    apiFetch(`/social-accounts/workspace/${workspaceId}`),
};

export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('1p2p_activeWorkspace');
}

export function setActiveWorkspaceId(id: string) {
  if (typeof window !== 'undefined') localStorage.setItem('1p2p_activeWorkspace', id);
}

