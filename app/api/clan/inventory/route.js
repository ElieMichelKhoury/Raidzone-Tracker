import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { clan_id, material_id, owned } = await request.json();
  if (!clan_id || !material_id || owned === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const supabase = createAdminClient();
  const { data: member } = await supabase.from('clan_members').select('role').eq('clan_id', clan_id).eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'Not a clan member' }, { status: 403 });
  const { error } = await supabase.from('clan_inventory').upsert({
    clan_id, material_id, owned: Math.max(0, owned), updated_by: user.id, updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
