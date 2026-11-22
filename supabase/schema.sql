-- ============================================================================
-- IB HOME LIGHT PROPERTY AND LAND — SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ============================================================================
-- Run this entire script inside the Supabase Dashboard -> SQL Editor.
-- Safe to run on fresh projects and idempotent on existing projects.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. ADMIN USERS TABLE
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  username text unique not null,
  email text unique not null,
  full_name text not null default 'Administrator',
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. WEBSITE SETTINGS TABLE
create table if not exists public.website_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null default 'Ib home light property and land',
  company_description text not null default 'Ib home light property and land is a real estate business offering houses, land, commercial properties and fuel station property opportunities.',
  phone text not null default '+234 806 366 9688',
  whatsapp text not null default '+2348063669688',
  instagram text not null default '@alabo007',
  email text default 'Ibilateberepele17@gmail.com',
  office_address text not null default 'No. 4 Central Estate, Army Range, Igwuruta, Port Harcourt, Nigeria.',
  hero_location_label text not null default 'Port Harcourt, Rivers State · Nigeria',
  hero_heading text not null default 'FIND YOUR DREAM PROPERTY WITH IB HOME LIGHT.',
  hero_description text not null default 'Your trusted partner for buying and selling houses, lands and commercial properties in Port Harcourt and beyond.',
  logo_url text default '',
  updated_at timestamptz not null default now()
);

insert into public.website_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.website_settings
  add column if not exists email text default 'Ibilateberepele17@gmail.com';

-- 3. PROPERTY CATEGORIES TABLE
create table if not exists public.property_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.property_categories (name, slug, description, sort_order) values
  ('Self-contained', 'self-contained', 'Modern self-contained apartments and studio living units.', 1),
  ('One-bedroom flat', 'one-bedroom-flat', 'Well-finished one-bedroom apartments in accessible residential zones.', 2),
  ('Two-bedroom flat', 'two-bedroom-flat', 'Spacious two-bedroom residential apartments and flats.', 3),
  ('Duplex', 'duplex', 'Luxury detached, semi-detached, and terrace duplexes.', 4),
  ('Land', 'land', 'Verified dry residential and commercial plots with clean title documentation.', 5),
  ('Other', 'other', 'Additional residential, estate, and mixed-use property opportunities.', 6),
  ('Houses for Sale', 'houses-for-sale', 'Completed modern duplexes, detached villas, and residential family homes.', 7),
  ('Lands for Sale', 'lands-for-sale', 'Verified dry residential and commercial plots with clean title documentation.', 8),
  ('Commercial Properties', 'commercial-properties', 'Office plazas, retail complexes, warehouses, and hospitality assets.', 9),
  ('Fuel Station Properties', 'fuel-station-properties', 'Operational and development-ready filling stations along strategic corridors.', 10),
  ('Residential Properties', 'residential-properties', 'Gated estate residences and executive residential developments.', 11),
  ('Investment Properties', 'investment-properties', 'High-yield land banking and income-producing real estate assets.', 12)
on conflict (slug) do nothing;

-- 4. PROPERTIES TABLE
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category_id uuid references public.property_categories(id) on delete set null,
  category_name text not null,
  listing_type text not null default 'For Sale' check (listing_type in ('For Rent', 'For Sale', 'House Rent', 'To Let', 'Short Let')),
  location text not null,
  bedrooms integer,
  bathrooms integer,
  property_size text not null default '',
  price numeric(15, 2) not null default 0,
  price_display text not null,
  caution_fee numeric(15, 2) not null default 0,
  drinking_money numeric(15, 2) not null default 0,
  movement_fee numeric(15, 2) not null default 0,
  agreement_fee numeric(15, 2) not null default 0,
  legal_fee numeric(15, 2) not null default 0,
  agent_commission_percent numeric(6, 2) not null default 0,
  agent_commission_amount numeric(15, 2) not null default 0,
  fee_visibility jsonb not null default '{"caution_fee": true, "drinking_money": true, "movement_fee": true, "agreement_fee": true, "legal_fee": true, "agent_commission": true}'::jsonb,
  short_description text not null default '',
  full_description text not null default '',
  features text[] not null default '{}',
  availability text not null default 'available' check (availability in ('available', 'sold', 'rented', 'unavailable')),
  is_featured boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_properties_published on public.properties(is_published);
create index if not exists idx_properties_category on public.properties(category_name);
create index if not exists idx_properties_availability on public.properties(availability);
create index if not exists idx_properties_listing_type on public.properties(listing_type);

-- 5. PROPERTY IMAGES TABLE
create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  image_url text not null,
  storage_path text default '',
  caption text default '',
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_images_property_id on public.property_images(property_id);

-- 6. PROPERTY VIDEOS TABLE
create table if not exists public.property_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  video_url text not null,
  storage_path text default '',
  caption text default '',
  mime_type text default 'video/mp4',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_property_videos_property_id on public.property_videos(property_id);

-- 7. GALLERY MEDIA ITEMS TABLE
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  image_url text not null,
  storage_path text default '',
  property_id uuid references public.properties(id) on delete set null,
  show_in_gallery boolean not null default true,
  created_at timestamptz not null default now()
);

-- 8. CUSTOMERS TABLE
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text unique not null,
  email text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. ENQUIRIES TABLE
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text not null default '',
  property_id uuid references public.properties(id) on delete set null,
  property_interest text not null default 'General Enquiry',
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_enquiries_status on public.enquiries(status);
create index if not exists idx_enquiries_customer_id on public.enquiries(customer_id);

