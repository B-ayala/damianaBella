/**
 * Helper para obtener el access token actual (en memoria, ver `authTokenStore`).
 * Lo usan integraciones que necesitan el Bearer explícito fuera de apiFetch
 * (ej. subida directa a Cloudinary firmada por el backend).
 */

import { getAccessToken } from '../services/authTokenStore';

export const getAuthToken = async (): Promise<string> => {
  const token = getAccessToken();
  if (!token) throw new Error('Token no disponible');
  return token;
};
