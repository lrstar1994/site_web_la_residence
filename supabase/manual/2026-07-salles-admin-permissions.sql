-- Script manuel pour le module Salles.
-- Ne pas executer via supabase db push.
-- A executer manuellement dans le SQL Editor Supabase.
-- Verifier les noms de tables, le bucket et le prefixe Storage avant execution.

begin;

grant usage on schema site to authenticated;

grant select, insert, update, delete
on table site.venues
to authenticated;

grant select, insert, update, delete
on table site.venue_images
to authenticated;

alter table site.venues
enable row level security;

alter table site.venue_images
enable row level security;

drop policy if exists "Active admins can select venues"
on site.venues;

create policy "Active admins can select venues"
on site.venues
for select
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can insert venues"
on site.venues;

create policy "Active admins can insert venues"
on site.venues
for insert
to authenticated
with check (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can update venues"
on site.venues;

create policy "Active admins can update venues"
on site.venues
for update
to authenticated
using (
  (select site.is_active_admin())
)
with check (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can delete venues"
on site.venues;

create policy "Active admins can delete venues"
on site.venues
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can select venue images"
on site.venue_images;

create policy "Active admins can select venue images"
on site.venue_images
for select
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can insert venue images"
on site.venue_images;

create policy "Active admins can insert venue images"
on site.venue_images
for insert
to authenticated
with check (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can update venue images"
on site.venue_images;

create policy "Active admins can update venue images"
on site.venue_images
for update
to authenticated
using (
  (select site.is_active_admin())
)
with check (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can delete venue images"
on site.venue_images;

create policy "Active admins can delete venue images"
on site.venue_images
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can select venue storage"
on storage.objects;

create policy "Active admins can select venue storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'venues/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can insert venue storage"
on storage.objects;

create policy "Active admins can insert venue storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-news'
  and name like 'venues/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can update venue storage"
on storage.objects;

create policy "Active admins can update venue storage"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'venues/%'
  and (select site.is_active_admin())
)
with check (
  bucket_id = 'site-news'
  and name like 'venues/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can delete venue storage"
on storage.objects;

create policy "Active admins can delete venue storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'venues/%'
  and (select site.is_active_admin())
);

commit;

-- Apres execution :
-- 1. tester la creation d'une salle ;
-- 2. tester l'ajout multi-images ;
-- 3. tester la suppression d'une image ;
-- 4. tester la suppression complete d'une salle ;
-- 5. verifier le bucket Storage.
