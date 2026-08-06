begin;

create table if not exists site.venue_use_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_fr text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_use_types_code_not_empty check (char_length(trim(code)) >= 2),
  constraint venue_use_types_name_fr_not_empty check (char_length(trim(name_fr)) >= 2),
  constraint venue_use_types_name_en_not_empty check (char_length(trim(name_en)) >= 2),
  constraint venue_use_types_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.venue_use_presentations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references site.venues(id) on update cascade on delete cascade,
  use_type_id uuid not null references site.venue_use_types(id) on update cascade on delete restrict,
  title_fr text not null,
  title_en text not null,
  description_fr text not null,
  description_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_use_presentations_unique_use unique (venue_id, use_type_id),
  constraint venue_use_presentations_title_fr_not_empty check (char_length(trim(title_fr)) >= 2),
  constraint venue_use_presentations_title_en_not_empty check (char_length(trim(title_en)) >= 2),
  constraint venue_use_presentations_description_fr_not_empty check (char_length(trim(description_fr)) > 0),
  constraint venue_use_presentations_description_en_not_empty check (char_length(trim(description_en)) > 0),
  constraint venue_use_presentations_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.venue_use_images (
  id uuid primary key default gen_random_uuid(),
  venue_use_presentation_id uuid not null references site.venue_use_presentations(id) on update cascade on delete cascade,
  image_path text not null,
  alt_fr text,
  alt_en text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_use_images_path_not_empty check (char_length(trim(image_path)) > 0),
  constraint venue_use_images_sort_order_positive check (sort_order >= 0)
);

drop trigger if exists venue_use_types_set_updated_at on site.venue_use_types;
create trigger venue_use_types_set_updated_at before update on site.venue_use_types
for each row execute function site.set_updated_at();

drop trigger if exists venue_use_presentations_set_updated_at on site.venue_use_presentations;
create trigger venue_use_presentations_set_updated_at before update on site.venue_use_presentations
for each row execute function site.set_updated_at();

drop trigger if exists venue_use_images_set_updated_at on site.venue_use_images;
create trigger venue_use_images_set_updated_at before update on site.venue_use_images
for each row execute function site.set_updated_at();

drop trigger if exists venue_use_types_set_next_sort_order on site.venue_use_types;
create trigger venue_use_types_set_next_sort_order before insert on site.venue_use_types
for each row execute function site.set_next_sort_order();

drop trigger if exists venue_use_presentations_set_next_sort_order on site.venue_use_presentations;
create trigger venue_use_presentations_set_next_sort_order before insert on site.venue_use_presentations
for each row execute function site.set_next_sort_order();

drop trigger if exists venue_use_images_set_next_sort_order on site.venue_use_images;
create trigger venue_use_images_set_next_sort_order before insert on site.venue_use_images
for each row execute function site.set_next_sort_order();

create index if not exists venue_use_types_active_sort_idx
on site.venue_use_types (is_active, sort_order);

create index if not exists venue_use_presentations_venue_sort_idx
on site.venue_use_presentations (venue_id, is_active, sort_order);

create index if not exists venue_use_presentations_use_type_idx
on site.venue_use_presentations (use_type_id);

create index if not exists venue_use_images_presentation_sort_idx
on site.venue_use_images (venue_use_presentation_id, is_active, sort_order);

create unique index if not exists venue_use_images_one_active_cover_idx
on site.venue_use_images (venue_use_presentation_id)
where is_cover and is_active;

create unique index if not exists venue_use_images_unique_path_idx
on site.venue_use_images (venue_use_presentation_id, image_path);

alter table site.venue_use_types enable row level security;
alter table site.venue_use_presentations enable row level security;
alter table site.venue_use_images enable row level security;

grant select on site.venue_use_types, site.venue_use_presentations, site.venue_use_images to anon, authenticated;
grant insert, update, delete on site.venue_use_types, site.venue_use_presentations, site.venue_use_images to authenticated;
grant all privileges on site.venue_use_types, site.venue_use_presentations, site.venue_use_images to service_role;

drop policy if exists "Public can view active venue use types" on site.venue_use_types;
create policy "Public can view active venue use types"
on site.venue_use_types
for select
to anon, authenticated
using (is_active);

drop policy if exists "Public can view active venue use presentations" on site.venue_use_presentations;
create policy "Public can view active venue use presentations"
on site.venue_use_presentations
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from site.venues v
    join site.venue_use_types t on t.id = venue_use_presentations.use_type_id
    where v.id = venue_use_presentations.venue_id
      and v.is_active
      and t.is_active
  )
);

drop policy if exists "Public can view active venue use images" on site.venue_use_images;
create policy "Public can view active venue use images"
on site.venue_use_images
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from site.venue_use_presentations p
    join site.venues v on v.id = p.venue_id
    join site.venue_use_types t on t.id = p.use_type_id
    where p.id = venue_use_images.venue_use_presentation_id
      and p.is_active
      and v.is_active
      and t.is_active
  )
);

drop policy if exists "Active admins can manage venue use types" on site.venue_use_types;
create policy "Active admins can manage venue use types"
on site.venue_use_types
for all
to authenticated
using ((select site.is_active_admin()))
with check ((select site.is_active_admin()));

drop policy if exists "Active admins can manage venue use presentations" on site.venue_use_presentations;
create policy "Active admins can manage venue use presentations"
on site.venue_use_presentations
for all
to authenticated
using ((select site.is_active_admin()))
with check ((select site.is_active_admin()));

drop policy if exists "Active admins can manage venue use images" on site.venue_use_images;
create policy "Active admins can manage venue use images"
on site.venue_use_images
for all
to authenticated
using ((select site.is_active_admin()))
with check ((select site.is_active_admin()));

insert into site.venue_use_types (code, name_fr, name_en, sort_order, is_active)
values
  ('professional', 'Événements professionnels', 'Professional events', 10, true),
  ('private-festive', 'Événements privés et festifs', 'Private and festive events', 20, true)
on conflict (code) do update
set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

commit;
