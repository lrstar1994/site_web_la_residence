-- Script manuel pour le module Hebergements.
-- Ne pas executer via supabase db push.
-- A executer manuellement dans le SQL Editor Supabase.
-- Verifier les tables site.accommodations, site.accommodation_images,
-- le bucket site-news et le prefixe accommodations/ avant execution.

begin;

grant usage on schema site to authenticated;

grant select, insert, update, delete
on table site.accommodations
to authenticated;

grant select, insert, update, delete
on table site.accommodation_images
to authenticated;

grant select, insert, update, delete
on table site.accommodation_feature_links
to authenticated;

alter table site.accommodations enable row level security;
alter table site.accommodation_images enable row level security;
alter table site.accommodation_feature_links enable row level security;

drop policy if exists "Active admins can delete accommodations"
on site.accommodations;

create policy "Active admins can delete accommodations"
on site.accommodations
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can delete accommodation images"
on site.accommodation_images;

create policy "Active admins can delete accommodation images"
on site.accommodation_images
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can delete accommodation feature links"
on site.accommodation_feature_links;

create policy "Active admins can delete accommodation feature links"
on site.accommodation_feature_links
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can select accommodation storage"
on storage.objects;

create policy "Active admins can select accommodation storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'accommodations/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can insert accommodation storage"
on storage.objects;

create policy "Active admins can insert accommodation storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-news'
  and name like 'accommodations/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can update accommodation storage"
on storage.objects;

create policy "Active admins can update accommodation storage"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'accommodations/%'
  and (select site.is_active_admin())
)
with check (
  bucket_id = 'site-news'
  and name like 'accommodations/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can delete accommodation storage"
on storage.objects;

create policy "Active admins can delete accommodation storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'accommodations/%'
  and (select site.is_active_admin())
);

commit;

-- Apres execution :
-- 1. tester la creation d'un hebergement avec plusieurs images ;
-- 2. tester la suppression d'une image existante ;
-- 3. tester la suppression complete d'un hebergement ;
-- 4. verifier le bucket Storage site-news/accommodations/ ;
-- 5. verifier que les hebergements actifs restent lisibles publiquement.
