import { supabase } from '../config/supabaseClient';

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

/**
 * Crear un nuevo usuario con Supabase Auth
 * El trigger en Supabase automáticamente crea el perfil en public.profiles
 */
export const createUser = async (payload: CreateUserPayload): Promise<{ success: boolean; data?: User; message?: string }> => {
  try {
    // 1. Registrarse en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (authError) {
      // Email ya registrado y confirmado
      if (authError.message?.includes('already registered') || authError.message?.includes('User already exists')) {
        throw new Error('EMAIL_ALREADY_CONFIRMED');
      }
      if (authError.message?.toLowerCase().includes('rate limit') || authError.message?.toLowerCase().includes('over_email_send_rate_limit')) {
        throw new Error('Demasiados intentos. Por favor esperá unos minutos antes de volver a intentarlo.');
      }
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Error al crear el usuario en autenticación');
    }

    // Detectar "signup falso" — Supabase retorna éxito pero sin crear usuario real
    // Esto pasa cuando el email ya existe pero no está confirmado (identities viene vacío)
    if (!authData.user.identities || authData.user.identities.length === 0) {
      throw new Error('EMAIL_PENDING_CONFIRMATION');
    }

    // El trigger handle_new_user() se encarga de leer el nombre desde raw_user_meta_data
    // Intento best-effort de actualizar, pero no falla si RLS lo bloquea (email no confirmado)
    await supabase
      .from('profiles')
      .update({ name: payload.name })
      .eq('id', authData.user.id);

    return {
      success: true,
      data: {
        id: authData.user.id,
        name: payload.name,
        email: payload.email,
        role: 'user',
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error al registrar el usuario');
  }
};

interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Iniciar sesión con Supabase Auth
 */
export const loginUser = async (payload: LoginPayload): Promise<{ success: boolean; data?: User; message?: string }> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Error al iniciar sesión');
    }

    // Obtener datos del perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role, email')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      throw new Error('Error al obtener el perfil del usuario');
    }

    return {
      success: true,
      data: {
        id: authData.user.id,
        name: profile?.name || '',
        email: authData.user.email || '',
        role: profile?.role || 'user',
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Credenciales inválidas');
  }
};

/**
 * Obtener el usuario autenticado actual
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, role, email')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      id: user.id,
      name: profile.name || '',
      email: user.email || '',
      role: profile.role || 'user',
    };
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
}

/**
 * Cerrar sesión
 */
export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
};

/**
 * Reenviar email de confirmación
 * Se usa cuando el usuario no recibió el primer email o lo perdió
 */
export const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('over_email_send_rate_limit')) {
        throw new Error('Demasiados intentos. Por favor esperá unos minutos antes de volver a solicitar el email.');
      }
      throw new Error(error.message);
    }

    return {
      success: true,
      message: `Email de confirmación reenviado a ${email}. Revisa tu bandeja de entrada (y carpeta de spam).`,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Error al reenviar el email de confirmación'
    );
  }
};

/**
 * Verificar confirmación de email con Supabase
 * Se usa cuando el usuario hace click en el link del email de confirmación
 */
export const verifyEmailConfirmation = async (token: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Tu cuenta ha sido confirmada correctamente.',
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Error al verificar el email'
    );
  }
};

// ============================================================
// Admin API functions (Backend endpoints)
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  email_confirmed_at: string | null;
}

/**
 * Obtener todos los usuarios (endpoint admin del backend)
 */
export const getAdminUsers = async (): Promise<AdminUserData[]> => {
  const response = await fetch(`${API_BASE_URL}/api/users`);

  if (!response.ok) {
    throw new Error('Error al conectar con el servidor');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Error al obtener usuarios');
  }

  return data.data;
};

/**
 * Eliminar un usuario completamente (auth.users + profiles)
 */
export const deleteAdminUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Error al eliminar usuario' }));

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Error al eliminar usuario');
  }
};
