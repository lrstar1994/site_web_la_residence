-- Script manuel pour l'upload direct des images Restaurant.
-- Ne pas executer via supabase db push.
-- A executer manuellement dans le SQL Editor Supabase si la suppression Storage
-- des fichiers restaurant-menus/% est refusee par les politiques actuelles.
-- Verifier le bucket site-news et le prefixe restaurant-menus/ avant execution.

begin;

grant usage on schema site to authenticated;

drop policy if exists "Active admins can delete restaurant storage"
on storage.objects;

create policy "Active admins can delete restaurant storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'restaurant-menus/%'
  and (select site.is_active_admin())
);

commit;

-- Apres execution :
-- 1. tester la creation d'une carte Restaurant avec image ;
-- 2. tester la modification avec remplacement d'image ;
-- 3. tester l'echec d'enregistrement apres upload ;
-- 4. verifier que le fichier orphelin est supprime du bucket site-news.
