-- Script manuel pour les galeries d'usages des salles.
-- Ne pas executer via supabase db push.
-- A executer manuellement dans le SQL Editor Supabase si les policies Storage manquent.
-- Verifier le bucket site-news et le prefixe venue-uses/ avant execution.

begin;

drop policy if exists "Active admins can select venue use storage"
on storage.objects;

create policy "Active admins can select venue use storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'venue-uses/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can insert venue use storage"
on storage.objects;

create policy "Active admins can insert venue use storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-news'
  and name like 'venue-uses/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can update venue use storage"
on storage.objects;

create policy "Active admins can update venue use storage"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'venue-uses/%'
  and (select site.is_active_admin())
)
with check (
  bucket_id = 'site-news'
  and name like 'venue-uses/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can delete venue use storage"
on storage.objects;

create policy "Active admins can delete venue use storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'venue-uses/%'
  and (select site.is_active_admin())
);

commit;

-- Apres execution :
-- 1. tester l'upload direct d'une image d'usage de salle ;
-- 2. tester la suppression d'une image d'usage ;
-- 3. tester la suppression complete d'une salle avec usages ;
-- 4. verifier le bucket Storage site-news/venue-uses/ ;
-- 5. conserver les policies publiques existantes de lecture du bucket.
