import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_inventory')
    .select('material_id, owned')
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { material_id, owned } = await request.json();
  if (!material_id || owned === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('user_inventory').upsert({
    user_id: user.id,
    material_id,
    owned: Math.max(0, owned),
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
