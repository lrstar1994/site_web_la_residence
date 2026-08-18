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
    or name like 'event-moments/%'
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
    or name like 'event-moments/%'
  )
  and (select site.is_active_admin())
);

commit;