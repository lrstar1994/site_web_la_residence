create schema if not exists site;

create table if not exists site.venues (
  id uuid primary key default gen_random_uuid(),
  code varchar(100) not null unique,
  name varchar(200) not null,
  location_fr varchar(200) not null,
  location_en varchar(200) not null,
  short_description_fr text not null,
  short_description_en text not null,
  description_fr text not null,
  description_en text not null,
  capacity integer not null,
  surface_m2 numeric(8,2),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venues_code_not_empty check (char_length(trim(code)) >= 2),
  constraint venues_name_not_empty check (char_length(trim(name)) >= 2),
  constraint venues_location_fr_not_empty check (char_length(trim(location_fr)) > 0),
  constraint venues_location_en_not_empty check (char_length(trim(location_en)) > 0),
  constraint venues_short_description_fr_not_empty check (char_length(trim(short_description_fr)) > 0),
  constraint venues_short_description_en_not_empty check (char_length(trim(short_description_en)) > 0),
  constraint venues_description_fr_not_empty check (char_length(trim(description_fr)) > 0),
  constraint venues_description_en_not_empty check (char_length(trim(description_en)) > 0),
  constraint venues_capacity_positive check (capacity > 0),
  constraint venues_surface_positive check (surface_m2 is null or surface_m2 > 0),
  constraint venues_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.venue_images (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references site.venues(id) on update cascade on delete cascade,
  image_path text not null,
  alt_fr varchar(250) not null,
  alt_en varchar(250) not null,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_images_path_not_empty check (char_length(trim(image_path)) > 0),
  constraint venue_images_alt_fr_not_empty check (char_length(trim(alt_fr)) > 0),
  constraint venue_images_alt_en_not_empty check (char_length(trim(alt_en)) > 0),
  constraint venue_images_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.venue_setup_types (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  name_fr varchar(120) not null,
  name_en varchar(120) not null,
  icon_key varchar(80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_setup_types_code_not_empty check (char_length(trim(code)) >= 2),
  constraint venue_setup_types_name_fr_not_empty check (char_length(trim(name_fr)) >= 2),
  constraint venue_setup_types_name_en_not_empty check (char_length(trim(name_en)) >= 2),
  constraint venue_setup_types_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.venue_setup_links (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references site.venues(id) on update cascade on delete cascade,
  setup_type_id uuid not null references site.venue_setup_types(id) on update cascade on delete restrict,
  capacity integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, setup_type_id),
  constraint venue_setup_links_capacity_positive check (capacity is null or capacity > 0),
  constraint venue_setup_links_sort_order_positive check (sort_order >= 0)
);

drop trigger if exists venues_set_updated_at on site.venues;
create trigger venues_set_updated_at before update on site.venues
for each row execute function site.set_updated_at();

drop trigger if exists venue_images_set_updated_at on site.venue_images;
create trigger venue_images_set_updated_at before update on site.venue_images
for each row execute function site.set_updated_at();

drop trigger if exists venue_setup_types_set_updated_at on site.venue_setup_types;
create trigger venue_setup_types_set_updated_at before update on site.venue_setup_types
for each row execute function site.set_updated_at();

drop trigger if exists venue_setup_links_set_updated_at on site.venue_setup_links;
create trigger venue_setup_links_set_updated_at before update on site.venue_setup_links
for each row execute function site.set_updated_at();

create index if not exists venues_active_sort_idx on site.venues (is_active, sort_order);
create index if not exists venue_images_venue_sort_idx on site.venue_images (venue_id, is_active, sort_order);
create unique index if not exists venue_images_one_active_cover_idx
on site.venue_images (venue_id)
where is_cover = true and is_active = true;
create unique index if not exists venue_images_unique_path_idx on site.venue_images (venue_id, image_path);
create index if not exists venue_setup_types_active_sort_idx on site.venue_setup_types (is_active, sort_order);
create index if not exists venue_setup_links_venue_sort_idx on site.venue_setup_links (venue_id, is_active, sort_order);
create index if not exists venue_setup_links_setup_idx on site.venue_setup_links (setup_type_id);

alter table site.venues enable row level security;
alter table site.venue_images enable row level security;
alter table site.venue_setup_types enable row level security;
alter table site.venue_setup_links enable row level security;

grant select on site.venues, site.venue_images, site.venue_setup_types, site.venue_setup_links to anon, authenticated;
grant insert, update on site.venues, site.venue_images, site.venue_setup_types, site.venue_setup_links to authenticated;
grant all privileges on site.venues, site.venue_images, site.venue_setup_types, site.venue_setup_links to service_role;

drop policy if exists "Public can read active venues" on site.venues;
create policy "Public can read active venues" on site.venues
for select to anon, authenticated using (is_active = true);
drop policy if exists "Active admins can read all venues" on site.venues;
create policy "Active admins can read all venues" on site.venues
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert venues" on site.venues;
create policy "Active admins can insert venues" on site.venues
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update venues" on site.venues;
create policy "Active admins can update venues" on site.venues
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active venue images" on site.venue_images;
create policy "Public can read active venue images" on site.venue_images
for select to anon, authenticated using (
  is_active = true
  and exists (select 1 from site.venues v where v.id = venue_id and v.is_active = true)
);
drop policy if exists "Active admins can read all venue images" on site.venue_images;
create policy "Active admins can read all venue images" on site.venue_images
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert venue images" on site.venue_images;
create policy "Active admins can insert venue images" on site.venue_images
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update venue images" on site.venue_images;
create policy "Active admins can update venue images" on site.venue_images
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active venue setup types" on site.venue_setup_types;
create policy "Public can read active venue setup types" on site.venue_setup_types
for select to anon, authenticated using (is_active = true);
drop policy if exists "Active admins can read all venue setup types" on site.venue_setup_types;
create policy "Active admins can read all venue setup types" on site.venue_setup_types
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert venue setup types" on site.venue_setup_types;
create policy "Active admins can insert venue setup types" on site.venue_setup_types
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update venue setup types" on site.venue_setup_types;
create policy "Active admins can update venue setup types" on site.venue_setup_types
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active venue setup links" on site.venue_setup_links;
create policy "Public can read active venue setup links" on site.venue_setup_links
for select to anon, authenticated using (
  is_active = true
  and exists (select 1 from site.venues v where v.id = venue_id and v.is_active = true)
  and exists (select 1 from site.venue_setup_types s where s.id = setup_type_id and s.is_active = true)
);
drop policy if exists "Active admins can read all venue setup links" on site.venue_setup_links;
create policy "Active admins can read all venue setup links" on site.venue_setup_links
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert venue setup links" on site.venue_setup_links;
create policy "Active admins can insert venue setup links" on site.venue_setup_links
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update venue setup links" on site.venue_setup_links;
create policy "Active admins can update venue setup links" on site.venue_setup_links
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());
