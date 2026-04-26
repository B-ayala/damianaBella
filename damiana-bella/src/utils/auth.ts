import { supabase } from '../config/supabaseClient';

export const getAuthToken = async (): Promise<string> => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error('Token no disponible');
  return token;
};
