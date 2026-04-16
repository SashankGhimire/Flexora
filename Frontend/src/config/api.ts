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
export const API_URL_LOCAL = 'http://192.168.1.68:5000';
export const API_URL_ANDROID_EMULATOR = 'http://10.0.2.2:5000';
export const API_URL_LOCALHOST = 'http://localhost:5000';

const API_PATH = '/api';
const HEALTH_PATH = '/api/health';
const PROBE_TIMEOUT_MS = 900;
const normalizeOrigin = (url: string): string => url.replace(/\/$/, '');

const toApiBaseUrl = (origin: string): string => `${normalizeOrigin(origin)}${API_PATH}`;

const PRIMARY_BACKEND_PORT = 5000;
const MAX_BACKEND_PORT_SCAN = 5020;
const LOCAL_PORT_CANDIDATES = Array.from(
  { length: MAX_BACKEND_PORT_SCAN - PRIMARY_BACKEND_PORT + 1 },
  (_, index) => PRIMARY_BACKEND_PORT + index
);

const buildLocalPortVariants = (origin: string): string[] => {
  try {
    const parsed = new URL(origin);

    if (!parsed.port) {
      return [origin];
    }

    const variants = LOCAL_PORT_CANDIDATES.map((port) => `${parsed.protocol}//${parsed.hostname}:${port}`);
    return Array.from(new Set([origin, ...variants]));
  } catch {
    return [origin];
  }
};

const getOriginCandidates = (): string[] => {
  if (DEMO_MODE) {
    return [API_URL_NGROK];
  }

  const localPreferred = [
    ...buildLocalPortVariants(API_URL_LOCAL),
    ...buildLocalPortVariants(API_URL_ANDROID_EMULATOR),
    ...buildLocalPortVariants(API_URL_LOCALHOST),
  ];

  const preferred = localPreferred;

  const fallback = [API_URL_NGROK];

  return Array.from(new Set([...preferred, ...fallback]));
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
      fetch(`${normalizeOrigin(origin)}${HEALTH_PATH}`, {
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

    const payload = (await response.json()) as { service?: string; status?: string };
    return payload?.service === 'flexora-backend' && payload?.status === 'ok';
  } catch {
    return false;
  }
};

export const resolveApiBaseUrl = async (forceRefresh = false): Promise<string> => {
  if (resolvedApiBaseUrl && !forceRefresh) {
    return resolvedApiBaseUrl;
  }

  const candidates = getOriginCandidates();

  const probeBatch = async (origins: string[]): Promise<string | null> => {
    if (!origins.length) {
      return null;
    }

    return new Promise<string | null>((resolve) => {
      let settled = false;
      let pending = origins.length;

      origins.forEach((origin) => {
        isOriginReachable(origin)
          .then((reachable) => {
            if (settled) {
              return;
            }

            if (reachable) {
              settled = true;
              resolve(origin);
              return;
            }

            pending -= 1;
            if (pending === 0) {
              settled = true;
              resolve(null);
            }
          })
          .catch(() => {
            pending -= 1;
            if (!settled && pending === 0) {
              settled = true;
              resolve(null);
            }
          });
      });
    });
  };

  // Keep ordering intent while reducing total wait time: probe top candidates first in parallel.
  const ngrokCandidate = candidates.find((origin) => normalizeOrigin(origin) === normalizeOrigin(API_URL_NGROK));
  const firstBatch = Array.from(new Set([...candidates.slice(0, 3), ...(ngrokCandidate ? [ngrokCandidate] : [])]));
  const secondBatch = candidates.filter((origin) => !firstBatch.includes(origin));

  const firstMatch = await probeBatch(firstBatch);
  if (firstMatch) {
    resolvedApiBaseUrl = toApiBaseUrl(firstMatch);
    return resolvedApiBaseUrl;
  }

  const secondMatch = await probeBatch(secondBatch);
  if (secondMatch) {
    resolvedApiBaseUrl = toApiBaseUrl(secondMatch);
    return resolvedApiBaseUrl;
  }

  throw createServerNotReachableError(
    new Error(`No verified Flexora backend found. Tried: ${candidates.join(', ')}`)
  );
};

export const resetResolvedApiBaseUrl = (): void => {
  resolvedApiBaseUrl = null;
};

export const API_BASE_URL = toApiBaseUrl(getOriginCandidates()[0]);

export const getApiBaseUrlSync = (): string => resolvedApiBaseUrl || API_BASE_URL;

export const getApiServerOrigin = (): string => getApiBaseUrlSync().replace(/\/api$/, '');

export const createServerNotReachableError = (cause?: unknown): Error & { cause?: unknown } => {
  const error = new Error(
    'Server not reachable. Ensure backend is running on port 5000-5020, and use ngrok (npm run ngrok) or the same WiFi network for device access.'
  ) as Error & {
    cause?: unknown;
  };

  if (cause) {
    error.cause = cause;
  }

  return error;
};
