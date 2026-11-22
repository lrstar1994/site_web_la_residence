-- Apply manually only after the home_hero_images migration.
-- This script does not create or modify the existing site-news bucket.

begin;

grant execute on function site.has_active_admin_role() to authenticated;

-- Public delivery is compatible with the existing public site-news bucket.
-- This policy governs SQL SELECT on storage.objects; direct public object URLs
-- remain reachable because the bucket itself is public.
drop policy if exists "Public can read home hero images"
on storage.objects;

create policy "Public can read home hero images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'site-news'
  and name like 'home-hero/%'
);

-- Exact-prefix permissive policies let the feature work even when the broader
-- historical site-news write policies are absent in a given environment.
drop policy if exists "Admins can upload home hero images"
on storage.objects;

create policy "Admins can upload home hero images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-news'
  and name ~ '^home-hero/[a-z0-9][a-z0-9._-]*\.webp$'
  and position('..' in name) = 0
  and (select site.has_active_admin_role())
);

drop policy if exists "Admins can update home hero images"
on storage.objects;

create policy "Admins can update home hero images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-news'
  and name ~ '^home-hero/[a-z0-9][a-z0-9._-]*\.webp$'
  and position('..' in name) = 0
  and (select site.has_active_admin_role())
)
with check (
  bucket_id = 'site-news'
  and name ~ '^home-hero/[a-z0-9][a-z0-9._-]*\.webp$'
  and position('..' in name) = 0
  and (select site.has_active_admin_role())
);

drop policy if exists "Admins can delete home hero images"
on storage.objects;

create policy "Admins can delete home hero images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'home-hero/%'
  and (select site.has_active_admin_role())
);

-- Existing permissive policies use site.is_active_admin(), which also accepts
-- editors. Restrictive policies below add an admin-only fence for this prefix
-- without changing permissions for any other site-news path.
drop policy if exists "Home hero inserts require admin role"
on storage.objects;

create policy "Home hero inserts require admin role"
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id <> 'site-news'
  or name not like 'home-hero/%'
  or (select site.has_active_admin_role())
);

drop policy if exists "Home hero updates require admin role"
on storage.objects;

create policy "Home hero updates require admin role"
on storage.objects
as restrictive
for update
to authenticated
using (
  bucket_id <> 'site-news'
  or name not like 'home-hero/%'
  or (select site.has_active_admin_role())
)
with check (
  bucket_id <> 'site-news'
  or name not like 'home-hero/%'
  or (select site.has_active_admin_role())
);

drop policy if exists "Home hero deletes require admin role"
on storage.objects;

create policy "Home hero deletes require admin role"
on storage.objects
as restrictive
for delete
to authenticated
using (
  bucket_id <> 'site-news'
  or name not like 'home-hero/%'
  or (select site.has_active_admin_role())
);

commit;
