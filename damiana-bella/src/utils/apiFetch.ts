/**
 * Wrapper de fetch que agrega el header requerido por ngrok para evitar
 * la página de advertencia del browser en tunnels gratuitos.
 */
export const apiFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
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

  return fetch(input, { ...init, headers });
};
