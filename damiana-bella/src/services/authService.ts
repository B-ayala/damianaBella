/**
 * Auth service — interactúa con /api/auth (JWT propio).
 * Reemplaza el flujo de Supabase Auth.
 */

import { apiFetch } from '../utils/apiFetch';
import { tokenStorage, type StoredUser } from '../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL_LOCAL ?? 'http://localhost:3000/api';

export interface AuthUser extends StoredUser {}

interface AuthResponse {
  success: boolean;
  data?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  code?: string;
  autoConfirmed?: boolean;
}

const postJson = async (path: string, body: unknown, opts?: { skipAuth?: boolean }): Promise<AuthResponse> => {
  const res = await apiFetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    skipAuth: opts?.skipAuth,
  });
  const data: AuthResponse = await res.json().catch(() => ({ success: false, message: 'Respuesta inválida del servidor' }));
  if (!res.ok || !data.success) {
    const err = new Error(data.message || `Error ${res.status}`);
    (err as Error & { code?: string }).code = data.code;
    throw err;
  }
  return data;
};

const persistSession = (data: AuthResponse) => {
  if (data.accessToken && data.refreshToken) {
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
  }
  if (data.data) tokenStorage.setUser(data.data);
};

// ─── Register ───
export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const data = await postJson('/auth/register', payload, { skipAuth: true });
  // Si auto-confirmó (modo dev/console), también puede venir con tokens — no es el caso ahora.
  return data;
};

// ─── Login ───
export const login = async (email: string, password: string): Promise<AuthUser> => {
  const data = await postJson('/auth/login', { email, password }, { skipAuth: true });
  if (!data.data) throw new Error('Respuesta de login inválida');
  persistSession(data);
  return data.data;
};

// ─── Logout ───
export const logout = async (): Promise<void> => {
  const refreshToken = tokenStorage.getRefreshToken();
  try {
    if (refreshToken) {
      await apiFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      });
    }
  } catch {
    /* no bloqueamos el logout local */
  } finally {
    tokenStorage.clear();
  }
};

// ─── Me (perfil actual) ───
export const me = async (): Promise<AuthUser | null> => {
  const accessToken = tokenStorage.getAccessToken();
  if (!accessToken) return null;
  try {
    const res = await apiFetch(`${API_BASE_URL}/auth/me`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    if (json.data) tokenStorage.setUser(json.data);
    return json.data;
  } catch {
    return null;
  }
};

// ─── Email confirmation ───
export const confirmEmail = async (token: string): Promise<void> => {
  await postJson('/auth/confirm-email', { token }, { skipAuth: true });
};

export const resendConfirmation = async (email: string): Promise<void> => {
  await postJson('/auth/resend-confirmation', { email }, { skipAuth: true });
};

// ─── Forgot / Reset password ───
export const forgotPassword = async (email: string): Promise<void> => {
  await postJson('/auth/forgot-password', { email }, { skipAuth: true });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await postJson('/auth/reset-password', { token, newPassword }, { skipAuth: true });
};

// ─── Change password (logged-in) ───
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await postJson('/auth/change-password', { currentPassword, newPassword });
  // Backend revoca todos los refresh tokens; limpiamos local para forzar re-login
  tokenStorage.clear();
};
