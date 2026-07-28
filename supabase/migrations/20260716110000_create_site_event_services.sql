create schema if not exists site;

create table if not exists site.event_services (
  id uuid primary key default gen_random_uuid(),
  code varchar(100) not null unique,
  title_fr varchar(200) not null,
  title_en varchar(200) not null,
  description_fr text not null,
  description_en text not null,
  image_path text not null,
  image_alt_fr varchar(250) not null,
  image_alt_en varchar(250) not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_services_code_not_empty check (char_length(trim(code)) >= 2),
  constraint event_services_title_fr_not_empty check (char_length(trim(title_fr)) >= 3),
  constraint event_services_title_en_not_empty check (char_length(trim(title_en)) >= 3),
  constraint event_services_description_fr_not_empty check (char_length(trim(description_fr)) > 0),
  constraint event_services_description_en_not_empty check (char_length(trim(description_en)) > 0),
  constraint event_services_image_path_not_empty check (char_length(trim(image_path)) > 0),
  constraint event_services_image_alt_fr_not_empty check (char_length(trim(image_alt_fr)) > 0),
  constraint event_services_image_alt_en_not_empty check (char_length(trim(image_alt_en)) > 0),
  constraint event_services_sort_order_positive check (sort_order >= 0)
);

drop trigger if exists event_services_set_updated_at on site.event_services;
create trigger event_services_set_updated_at
before update on site.event_services
for each row
execute function site.set_updated_at();

create index if not exists event_services_active_sort_idx
on site.event_services (is_active, sort_order);

alter table site.event_services enable row level security;

grant select on site.event_services to anon, authenticated;
grant insert, update on site.event_services to authenticated;
grant all privileges on table site.event_services to service_role;

drop policy if exists "Public can read active event services" on site.event_services;
create policy "Public can read active event services"
on site.event_services
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Active admins can read all event services" on site.event_services;
create policy "Active admins can read all event services"
on site.event_services
for select
to authenticated
using (site.is_active_admin());

drop policy if exists "Active admins can insert event services" on site.event_services;
create policy "Active admins can insert event services"
on site.event_services
for insert
to authenticated
with check (site.is_active_admin());

drop policy if exists "Active admins can update event services" on site.event_services;
create policy "Active admins can update event services"
on site.event_services
for update
to authenticated
using (site.is_active_admin())
with check (site.is_active_admin());
