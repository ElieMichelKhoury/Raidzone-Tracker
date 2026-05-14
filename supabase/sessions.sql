-- Add sessions table (add this to your Supabase SQL editor too)
create table if not exists public.sessions (
  token       text primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

-- No RLS on sessions — only accessed server-side via service role key
