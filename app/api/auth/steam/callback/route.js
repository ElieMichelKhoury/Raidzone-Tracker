// app/api/auth/steam/callback/route.js
// Handles Steam OpenID callback, verifies with Steam, creates/updates user in Supabase

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import crypto from 'crypto';

async function verifySteamOpenID(params) {
  // Re-send params to Steam for verification
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

  // 1. Verify with Steam
  const valid = await verifySteamOpenID(params);
  if (!valid) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=steam_invalid`);
  }

  // 2. Extract Steam ID from claimed_id URL
  // Format: https://steamcommunity.com/openid/id/76561198XXXXXXXXX
  const claimedId = params['openid.claimed_id'] || '';
  const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
  if (!steamIdMatch) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=steam_id_parse`);
  }
  const steamId = steamIdMatch[1];

  // 3. Fetch Steam profile
  const profile = await getSteamProfile(steamId);
  if (!profile) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=steam_profile`);
  }

  // 4. Upsert user in Supabase using admin client
  const supabase = createAdminClient();

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('steam_id', steamId)
    .single();

  let userId;

  if (existingProfile) {
    // Update existing
    userId = existingProfile.id;
    await supabase.from('profiles').update({
      username: profile.personaname,
      avatar_url: profile.avatarfull,
    }).eq('id', userId);
  } else {
    // Create a new Supabase auth user with a random password (Steam users don't use passwords)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const email = `steam_${steamId}@raidzone.app`; // placeholder email

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
    });

    if (authError || !authUser?.user) {
      console.error('Auth user creation error:', authError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_create`);
    }

    userId = authUser.user.id;

    // Create profile
    await supabase.from('profiles').insert({
      id: userId,
      steam_id: steamId,
      username: profile.personaname,
      avatar_url: profile.avatarfull,
      is_admin: false,
    });
  }

  // 5. Sign in as that user — generate a magic link / session token
  // We use a custom session cookie approach since Steam users don't have passwords
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  // Store session in Supabase (simple sessions table — add to schema if needed)
  await supabase.from('sessions').upsert({
    token: sessionToken,
    user_id: userId,
    expires_at: new Date(expiresAt).toISOString(),
  });

  // Set session cookie
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
