import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL y Anon Key son requeridos. Verifica tu archivo .env'
  );
}

// `persistSession: false` — la sesión de supabase-js no se escribe en
// localStorage. El access token vive en memoria (`authTokenStore`) y el
// refresh token real nunca llega a este cliente: queda en una cookie httpOnly
// que solo el backend lee (`POST /api/auth/refresh`). Ver `services/authService.ts`.
// `autoRefreshToken: false` — sin el refresh token real, el auto-refresh nativo
// de supabase-js no tiene con qué renovar; `authTokenStore` programa la
// renovación real contra el backend antes de que el access token expire.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: true,
  },
});
