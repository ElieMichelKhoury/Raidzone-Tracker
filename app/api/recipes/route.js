import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET() {
  const supabase = createAdminClient();
  const [matsRes, recipesRes, ingsRes] = await Promise.all([
    supabase.from('materials').select('*').order('sort_order'),
    supabase.from('recipes').select('*'),
    supabase.from('recipe_ingredients').select('*'),
  ]);
  const recipes = (recipesRes.data || []).map(r => ({
    ...r,
    ingredients: (ingsRes.data || []).filter(i => i.recipe_id === r.id).map(i => ({ material_id: i.material_id, qty: i.qty })),
  }));
  return NextResponse.json({ materials: matsRes.data || [], recipes });
}

export async function POST(request) {
  const user = await getSession();
  if (!user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  const supabase = createAdminClient();

  if (body.action === 'upsert_material') {
    const { id, name, category, rarity, icon } = body;
    const { error } = await supabase.from('materials').upsert({ id, name, category, rarity, icon });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'upsert_recipe') {
    const { id, name, output_id, output_qty, craft_time, category, station, ingredients } = body;
    const { error: rErr } = await supabase.from('recipes').upsert({ id, name, output_id, output_qty, craft_time, category, station });
    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
    if (ingredients?.length) {
      await supabase.from('recipe_ingredients').insert(ingredients.map(i => ({ recipe_id: id, material_id: i.material_id, qty: i.qty })));
    }
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'delete_recipe') {
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', body.id);
    await supabase.from('recipes').delete().eq('id', body.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'delete_material') {
    await supabase.from('materials').delete().eq('id', body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
