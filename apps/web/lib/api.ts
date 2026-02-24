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
