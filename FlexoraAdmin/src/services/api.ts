const DEFAULT_API_PORT = 5000;
const MAX_API_PORT = 5020;
const API_STORAGE_KEY = 'flexora-admin-token';

let cachedBaseUrl: string | null = null;

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

const getBaseCandidates = () => {
  const candidates = new Set<string>();

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    candidates.add(`${protocol}//${hostname}`);

    if (hostname !== 'localhost') {
      candidates.add(`${protocol}//localhost`);
    }

    if (hostname !== '127.0.0.1') {
      candidates.add(`${protocol}//127.0.0.1`);
    }
  } else {
    candidates.add('http://localhost');
  }

  return Array.from(candidates);
};

const pingHealth = async (baseUrl: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function resolveApiBaseUrl() {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredBaseUrl) {
    cachedBaseUrl = trimTrailingSlash(configuredBaseUrl);
    return cachedBaseUrl;
  }

  for (const host of getBaseCandidates()) {
    for (let port = DEFAULT_API_PORT; port <= MAX_API_PORT; port += 1) {
      const baseUrl = `${host}:${port}`;
      if (await pingHealth(baseUrl)) {
        cachedBaseUrl = baseUrl;
        return baseUrl;
      }
    }
  }

  throw new Error('Unable to reach the Flexora backend. Start the backend on port 5000 to 5020.');
}

export function getStoredAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(API_STORAGE_KEY) || window.sessionStorage.getItem(API_STORAGE_KEY);
}

export function storeAuthToken(token: string, remember: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(API_STORAGE_KEY);
  window.sessionStorage.removeItem(API_STORAGE_KEY);

  if (remember) {
    window.localStorage.setItem(API_STORAGE_KEY, token);
  } else {
    window.sessionStorage.setItem(API_STORAGE_KEY, token);
  }
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(API_STORAGE_KEY);
  window.sessionStorage.removeItem(API_STORAGE_KEY);
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const baseUrl = await resolveApiBaseUrl();
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
}