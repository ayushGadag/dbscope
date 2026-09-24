/**
 * DBScope Centralized HTTP Client.
 * Handles communication with the DBScope FastAPI backend with graceful fallback.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isBackendOffline?: boolean;
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
