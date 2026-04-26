import { supabase } from '../config/supabaseClient';

export const getAuthToken = async (): Promise<string> => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    // Session corrupt or missing — try refreshing
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session?.access_token) return refreshed.session.access_token;
    throw new Error('Token no disponible');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at ?? 0;

  if (expiresAt - now < 60) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session?.access_token) return refreshed.session.access_token;
  }

  return session.access_token;
};
