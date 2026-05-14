# RaidZone Crafting Tracker — Setup Guide
## Stack: Next.js 14 + Supabase + Steam OpenID → Deploy on Vercel (FREE)

---

## STEP 1 — Create a Supabase Project

1. Go to https://supabase.com and sign up (free)
2. Click **New Project** → name it `raidzone-tracker`
3. Once created, go to **SQL Editor** and run:
   - Paste the contents of `supabase/schema.sql` → Run
   - Paste the contents of `supabase/sessions.sql` → Run
4. Go to **Settings > API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## STEP 2 — Get a Steam API Key

1. Go to https://steamcommunity.com/dev/apikey
2. Log in with your Steam account
3. Set **Domain Name** to your Vercel URL (or `localhost` for testing)
4. Copy the key → `STEAM_API_KEY`

---

## STEP 3 — Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to https://vercel.com → **New Project** → Import your repo
3. In **Environment Variables**, add all 5 vars:

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY     = eyJ...
STEAM_API_KEY                 = your_steam_key
NEXTAUTH_URL                  = https://your-app.vercel.app
APP_SECRET                    = any_long_random_string_32+_chars
```

4. Click **Deploy** — Vercel builds and hosts it automatically

---

## STEP 4 — Set Yourself as Admin

After first login via Steam:

1. Go to Supabase Dashboard → **Table Editor** → `profiles`
2. Find your row (by username)
3. Set `is_admin` to `true`
4. Save

Now you have the Admin Panel to add/edit materials and recipes.

---

## STEP 5 — Update Steam API Key Domain

After deploying, go back to https://steamcommunity.com/dev/apikey and update the domain to your real Vercel URL.

---

## LOCAL DEVELOPMENT

```bash
# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.local.example .env.local

# Run dev server
npm run dev
# Open http://localhost:3000
```

For local Steam login to work, temporarily set `NEXTAUTH_URL=http://localhost:3000` and update your Steam API key domain to `localhost`.

---

## HOW CLANS WORK

- Any player can **create a clan** (Admin Panel → Clan tab)
- The owner gets an **invite code** (8-char random string)
- Share the invite code with teammates
- Members can view and edit the **shared clan inventory**
- Clan inventory is separate from personal inventory

---

## FEATURES SUMMARY

| Feature | Details |
|---|---|
| 🔐 Auth | Steam OpenID — no passwords needed |
| 📦 Personal Inventory | Per-user, saved to Supabase |
| 🛡️ Clan System | Create/join clans, shared inventory |
| ⚙️ Craft Calculator | Recursive ingredient resolver |
| 📋 Recipe DB | Expandable, searchable |
| 🔧 Admin Panel | Add/edit/delete materials & recipes (admin only) |
| 💾 Database | Supabase Postgres (free tier = 500MB, plenty) |
| 🌐 Hosting | Vercel (free tier = unlimited hobby projects) |
