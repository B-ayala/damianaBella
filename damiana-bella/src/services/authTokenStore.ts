// Guarda el access token SOLO en memoria de proceso (nunca en localStorage ni
// sessionStorage): se pierde a propósito al recargar la pestaña. El refresh
// token real nunca llega acá — vive en una cookie httpOnly que solo el
// backend puede leer (BACK/lia-store/controllers/authController.js).

let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

// Renovar un poco antes de que expire de verdad: da margen a la latencia de
// red y a que el timer del browser se dispare tarde (pestaña en segundo plano).
const REFRESH_MARGIN_SECONDS = 60;
const MIN_DELAY_MS = 5_000;

export const getAccessToken = (): string | null => accessToken;

const clearRefreshTimer = (): void => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

/**
 * Guarda el access token en memoria y programa su renovación automática.
 * `onExpiringSoon` es quien de verdad llama al backend — se inyecta para que
 * este módulo no dependa de `authService` (evita un ciclo de imports).
 */
export const setAccessToken = (
  token: string,
  expiresInSeconds: number,
  onExpiringSoon: () => void
): void => {
  accessToken = token;
  clearRefreshTimer();

  const delayMs = Math.max((expiresInSeconds - REFRESH_MARGIN_SECONDS) * 1000, MIN_DELAY_MS);
  refreshTimer = setTimeout(onExpiringSoon, delayMs);
};

export const clearAccessToken = (): void => {
  accessToken = null;
  clearRefreshTimer();
};
