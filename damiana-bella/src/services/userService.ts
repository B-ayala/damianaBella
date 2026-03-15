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
      },
    });

    if (authError) {
      // Manejar error específico: usuario ya existe
      if (authError.message?.includes('already registered') || authError.message?.includes('User already exists')) {
        throw new Error(`Este correo ya está registrado. Si no recibiste el email de confirmación, usa la opción de reenviar.`);
      }
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Error al crear el usuario en autenticación');
    }

    // 2. Actualizar el nombre en el perfil (el trigger ya creó el perfil)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name: payload.name })
      .eq('id', authData.user.id);

    if (updateError) {
      throw new Error(`Error al actualizar el perfil: ${updateError.message}`);
    }

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
