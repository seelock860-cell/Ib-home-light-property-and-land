-- ============================================================================
-- NON-DESTRUCTIVE MIGRATION FOR EXISTING SUPABASE DATABASES
-- ============================================================================
-- Run this script in Supabase SQL Editor if you already created the initial
-- tables and want to preserve all existing properties while adding the new
-- Property Management System fields and property_videos table.
-- ============================================================================

alter table public.website_settings
  add column if not exists email text default 'Ibilateberepele17@gmail.com';

alter table public.properties
  add column if not exists listing_type text not null default 'For Sale',
  add column if not exists bedrooms integer,
  add column if not exists bathrooms integer,
  add column if not exists property_size text not null default '',
  add column if not exists caution_fee numeric(15, 2) not null default 0,
  add column if not exists drinking_money numeric(15, 2) not null default 0,
  add column if not exists movement_fee numeric(15, 2) not null default 0,
  add column if not exists agreement_fee numeric(15, 2) not null default 0,
  add column if not exists legal_fee numeric(15, 2) not null default 0,
  add column if not exists agent_commission_percent numeric(6, 2) not null default 0,
  add column if not exists agent_commission_amount numeric(15, 2) not null default 0,
  add column if not exists fee_visibility jsonb not null default '{"caution_fee": true, "drinking_money": true, "movement_fee": true, "agreement_fee": true, "legal_fee": true, "agent_commission": true}'::jsonb;

alter table public.properties drop constraint if exists properties_listing_type_check;
alter table public.properties add constraint properties_listing_type_check
  check (listing_type in ('For Rent', 'For Sale', 'House Rent', 'To Let', 'Short Let'));

alter table public.properties drop constraint if exists properties_availability_check;
alter table public.properties add constraint properties_availability_check
  check (availability in ('available', 'sold', 'rented', 'unavailable'));

create index if not exists idx_properties_listing_type on public.properties(listing_type);

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

alter table public.property_videos enable row level security;

drop policy if exists "Public can view published property videos" on public.property_videos;
create policy "Public can view published property videos"
  on public.property_videos for select
  using (
    public.is_admin() or exists (
      select 1 from public.properties p
      where p.id = property_videos.property_id and p.is_published = true
    )
  );

drop policy if exists "Admins can manage property videos" on public.property_videos;
create policy "Admins can manage property videos"
  on public.property_videos for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.property_categories (name, slug, description, sort_order) values
  ('Self-contained', 'self-contained', 'Modern self-contained apartments and studio living units.', 1),
  ('One-bedroom flat', 'one-bedroom-flat', 'Well-finished one-bedroom apartments in accessible residential zones.', 2),
  ('Two-bedroom flat', 'two-bedroom-flat', 'Spacious two-bedroom residential apartments and flats.', 3),
  ('Duplex', 'duplex', 'Luxury detached, semi-detached, and terrace duplexes.', 4),
  ('Land', 'land', 'Verified dry residential and commercial plots with clean title documentation.', 5),
  ('Other', 'other', 'Additional residential, estate, and mixed-use property opportunities.', 6)
on conflict (slug) do nothing;

