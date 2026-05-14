import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { invite_code } = await request.json();
  if (!invite_code) return NextResponse.json({ error: 'Invite code required' }, { status: 400 });
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from('clan_members').select('clan_id').eq('user_id', user.id).single();
  if (existing) return NextResponse.json({ error: 'Already in a clan. Leave first.' }, { status: 400 });
  const { data: clan } = await supabase.from('clans').select('id, name').eq('invite_code', invite_code.trim()).single();
  if (!clan) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
  const { error } = await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, role: 'member' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clan });
}
