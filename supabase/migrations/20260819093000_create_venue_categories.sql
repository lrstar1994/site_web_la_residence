begin;

create table if not exists site.venue_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_fr text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into site.venue_categories (
  code,
  name_fr,
  name_en,
  sort_order,
  is_active
)
values
  (
    'seminar',
    'Salle de séminaire',
    'Seminar venue',
    10,
    true
  ),
  (
    'reception',
    'Salle de réception',
    'Reception venue',
    20,
    true
  )
on conflict (code) do update
set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

alter table site.venues
  add column if not exists category_id uuid;

alter table site.venues
  drop constraint if exists venues_category_id_fkey;

alter table site.venues
  add constraint venues_category_id_fkey
  foreign key (category_id)
  references site.venue_categories(id)
  on delete restrict;

create index if not exists venues_category_id_idx
  on site.venues(category_id);

alter table site.venue_categories
  enable row level security;

grant select
on site.venue_categories
to anon, authenticated;

grant select, insert, update, delete
on site.venue_categories
to authenticated;

drop policy if exists "Public can read active venue categories"
on site.venue_categories;

create policy "Public can read active venue categories"
on site.venue_categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Active admins can manage venue categories"
on site.venue_categories;

create policy "Active admins can manage venue categories"
on site.venue_categories
for all
to authenticated
using ((select site.is_active_admin()))
with check ((select site.is_active_admin()));

commit;