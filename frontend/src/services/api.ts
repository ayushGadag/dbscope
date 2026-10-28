/**
 * DBScope Centralized HTTP Client.
 * Handles communication with the DBScope FastAPI backend with graceful fallback.
 */

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  // In browser, relative path utilizes Vite dev server proxy seamlessly
  if (typeof window !== 'undefined') {
    return '';
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getBaseUrl();

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isBackendOffline?: boolean;
}

export interface BackendHealth {
  healthy: boolean;
  service?: string;
  version?: string;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  const res = await requestJson<{ status: string; service: string; version: string }>('/api/health');
  if (res.ok && res.data && res.data.status === 'healthy') {
    return {
      healthy: true,
      service: res.data.service,
      version: res.data.version,
    };
  }
  return { healthy: false };
}

export async function requestJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      return { ok: true, status: res.status, data };
    }

    let errorMessage = `HTTP ${res.status} error`;
    try {
      const errJson = await res.json();
      if (errJson && typeof errJson.detail === 'string') {
        errorMessage = errJson.detail;
      } else if (errJson && typeof errJson.message === 'string') {
        errorMessage = errJson.message;
      }
    } catch {
      // response was not JSON
    }

    return {
      ok: false,
      status: res.status,
      error: errorMessage,
      isBackendOffline: false,
    };
  } catch (err) {
    // Network failure (backend not running or connection refused)
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : 'Unable to connect to DBScope backend server.',
      isBackendOffline: true,
    };
  }
}
