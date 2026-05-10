/**
 * Wrapper de fetch con interceptor de auth.
 *
 * Comportamiento:
 *  - Adjunta automáticamente el access token (Bearer) si existe.
 *  - Si la respuesta es 401 con código TOKEN_EXPIRED, llama a /auth/refresh,
 *    guarda los nuevos tokens y reintenta la request original (1 sola vez).
 *  - Si /refresh falla, limpia sesión y notifica vía evento `auth:logout`.
 *  - Cola de refresh: si llegan N requests con token expirado en paralelo,
 *    todas esperan al mismo /refresh en lugar de dispararlo N veces.
 *  - Mantiene el header `ngrok-skip-browser-warning` para túneles de ngrok.
 */

import { tokenStorage } from './tokenStorage';

const LOCALHOST_API = 'http://localhost:3000/api';
const configuredBase: string = import.meta.env.VITE_API_URL_LOCAL ?? LOCALHOST_API;

export const AUTH_LOGOUT_EVENT = 'auth:logout';

export const authHeaders = (token: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

const dispatchLogout = (reason: string) => {
  tokenStorage.clear();
  try {
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT, { detail: { reason } }));
  } catch { /* noop */ }
};

// ─── Cola de refresh (evita refresh múltiples concurrentes) ───
let refreshInflight: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${configuredBase}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      dispatchLogout('refresh_failed');
      return null;
    }

    const data = await res.json().catch(() => null);
    if (!data?.accessToken || !data?.refreshToken) {
      dispatchLogout('refresh_invalid_response');
      return null;
    }

    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    if (data.data) tokenStorage.setUser(data.data);
    return data.accessToken;
  } catch {
    // Error de red durante refresh: no limpiamos sesión, dejamos que reintente más tarde
    return null;
  }
};

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshInflight) {
    refreshInflight = performRefresh().finally(() => {
      refreshInflight = null;
    });
  }
  return refreshInflight;
};

// ─── apiFetch principal ───

interface ApiFetchOptions extends RequestInit {
  /** Si true, no agrega Authorization (útil para login/register/refresh públicos). */
  skipAuth?: boolean;
}

const buildHeaders = (init: ApiFetchOptions | undefined, token: string | null, targetHost: string): Headers => {
  const headers = new Headers(init?.headers);
  const isNgrokHost = targetHost.endsWith('.ngrok-free.app') || targetHost.endsWith('.ngrok-free.dev');
  if (isNgrokHost) headers.set('ngrok-skip-browser-warning', 'true');

  if (!init?.skipAuth && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

const isAuthError = (data: unknown): { expired: boolean; invalid: boolean } => {
  if (!data || typeof data !== 'object') return { expired: false, invalid: false };
  const code = (data as { code?: string }).code;
  return {
    expired: code === 'TOKEN_EXPIRED',
    invalid: code === 'TOKEN_INVALID' || code === 'USER_NOT_FOUND' || code === 'AUTH_ERROR',
  };
};

export const apiFetch = async (input: RequestInfo | URL, init?: ApiFetchOptions): Promise<Response> => {
  const rawUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  const targetHost = new URL(rawUrl, window.location.origin).hostname;
  const isNgrokHost = targetHost.endsWith('.ngrok-free.app') || targetHost.endsWith('.ngrok-free.dev');

  const doFetch = async (token: string | null): Promise<Response> => {
    const headers = buildHeaders(init, token, targetHost);
    return fetch(input, { ...init, headers });
  };

  let accessToken = init?.skipAuth ? null : tokenStorage.getAccessToken();

  let response: Response;
  try {
    response = await doFetch(accessToken);
  } catch (err) {
    // Error de red — fallback a localhost si era ngrok
    if (isNgrokHost && rawUrl.startsWith(configuredBase)) {
      const fallbackUrl = LOCALHOST_API + rawUrl.slice(configuredBase.length);
      response = await fetch(fallbackUrl, {
        ...init,
        headers: buildHeaders(init, accessToken, new URL(fallbackUrl).hostname),
      });
    } else {
      throw err;
    }
  }

  // Si el endpoint es auth público o no devolvió 401, devolver tal cual
  if (init?.skipAuth || response.status !== 401) {
    return response;
  }

  // Inspeccionar el body sin consumirlo (clonamos)
  let bodyClone: unknown = null;
  try {
    bodyClone = await response.clone().json();
  } catch { /* not JSON */ }

  const auth = isAuthError(bodyClone);

  if (auth.invalid) {
    dispatchLogout('token_invalid');
    return response;
  }

  if (!auth.expired) {
    return response;
  }

  // Token expirado: refrescar (con cola) y reintentar 1 vez
  const newToken = await refreshAccessToken();
  if (!newToken) return response;

  // Reintentar
  return doFetch(newToken);
};
