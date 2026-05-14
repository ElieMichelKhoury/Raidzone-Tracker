import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect('/');

  const supabase = createAdminClient();

  const [matsRes, recipesRes, ingsRes, invRes, clanMemberRes] = await Promise.all([
    supabase.from('materials').select('*').order('sort_order'),
    supabase.from('recipes').select('*'),
    supabase.from('recipe_ingredients').select('*'),
    supabase.from('user_inventory').select('material_id, owned').eq('user_id', user.id),
    supabase.from('clan_members').select('clan_id, role, clans(id, name, tag, invite_code)').eq('user_id', user.id).single(),
  ]);

  const recipes = (recipesRes.data || []).map(r => ({
    ...r,
    ingredients: (ingsRes.data || [])
      .filter(i => i.recipe_id === r.id)
      .map(i => ({ material_id: i.material_id, qty: i.qty })),
  }));

  const invMap = {};
  for (const row of (invRes.data || [])) invMap[row.material_id] = row.owned;
  const materials = (matsRes.data || []).map(m => ({ ...m, owned: invMap[m.id] || 0 }));

  const clan = clanMemberRes.data?.clans || null;
  const clanRole = clanMemberRes.data?.role || null;

  return (
    <DashboardClient
      user={user}
      materials={materials}
      recipes={recipes}
      clan={clan}
      clanRole={clanRole}
    />
  );
}