-- ============================================================================
-- SECURITY HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where auth_user_id = auth.uid()
  );
$$;

create or replace function public.get_admin_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.admin_users
  where lower(username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.get_admin_email_by_username(text) to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_admin_users_updated_at') then
    create trigger trg_admin_users_updated_at
      before update on public.admin_users
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_properties_updated_at') then
    create trigger trg_properties_updated_at
      before update on public.properties
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_enquiries_updated_at') then
    create trigger trg_enquiries_updated_at
      before update on public.enquiries
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_customers_updated_at') then
    create trigger trg_customers_updated_at
      before update on public.customers
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_settings_updated_at') then
    create trigger trg_settings_updated_at
      before update on public.website_settings
      for each row execute function public.touch_updated_at();
  end if;
end
$$;

create or replace function public.sync_customer_from_enquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  insert into public.customers (full_name, phone, email)
  values (trim(new.full_name), trim(new.phone), trim(coalesce(new.email, '')))
  on conflict (phone) do update
    set full_name = excluded.full_name,
        email = case when excluded.email <> '' then excluded.email else public.customers.email end,
        updated_at = now()
  returning id into v_customer_id;

  new.customer_id := v_customer_id;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_enquiries_sync_customer') then
    create trigger trg_enquiries_sync_customer
      before insert on public.enquiries
      for each row execute function public.sync_customer_from_enquiry();
  end if;
end
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.admin_users enable row level security;
alter table public.website_settings enable row level security;
alter table public.property_categories enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_videos enable row level security;
alter table public.gallery_items enable row level security;
alter table public.customers enable row level security;
alter table public.enquiries enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_users' and policyname = 'Admin users can view admin records') then
    create policy "Admin users can view admin records"
      on public.admin_users for select
      using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_users' and policyname = 'Admin users can update own record') then
    create policy "Admin users can update own record"
      on public.admin_users for update
      using (auth_user_id = auth.uid() and public.is_admin())
      with check (auth_user_id = auth.uid() and public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'website_settings' and policyname = 'Public can view website settings') then
    create policy "Public can view website settings"
      on public.website_settings for select
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'website_settings' and policyname = 'Admins can update website settings') then
    create policy "Admins can update website settings"
      on public.website_settings for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'property_categories' and policyname = 'Public can view property categories') then
    create policy "Public can view property categories"
      on public.property_categories for select
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'property_categories' and policyname = 'Admins can manage property categories') then
    create policy "Admins can manage property categories"
      on public.property_categories for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'properties' and policyname = 'Public can view published properties') then
    create policy "Public can view published properties"
      on public.properties for select
      using (is_published = true or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'properties' and policyname = 'Admins can insert properties') then
    create policy "Admins can insert properties"
      on public.properties for insert
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'properties' and policyname = 'Admins can update properties') then
    create policy "Admins can update properties"
      on public.properties for update
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'properties' and policyname = 'Admins can delete properties') then
    create policy "Admins can delete properties"
      on public.properties for delete
      using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'property_images' and policyname = 'Public can view published property images') then
    create policy "Public can view published property images"
      on public.property_images for select
      using (
        public.is_admin() or exists (
          select 1 from public.properties p
          where p.id = property_images.property_id and p.is_published = true
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'property_images' and policyname = 'Admins can manage property images') then
    create policy "Admins can manage property images"
      on public.property_images for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'property_videos' and policyname = 'Public can view published property videos') then
    create policy "Public can view published property videos"
      on public.property_videos for select
      using (
        public.is_admin() or exists (
          select 1 from public.properties p
          where p.id = property_videos.property_id and p.is_published = true
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'property_videos' and policyname = 'Admins can manage property videos') then
    create policy "Admins can manage property videos"
      on public.property_videos for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gallery_items' and policyname = 'Public can view visible gallery items') then
    create policy "Public can view visible gallery items"
      on public.gallery_items for select
      using (show_in_gallery = true or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gallery_items' and policyname = 'Admins can manage gallery items') then
    create policy "Admins can manage gallery items"
      on public.gallery_items for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'Admins can manage customers') then
    create policy "Admins can manage customers"
      on public.customers for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Public can submit enquiries') then
    create policy "Public can submit enquiries"
      on public.enquiries for insert
      with check (
        length(trim(full_name)) >= 2
        and length(trim(phone)) >= 6
        and length(trim(message)) >= 4
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Admins can view and manage enquiries') then
    create policy "Admins can view and manage enquiries"
      on public.enquiries for select
      using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Admins can update enquiries') then
    create policy "Admins can update enquiries"
      on public.enquiries for update
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enquiries' and policyname = 'Admins can delete enquiries') then
    create policy "Admins can delete enquiries"
      on public.enquiries for delete
      using (public.is_admin());
  end if;
end
$$;

-- ============================================================================
-- SUPABASE STORAGE BUCKET & POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public can view property media') then
    create policy "Public can view property media"
      on storage.objects for select
      using (bucket_id = 'property-media');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins can upload property media') then
    create policy "Admins can upload property media"
      on storage.objects for insert
      with check (bucket_id = 'property-media' and public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins can update property media') then
    create policy "Admins can update property media"
      on storage.objects for update
      using (bucket_id = 'property-media' and public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins can delete property media') then
    create policy "Admins can delete property media"
      on storage.objects for delete
      using (bucket_id = 'property-media' and public.is_admin());
  end if;
end
$$;
