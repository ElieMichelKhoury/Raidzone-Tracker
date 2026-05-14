// lib/session.js
// Server-side session helpers

import { cookies } from 'next/headers';
import { createAdminClient } from './supabase';

/**
 * Get the current user from the session cookie.
 * Returns null if not authenticated or session expired.
 */
export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('rz_session')?.value;
  if (!token) return null;

  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    // Expired — clean up
    await supabase.from('sessions').delete().eq('token', token);
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, steam_id, is_admin')
    .eq('id', session.user_id)
    .single();

  return profile || null;
}

/**
 * Sign out — delete session from DB and clear cookie.
 */
export async function destroySession() {
  const cookieStore = cookies();
  const token = cookieStore.get('rz_session')?.value;
  if (token) {
    const supabase = createAdminClient();
    await supabase.from('sessions').delete().eq('token', token);
  }
  cookieStore.delete('rz_session');
}
