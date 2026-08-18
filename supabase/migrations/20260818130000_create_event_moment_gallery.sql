create table if not exists site.event_moment_images (
  id uuid primary key default gen_random_uuid(),

  image_path text not null,

  alt_fr text,
  alt_en text,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_moment_images_sort_order_idx
  on site.event_moment_images (sort_order);

create index if not exists event_moment_images_active_sort_idx
  on site.event_moment_images (is_active, sort_order);

create trigger set_event_moment_images_updated_at
before update on site.event_moment_images
for each row
execute function site.set_updated_at();


create trigger set_event_moment_images_sort_order
before insert on site.event_moment_images
for each row
when (
  new.sort_order is null
  or new.sort_order <= 0
)
execute function site.set_next_sort_order();

alter table site.event_moment_images enable row level security;
create policy event_moment_images_public_read
on site.event_moment_images
for select
to anon, authenticated
using (is_active = true);

create policy event_moment_images_admin_read
on site.event_moment_images
for select
to authenticated
using (site.is_active_admin());

create policy event_moment_images_admin_insert
on site.event_moment_images
for insert
to authenticated
with check (site.is_active_admin());

create policy event_moment_images_admin_update
on site.event_moment_images
for update
to authenticated
using (site.is_active_admin())
with check (site.is_active_admin());

create policy event_moment_images_admin_delete
on site.event_moment_images
for delete
to authenticated
using (site.is_active_admin());

grant select on site.event_moment_images to anon;
grant select, insert, update, delete
on site.event_moment_images
to authenticated;