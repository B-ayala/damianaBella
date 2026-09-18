import { supabase } from '../config/supabaseClient';
import { apiFetch } from '../utils/apiFetch';
import { getAccessToken, setAccessToken, clearAccessToken } from './authTokenStore';

const API_BASE_URL = import.meta.env.VITE_API_URL_LOCAL;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionResponse {
  success: boolean;
  message?: string;
  data?: { user: SessionUser; accessToken: string; expiresIn: number };
}

/**
 * Refleja el access token vigente en supabase-js para que las queries
 * directas (perfil, productos, despachos, etc.) sigan funcionando. El
 * refresh token que se le pasa es un placeholder: nunca se usa de verdad
 * porque `autoRefreshToken` está apagado (ver supabaseClient.ts) — la
 * renovación real la hace `refreshSession()` contra el backend, con el
 * refresh token real que solo existe en la cookie httpOnly.
 */
const syncSupabaseSession = async (accessToken: string): Promise<void> => {
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: 'managed-by-backend',
  });
  if (error) {
    console.error('No se pudo sincronizar la sesión con Supabase:', error.message);
  }
};

const applySession = async (data: { user: SessionUser; accessToken: string; expiresIn: number }): Promise<void> => {
  setAccessToken(data.accessToken, data.expiresIn, () => {
    void refreshSession();
  });
  await syncSupabaseSession(data.accessToken);
};

/**
 * Login: credenciales van al backend (nunca a Supabase directo desde acá). El
 * backend deja el refresh token en una cookie httpOnly y devuelve el access
 * token en el body, que queda solo en memoria.
 */
export const login = async (email: string, password: string): Promise<SessionUser> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const result: SessionResponse = await response.json().catch(() => ({ success: false }));

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || 'Credenciales inválidas');
  }

  await applySession(result.data);
  return result.data.user;
};

/**
 * Intenta recuperar la sesión usando la cookie httpOnly (recarga de página,
 * arranque de la app). Silencioso: si no hay sesión (no logueado, cookie
 * vencida/revocada), devuelve `null` sin lanzar.
 */
export const restoreSession = async (): Promise<SessionUser | null> => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' });
    if (!response.ok) return null;

    const result: SessionResponse = await response.json().catch(() => ({ success: false }));
    if (!result.success || !result.data) return null;

    await applySession(result.data);
    return result.data.user;
  } catch {
    return null;
  }
};

/** Renovación proactiva disparada por el timer de `authTokenStore`. */
const refreshSession = async (): Promise<void> => {
  const user = await restoreSession();
  if (!user) {
    // El refresh falló (cookie vencida/revocada en el servidor): cerrar
    // sesión localmente para no dejar la UI mostrando un usuario "logueado"
    // con un token que ya no sirve.
    clearAccessToken();
    await supabase.auth.signOut();
  }
};

export const logout = async (): Promise<void> => {
  const accessToken = getAccessToken();
  clearAccessToken();
  await supabase.auth.signOut();

  await apiFetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  }).catch(() => undefined);
};

export { getAccessToken };
