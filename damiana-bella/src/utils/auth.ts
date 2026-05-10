/**
 * Helper para obtener el access token actual desde localStorage.
 * El refresh automático lo maneja `apiFetch` cuando una request devuelve 401 expirado.
 *
 * Si necesitás usar el token fuera de apiFetch (ej. en un script externo, Cloudinary direct upload),
 * este helper lo expone — pero en general usá apiFetch que ya lo adjunta.
 */

import { tokenStorage } from './tokenStorage';

export const getAuthToken = async (): Promise<string> => {
  const token = tokenStorage.getAccessToken();
  if (!token) throw new Error('Token no disponible');
  return token;
};
