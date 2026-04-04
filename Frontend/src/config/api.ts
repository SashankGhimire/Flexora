/**
 * Centralized API host configuration for the mobile app.
 *
 * Before demo:
 * 1) Start backend locally.
 * 2) Run Backend automation: npm run dev:tunnel (auto-starts ngrok and syncs URL here).
 * 3) Keep DEMO_MODE = true to prioritize ngrok for public/demo networks.
 *
 * Use local URL when testing on the same WiFi as your backend machine.
 */

export const DEMO_MODE = true;

// Updated automatically by Backend/scripts/sync-ngrok-url.js when tunnel is running.
export const API_URL_NGROK = 'https://nonpreventive-trieciously-tawnya.ngrok-free.dev';

// Replace with your machine LAN IP and backend port.
export const API_URL_LOCAL = 'http://100.64.225.220:5000';
export const API_URL_ANDROID_EMULATOR = 'http://10.0.2.2:5000';
export const API_URL_LOCALHOST = 'http://localhost:5000';

const API_PATH = '/api';
const PROBE_TIMEOUT_MS = 3500;

const normalizeOrigin = (url: string): string => url.replace(/\/$/, '');

const toApiBaseUrl = (origin: string): string => `${normalizeOrigin(origin)}${API_PATH}`;

const getOriginCandidates = (): string[] => {
  const preferred = DEMO_MODE
    ? [API_URL_NGROK, API_URL_LOCAL]
    : [API_URL_LOCAL, API_URL_ANDROID_EMULATOR, API_URL_LOCALHOST];

  const fallback = DEMO_MODE
    ? [API_URL_ANDROID_EMULATOR, API_URL_LOCALHOST]
    : [API_URL_NGROK];

  return [...preferred, ...fallback];
};

let resolvedApiBaseUrl: string | null = null;

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timeout')), ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const isJsonResponse = (contentType: string | null): boolean => {
  return !!contentType && contentType.toLowerCase().includes('application/json');
};

const isOriginReachable = async (origin: string): Promise<boolean> => {
  try {
    const response = await withTimeout(
      fetch(`${normalizeOrigin(origin)}/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      }),
      PROBE_TIMEOUT_MS
    );

    if (response.status >= 500) {
      return false;
    }

    const contentType = response.headers.get('content-type');
    if (!isJsonResponse(contentType)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

export const resolveApiBaseUrl = async (forceRefresh = false): Promise<string> => {
  if (resolvedApiBaseUrl && !forceRefresh) {
    return resolvedApiBaseUrl;
  }

  const candidates = getOriginCandidates();

  for (const origin of candidates) {
    if (await isOriginReachable(origin)) {
      resolvedApiBaseUrl = toApiBaseUrl(origin);
      return resolvedApiBaseUrl;
    }
  }

  // If none are reachable, keep deterministic default based on current mode.
  resolvedApiBaseUrl = toApiBaseUrl(candidates[0]);
  return resolvedApiBaseUrl;
};

export const resetResolvedApiBaseUrl = (): void => {
  resolvedApiBaseUrl = null;
};

export const API_BASE_URL = toApiBaseUrl(getOriginCandidates()[0]);

export const getApiBaseUrlSync = (): string => resolvedApiBaseUrl || API_BASE_URL;

export const getApiServerOrigin = (): string => getApiBaseUrlSync().replace(/\/api$/, '');

export const createServerNotReachableError = (cause?: unknown): Error & { cause?: unknown } => {
  const error = new Error('Server not reachable. Please check your internet connection and try again.') as Error & {
    cause?: unknown;
  };

  if (cause) {
    error.cause = cause;
  }

  return error;
};
