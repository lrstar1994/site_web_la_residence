-- Script manuel transversal pour les uploads directs d'images depuis le backoffice.
-- Ne pas executer via supabase db push.
-- A executer manuellement dans le SQL Editor Supabase si les politiques Storage
-- actuelles ne couvrent pas les uploads/suppressions admin des prefixes ci-dessous.
-- Conserve la lecture publique existante du bucket site-news.

begin;

grant usage on schema site to authenticated;

drop policy if exists "Active admins can insert direct image uploads"
on storage.objects;

create policy "Active admins can insert direct image uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-news'
  and (
    name like 'restaurant-menus/%'
    or name like 'accommodations/%'
    or name like 'venues/%'
    or name like 'event-services/%'
    or name like 'articles/%'
  )
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can delete direct image uploads"
on storage.objects;

create policy "Active admins can delete direct image uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-news'
  and (
    name like 'restaurant-menus/%'
    or name like 'accommodations/%'
    or name like 'venues/%'
    or name like 'event-services/%'
    or name like 'articles/%'
  )
  and (select site.is_active_admin())
);

commit;

-- Notes :
-- Les scripts manuels plus specifiques existants restent redondants pour certains prefixes
-- s'ils creent deja des politiques INSERT/DELETE equivalentes :
-- - 2026-07-events-admin-permissions.sql pour event-services/ ;
-- - 2026-07-hebergement-admin-permissions.sql pour accommodations/ ;
-- - 2026-07-salles-admin-permissions.sql pour venues/ ;
-- - 2026-08-restaurant-storage-direct-upload.sql pour restaurant-menus/.
-- Ce fichier regroupe la politique transversale pour les cinq prefixes utilises.
