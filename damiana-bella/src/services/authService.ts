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
  code?: string;
  data?: { user: SessionUser; accessToken: string; expiresIn: number };
}

interface ApiResponse {
  success: boolean;
  message?: string;
  code?: string;
  autoConfirmed?: boolean;
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

const parseError = async (response: Response): Promise<never> => {
  const result: ApiResponse = await response.json().catch(() => ({ success: false }));
  const err = new Error(result.message || 'Error de autenticación');
  (err as Error & { code?: string }).code = result.code;
  throw err;
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

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export const register = async (payload: RegisterPayload): Promise<{ data?: SessionUser; autoConfirmed?: boolean }> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result: SessionResponse & { autoConfirmed?: boolean } = await response.json().catch(() => ({ success: false }));

  if (!response.ok || !result.success) {
    const err = new Error(result.message || 'Error al registrar');
    (err as Error & { code?: string }).code = result.code;
    throw err;
  }

  return { data: result.data?.user, autoConfirmed: result.autoConfirmed };
};

export const confirmEmail = async (token: string): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/confirm-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) await parseError(response);
};

export const resendConfirmation = async (email: string): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/resend-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) await parseError(response);
};

export const forgotPassword = async (email: string): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) await parseError(response);
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!response.ok) await parseError(response);
};

/**
 * Cambiar contraseña estando logueado: requiere identificar al usuario, así
 * que va el access token en memoria como Bearer (acá sí, porque no hay
 * cookie de sesión de usuario final — solo el refresh token la usa).
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const accessToken = getAccessToken();
  const response = await apiFetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) await parseError(response);
  // Backend revoca todos los refresh tokens: forzar re-login limpiando la sesión local.
  clearAccessToken();
  await supabase.auth.signOut();
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
