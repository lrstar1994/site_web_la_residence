begin;

create or replace function site.has_active_admin_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from site.admin_users
    where user_id = auth.uid()
      and is_active = true
      and role = 'admin'
  );
$$;

revoke all on function site.has_active_admin_role() from public;
grant execute on function site.has_active_admin_role() to authenticated;

create table site.home_hero_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  alt_fr text,
  alt_en text,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint home_hero_images_path_not_empty
    check (char_length(trim(image_path)) > 0),
  constraint home_hero_images_path_prefix
    check (
      image_path ~ '^home-hero/[a-z0-9][a-z0-9._-]*\.webp$'
      and position('..' in image_path) = 0
    ),
  constraint home_hero_images_path_unique unique (image_path),
  constraint home_hero_images_sort_order_non_negative
    check (sort_order >= 0),
  constraint home_hero_images_sort_order_unique
    unique (sort_order) deferrable initially deferred,
  constraint home_hero_images_active_alt_required
    check (
      not is_active
      or (
        char_length(trim(coalesce(alt_fr, ''))) > 0
        and char_length(trim(coalesce(alt_en, ''))) > 0
      )
    )
);

create or replace function site.lock_home_hero_images_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- This statement-level trigger runs before row locks are acquired. Every
  -- INSERT, UPDATE, DELETE and reorder operation therefore follows the same
  -- lock order: table DML lock, advisory lock, then row locks.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('site.home_hero_images:mutations', 0)
  );

  return null;
end;
$$;

revoke all on function site.lock_home_hero_images_mutation() from public;

create trigger home_hero_images_lock_mutation
before insert or update or delete on site.home_hero_images
for each statement
execute function site.lock_home_hero_images_mutation();

create or replace function site.prepare_home_hero_image_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  -- The statement-level trigger already holds the common mutation lock.

  select pg_catalog.count(*)
  into current_count
  from site.home_hero_images;

  if current_count >= 6 then
    raise exception using
      errcode = '23514',
      message = 'home_hero_images cannot contain more than 6 rows';
  end if;

  if new.sort_order is null or new.sort_order <= 0 then
    select coalesce(pg_catalog.max(sort_order), 0) + 10
    into new.sort_order
    from site.home_hero_images;
  end if;

  return new;
end;
$$;

revoke all on function site.prepare_home_hero_image_insert() from public;

create trigger home_hero_images_prepare_insert
before insert on site.home_hero_images
for each row
execute function site.prepare_home_hero_image_insert();

create or replace function site.enforce_home_hero_images_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  -- This statement-level check also protects multi-row INSERT statements.
  select pg_catalog.count(*)
  into current_count
  from site.home_hero_images;

  if current_count > 6 then
    raise exception using
      errcode = '23514',
      message = 'home_hero_images cannot contain more than 6 rows';
  end if;

  return null;
end;
$$;

revoke all on function site.enforce_home_hero_images_limit() from public;

create trigger home_hero_images_enforce_limit
after insert on site.home_hero_images
for each statement
execute function site.enforce_home_hero_images_limit();

create trigger home_hero_images_set_updated_at
before update on site.home_hero_images
for each row
execute function site.set_updated_at();

create or replace function site.reorder_home_hero_images(ordered_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_count integer;
  supplied_count integer;
  distinct_count integer;
begin
  if not site.has_active_admin_role() then
    raise exception using
      errcode = '42501',
      message = 'Only active administrators can reorder home hero images';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('site.home_hero_images:mutations', 0)
  );

  select pg_catalog.count(*) into stored_count
  from site.home_hero_images;

  supplied_count := coalesce(pg_catalog.cardinality(ordered_ids), 0);

  select pg_catalog.count(distinct image_id)
  into distinct_count
  from pg_catalog.unnest(coalesce(ordered_ids, array[]::uuid[])) as image_id;

  if supplied_count <> stored_count or distinct_count <> stored_count then
    raise exception using
      errcode = '22023',
      message = 'The complete image list must be supplied exactly once';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(ordered_ids) as requested(image_id)
    left join site.home_hero_images stored on stored.id = requested.image_id
    where stored.id is null
  ) then
    raise exception using
      errcode = '22023',
      message = 'The image list contains an unknown identifier';
  end if;

  update site.home_hero_images as image
  set sort_order = ordering.position * 10
  from pg_catalog.unnest(ordered_ids) with ordinality as ordering(image_id, position)
  where image.id = ordering.image_id;
end;
$$;

revoke all on function site.reorder_home_hero_images(uuid[]) from public;
grant execute on function site.reorder_home_hero_images(uuid[]) to authenticated;

create index home_hero_images_public_order_idx
on site.home_hero_images (sort_order, created_at, id)
where is_active = true;

alter table site.home_hero_images enable row level security;

grant select on site.home_hero_images to anon, authenticated;
grant insert, update, delete on site.home_hero_images to authenticated;

create policy "Public can read active home hero images"
on site.home_hero_images
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can read all home hero images"
on site.home_hero_images
for select
to authenticated
using ((select site.has_active_admin_role()));

create policy "Admins can insert home hero images"
on site.home_hero_images
for insert
to authenticated
with check ((select site.has_active_admin_role()));

create policy "Admins can update home hero images"
on site.home_hero_images
for update
to authenticated
using ((select site.has_active_admin_role()))
with check ((select site.has_active_admin_role()));

create policy "Admins can delete home hero images"
on site.home_hero_images
for delete
to authenticated
using ((select site.has_active_admin_role()));

commit;
