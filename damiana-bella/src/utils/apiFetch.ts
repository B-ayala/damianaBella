/**
 * Wrapper de fetch que agrega el header requerido por ngrok para evitar
 * la página de advertencia del browser en tunnels gratuitos.
 */
export const apiFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  headers.set('ngrok-skip-browser-warning', 'true');
  return fetch(input, { ...init, headers });
};
