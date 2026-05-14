-- ============================================================
-- RAIDZONE CRAFTING TRACKER — Run this FIRST in Supabase SQL Editor
-- ============================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  steam_id      text unique,
  username      text,
  avatar_url    text,
  is_admin      boolean default false,
  created_at    timestamptz default now()
);

create table if not exists public.clans (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  tag         text not null,
  owner_id    uuid references public.profiles(id) on delete set null,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at  timestamptz default now()
);

create table if not exists public.clan_members (
  clan_id   uuid references public.clans(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  role      text default 'member',
  joined_at timestamptz default now(),
  primary key (clan_id, user_id)
);

create table if not exists public.materials (
  id         text primary key,
  name       text not null,
  category   text not null,
  rarity     text default 'Common',
  icon       text default '📦',
  sort_order int default 0
);

create table if not exists public.recipes (
  id          text primary key,
  name        text not null,
  output_id   text references public.materials(id),
  output_qty  int default 1,
  craft_time  text default '30s',
  category    text,
  station     text default 'Workbench'
);

create table if not exists public.recipe_ingredients (
  recipe_id   text references public.recipes(id) on delete cascade,
  material_id text references public.materials(id),
  qty         int not null,
  primary key (recipe_id, material_id)
);

create table if not exists public.user_inventory (
  user_id     uuid references public.profiles(id) on delete cascade,
  material_id text references public.materials(id),
  owned       int default 0,
  updated_at  timestamptz default now(),
  primary key (user_id, material_id)
);

create table if not exists public.clan_inventory (
  clan_id     uuid references public.clans(id) on delete cascade,
  material_id text references public.materials(id),
  owned       int default 0,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz default now(),
  primary key (clan_id, material_id)
);

create table if not exists public.sessions (
  token       text primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

create table if not exists public.login_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  logged_in_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.clans enable row level security;
alter table public.clan_members enable row level security;
alter table public.materials enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.user_inventory enable row level security;
alter table public.clan_inventory enable row level security;

create policy "profiles_read_all"   on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create policy "clans_read_all"     on public.clans for select using (true);
create policy "clans_insert_auth"  on public.clans for insert with check (auth.uid() is not null);
create policy "clans_update_owner" on public.clans for update using (auth.uid() = owner_id);
create policy "clans_delete_owner" on public.clans for delete using (auth.uid() = owner_id);

create policy "clan_members_read"  on public.clan_members for select using (true);
create policy "clan_members_join"  on public.clan_members for insert with check (auth.uid() = user_id);
create policy "clan_members_leave" on public.clan_members for delete using (
  auth.uid() = user_id or
  exists (select 1 from public.clans where id = clan_id and owner_id = auth.uid())
);

create policy "materials_read_all"   on public.materials for select using (true);
create policy "recipes_read_all"     on public.recipes for select using (true);
create policy "ingredients_read_all" on public.recipe_ingredients for select using (true);

create policy "materials_admin_write" on public.materials for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "recipes_admin_write" on public.recipes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "ingredients_admin_write" on public.recipe_ingredients for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create policy "inventory_own" on public.user_inventory for all using (auth.uid() = user_id);

create policy "clan_inventory_read" on public.clan_inventory for select using (
  exists (select 1 from public.clan_members where clan_id = clan_inventory.clan_id and user_id = auth.uid())
);
create policy "clan_inventory_write" on public.clan_inventory for all using (
  exists (select 1 from public.clan_members where clan_id = clan_inventory.clan_id and user_id = auth.uid())
);

-- SEED MATERIALS
insert into public.materials (id, name, category, rarity, icon, sort_order) values
  ('sulfur',         'Sulfur',           'Raw',       'Common',   '🟡', 1),
  ('iron_ore',       'Iron Ore',          'Raw',       'Common',   '🪨', 2),
  ('tungsten',       'Tungsten Ore',       'Raw',       'Uncommon', '⬛', 3),
  ('charcoal',       'Charcoal',           'Raw',       'Common',   '🔳', 4),
  ('fuel',           'Fuel',               'Raw',       'Common',   '🛢️', 5),
  ('cloth',          'Cloth',              'Raw',       'Common',   '🧵', 6),
  ('wood',           'Wood',               'Raw',       'Common',   '🪵', 7),
  ('glass',          'Glass',              'Raw',       'Common',   '🔷', 8),
  ('steel_ingot',    'Steel Ingot',        'Refined',   'Uncommon', '⚙️', 9),
  ('tungsten_ingot', 'Tungsten Ingot',     'Refined',   'Rare',     '🔩', 10),
  ('sulfur_crystal', 'Sulfur Crystal',     'Refined',   'Uncommon', '💎', 11),
  ('gunpowder',      'Gunpowder',          'Refined',   'Uncommon', '💥', 12),
  ('rocket',         'Rocket',             'Ammo',      'Rare',     '🚀', 13),
  ('molotov',        'Molotov Cocktail',   'Throwable', 'Uncommon', '🔥', 14),
  ('adrenaline',     'Adrenaline Shot',    'Medical',   'Rare',     '💉', 15),
  ('bandage',        'Bandage',            'Medical',   'Common',   '🩹', 16),
  ('explosive',      'Explosive Charge',   'Throwable', 'Rare',     '💣', 17)
on conflict (id) do nothing;

insert into public.recipes (id, name, output_id, output_qty, craft_time, category, station) values
  ('r_steel',      'Steel Ingot',      'steel_ingot',    1, '30s', 'Refined',   'Furnace'),
  ('r_tungsten',   'Tungsten Ingot',   'tungsten_ingot', 1, '45s', 'Refined',   'Furnace'),
  ('r_scrystal',   'Sulfur Crystal',   'sulfur_crystal', 1, '20s', 'Refined',   'Furnace'),
  ('r_gunpowder',  'Gunpowder',        'gunpowder',      5, '10s', 'Refined',   'Workbench'),
  ('r_rocket',     'Rocket',           'rocket',         1, '60s', 'Ammo',      'Workbench'),
  ('r_molotov',    'Molotov Cocktail', 'molotov',        2, '15s', 'Throwable', 'Workbench'),
  ('r_explosive',  'Explosive Charge', 'explosive',      1, '90s', 'Throwable', 'Workbench'),
  ('r_bandage',    'Bandage',          'bandage',        3, '5s',  'Medical',   'Workbench'),
  ('r_adrenaline', 'Adrenaline Shot',  'adrenaline',     1, '30s', 'Medical',   'Lab Bench')
on conflict (id) do nothing;

insert into public.recipe_ingredients (recipe_id, material_id, qty) values
  ('r_steel',      'iron_ore',       2),
  ('r_tungsten',   'tungsten',       1),
  ('r_scrystal',   'sulfur',         2),
  ('r_gunpowder',  'sulfur_crystal', 2),
  ('r_gunpowder',  'charcoal',       3),
  ('r_rocket',     'gunpowder',      30),
  ('r_rocket',     'fuel',           5),
  ('r_rocket',     'steel_ingot',    3),
  ('r_molotov',    'fuel',           3),
  ('r_molotov',    'cloth',          2),
  ('r_molotov',    'glass',          1),
  ('r_explosive',  'gunpowder',      50),
  ('r_explosive',  'steel_ingot',    5),
  ('r_explosive',  'fuel',           10),
  ('r_bandage',    'cloth',          4),
  ('r_adrenaline', 'sulfur_crystal', 3),
  ('r_adrenaline', 'cloth',          2)
on conflict do nothing;
