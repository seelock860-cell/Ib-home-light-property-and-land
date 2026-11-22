# Ib home light property and land — Production Deployment Guide

This project is engineered for production deployment using **Supabase** (PostgreSQL database, Row Level Security, Supabase Auth, and Supabase Storage), **GitHub**, and **Vercel**.

---

## 1. Create Your Supabase Project

1. Sign in at [supabase.com](https://supabase.com) and click **New Project**.
2. Choose an organization, enter a project name (e.g., `ib-home-light`), select a strong database password, and choose a nearby region.
3. Wait ~2 minutes for provisioning to complete.

---

## 2. Set Up Database Tables, Triggers, Storage & RLS

1. Open your Supabase project dashboard and navigate to **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Copy the entire contents of `supabase/schema.sql` from this repository and paste it into the SQL Editor.
4. Click **Run**. This creates:
   - `admin_users`
   - `website_settings` (pre-populated with Ib home light property and land's official details)
   - `property_categories` (pre-populated with all 12 property categories)
   - `properties`, `property_images`, and `property_videos`
   - `gallery_items`
   - `customers` & `enquiries` (with automatic customer-sync trigger)
   - `property-media` public storage bucket with admin-only write policies
   - Strict Row Level Security (RLS) policies on all tables
5. If upgrading an existing Supabase project that already ran an older version of the schema, run `supabase/migration_v2_property_system.sql` instead of wiping tables so existing properties and records remain intact.

---

## 3. Configure Authentication & Link Your Administrator (`ibilate`)

1. In Supabase Dashboard, go to **Authentication → Providers → Email** and ensure **Email** provider is enabled.
2. Go to **Authentication → Users** and click **Add user → Create new user**:
   - **Email**: Your administrator email address
   - **Password**: Your chosen secure administrator password
   - Check **Auto Confirm User** and click **Create user**.
3. Return to **SQL Editor** and run the following query (replacing `YOUR_ADMIN_EMAIL_HERE` with the email you created in step 2):

```sql
insert into public.admin_users (auth_user_id, username, email, full_name, role)
select id, 'ibilate', email, 'IB Home Light Administrator', 'super_admin'
from auth.users
where email = 'YOUR_ADMIN_EMAIL_HERE'
on conflict (auth_user_id) do nothing;
```

Your administrator account is now securely linked. Passwords are stored exclusively inside Supabase Auth and are never stored in plain text or frontend code.

---

## 4. Environment Variables

Create a `.env` file locally (or configure directly in Vercel) with your Supabase **Project URL** and **Publishable / Anon Key** (found in **Project Settings → API**):

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
```

> **Security Note:** Never put your `service_role` or secret key in `VITE_*` variables or frontend code. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong in the client environment.

---

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "Production release of Ib home light property and land"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ib-home-light.git
git push -u origin main
```

---

## 6. Deploy to Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New... → Project**.
2. Import your GitHub repository (`ib-home-light`).
3. Vercel automatically detects Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Open **Environment Variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. `vercel.json` handles all SPA routes (`/properties/...`, `#/admin`, `/admin`, `/admin/login`, etc.) automatically.

---

## 7. Accessing the Protected Admin Dashboard

- Navigate directly to `/#/admin` (or `/admin`) in your browser — the Admin button is intentionally hidden from the public website navigation.
- Sign in using your **Username** (`ibilate`) and password.
- You can update your username or password anytime from **Admin Dashboard → Admin Username & Password**.
