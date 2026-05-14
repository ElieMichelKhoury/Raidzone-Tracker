// app/api/clan/route.js
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase';

// GET — fetch user's clan info
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();

  // Find user's clan membership
  const { data: membership } = await supabase
    .from('clan_members')
    .select('clan_id, role, clans(id, name, tag, invite_code, owner_id)')
    .eq('user_id', user.id)
    .single();

  if (!membership) return NextResponse.json({ clan: null });

  // Get clan members
  const { data: members } = await supabase
    .from('clan_members')
    .select('user_id, role, profiles(username, avatar_url, steam_id)')
    .eq('clan_id', membership.clan_id);

  // Get clan inventory
  const { data: inventory } = await supabase
    .from('clan_inventory')
    .select('material_id, owned')
    .eq('clan_id', membership.clan_id);

  return NextResponse.json({
    clan: membership.clans,
    myRole: membership.role,
    members: members || [],
    inventory: inventory || [],
  });
}

// POST — create a clan
export async function POST(request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, tag } = await request.json();
  if (!name || !tag) return NextResponse.json({ error: 'Name and tag required' }, { status: 400 });

  const supabase = createAdminClient();

  // Check not already in a clan
  const { data: existing } = await supabase
    .from('clan_members').select('clan_id').eq('user_id', user.id).single();
  if (existing) return NextResponse.json({ error: 'Already in a clan' }, { status: 400 });

  // Create clan
  const { data: clan, error: clanErr } = await supabase
    .from('clans')
    .insert({ name: name.trim(), tag: tag.trim().toUpperCase(), owner_id: user.id })
    .select().single();

  if (clanErr) return NextResponse.json({ error: clanErr.message }, { status: 500 });

  // Add creator as owner member
  await supabase.from('clan_members').insert({
    clan_id: clan.id,
    user_id: user.id,
    role: 'owner',
  });

  return NextResponse.json({ clan });
}
