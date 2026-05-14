import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import crypto from 'crypto';

async function verifySteamOpenID(params) {
  const verifyParams = new URLSearchParams(params);
  verifyParams.set('openid.mode', 'check_authentication');
  const res = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  });
  const text = await res.text();
  return text.includes('is_valid:true');
}

async function getSteamProfile(steamId) {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.response?.players?.[0] || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());

  const valid = await verifySteamOpenID(params);
  if (!valid) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=steam_invalid`);

  const claimedId = params['openid.claimed_id'] || '';
  const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
  if (!steamIdMatch) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=steam_id_parse`);
  const steamId = steamIdMatch[1];

  const profile = await getSteamProfile(steamId);
  if (!profile) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=steam_profile`);

  const supabase = createAdminClient();

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('steam_id', steamId)
    .single();

  let userId;

  if (existingProfile) {
    userId = existingProfile.id;
    await supabase.from('profiles').update({
      username: profile.personaname,
      avatar_url: profile.avatarfull,
    }).eq('id', userId);
  } else {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const email = `steam_${steamId}@raidzone.app`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
    });
    if (authError || !authUser?.user) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_create`);
    userId = authUser.user.id;
    await supabase.from('profiles').insert({
      id: userId,
      steam_id: steamId,
      username: profile.personaname,
      avatar_url: profile.avatarfull,
      is_admin: false,
    });
  }

  await supabase.from('login_log').insert({
    user_id: userId,
    logged_in_at: new Date().toISOString(),
  });

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  await supabase.from('sessions').upsert({
    token: sessionToken,
    user_id: userId,
    expires_at: new Date(expiresAt).toISOString(),
  });

  const cookieStore = cookies();
  cookieStore.set('rz_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
}
