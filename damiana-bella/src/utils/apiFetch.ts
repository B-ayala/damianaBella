/**
 * Wrapper de fetch que agrega el header requerido por ngrok para evitar
 * la página de advertencia del browser en tunnels gratuitos.
 * Si la URL de ngrok falla con error de red, reintenta automáticamente
 * contra http://localhost:3000/api.
 */
const LOCALHOST_API = 'http://localhost:3000/api';
const configuredBase: string = import.meta.env.VITE_API_URL_LOCAL ?? LOCALHOST_API;

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);

  const rawUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  const targetHost = new URL(rawUrl, window.location.origin).hostname;
  const isNgrokHost = targetHost.endsWith('.ngrok-free.app') || targetHost.endsWith('.ngrok-free.dev');

  if (isNgrokHost) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }

  try {
    return await fetch(input, { ...init, headers });
  } catch (err) {
    // Error de red (ngrok caído) — reintentar con localhost
    if (isNgrokHost && rawUrl.startsWith(configuredBase)) {
      const fallbackUrl = LOCALHOST_API + rawUrl.slice(configuredBase.length);
      return fetch(fallbackUrl, { ...init });
    }
    throw err;
  }
};
