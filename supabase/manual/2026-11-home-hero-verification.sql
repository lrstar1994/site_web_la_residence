-- Read-only checks to run after deploying the migration and Storage policies.
-- This file intentionally contains no INSERT, UPDATE, DELETE or DDL statement.

-- 1. Table columns and defaults.
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'site'
  and table_name = 'home_hero_images'
order by ordinal_position;

-- 2. Constraints, indexes and triggers.
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'site.home_hero_images'::regclass
order by conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'site'
  and tablename = 'home_hero_images'
order by indexname;

select trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'site'
  and event_object_table = 'home_hero_images'
order by trigger_name;

-- 3. Table policies and the complete Storage policy inventory. The full
-- storage.objects inventory is intentional: broad historical policies can
-- combine with the feature-specific permissive and restrictive policies.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'site' and tablename = 'home_hero_images')
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- 4. Function security and execution privileges.
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'site'
  and p.proname in (
    'has_active_admin_role',
    'lock_home_hero_images_mutation',
    'prepare_home_hero_image_insert',
    'enforce_home_hero_images_limit',
    'reorder_home_hero_images'
  )
order by p.proname;

select
  routine_schema,
  routine_name,
  specific_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'site'
  and routine_name in (
    'has_active_admin_role',
    'lock_home_hero_images_mutation',
    'prepare_home_hero_image_insert',
    'enforce_home_hero_images_limit',
    'reorder_home_hero_images'
  )
order by routine_name, grantee, privilege_type;

select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'site'
  and table_name = 'home_hero_images'
order by grantee, privilege_type;

-- 5. Existing bucket configuration. This must return one public site-news row.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'site-news';

-- 6. Invariant checks: every anomaly query must return zero rows.
select count(*) as total_count
from site.home_hero_images;

select count(*) as invalid_total_count
from site.home_hero_images
having count(*) > 6;

select id, image_path
from site.home_hero_images
where image_path !~ '^home-hero/[a-z0-9][a-z0-9._-]*\.webp$'
   or position('..' in image_path) > 0;

select id, image_path, alt_fr, alt_en
from site.home_hero_images
where is_active = true
  and (
    char_length(trim(coalesce(alt_fr, ''))) = 0
    or char_length(trim(coalesce(alt_en, ''))) = 0
  );

select sort_order, count(*) as duplicate_count
from site.home_hero_images
group by sort_order
having count(*) > 1;

-- 7. SQL rows whose Storage object is missing. Run with a privileged SQL
-- Editor session so storage.objects RLS cannot hide missing/present objects.
select h.id, h.image_path
from site.home_hero_images h
left join storage.objects o
  on o.bucket_id = 'site-news'
 and o.name = h.image_path
where o.id is null;

-- 8. Storage objects under home-hero/ with no SQL reference. This also
-- requires a privileged SQL Editor session for a complete result.
select o.id, o.name, o.created_at
from storage.objects o
left join site.home_hero_images h on h.image_path = o.name
where o.bucket_id = 'site-news'
  and o.name like 'home-hero/%'
  and h.id is null
order by o.created_at;

-- 9. Run this while authenticated as each test account. It must return true
-- only for an active account whose site.admin_users.role is exactly 'admin'.
select site.has_active_admin_role() as has_active_admin_role;
