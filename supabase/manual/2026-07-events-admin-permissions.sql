-- Script manuel pour le module Evenements.
-- Ne pas executer via supabase db push.
-- A executer manuellement dans le SQL Editor Supabase.
-- Verifier la table site.event_services, le bucket site-news et le prefixe event-services/ avant execution.

begin;

grant usage on schema site to authenticated;

grant select, insert, update, delete
on table site.event_services
to authenticated;

alter table site.event_services
enable row level security;

drop policy if exists "Active admins can read all event services"
on site.event_services;

create policy "Active admins can read all event services"
on site.event_services
for select
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can insert event services"
on site.event_services;

create policy "Active admins can insert event services"
on site.event_services
for insert
to authenticated
with check (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can update event services"
on site.event_services;

create policy "Active admins can update event services"
on site.event_services
for update
to authenticated
using (
  (select site.is_active_admin())
)
with check (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can delete event services"
on site.event_services;

create policy "Active admins can delete event services"
on site.event_services
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can select event service storage"
on storage.objects;

create policy "Active admins can select event service storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'event-services/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can insert event service storage"
on storage.objects;

create policy "Active admins can insert event service storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-news'
  and name like 'event-services/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can update event service storage"
on storage.objects;

create policy "Active admins can update event service storage"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'event-services/%'
  and (select site.is_active_admin())
)
with check (
  bucket_id = 'site-news'
  and name like 'event-services/%'
  and (select site.is_active_admin())
);

drop policy if exists "Active admins can delete event service storage"
on storage.objects;

create policy "Active admins can delete event service storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-news'
  and name like 'event-services/%'
  and (select site.is_active_admin())
);

commit;

-- Apres execution :
-- 1. tester le remplacement d'image d'une prestation ;
-- 2. tester la suppression complete d'une prestation ;
-- 3. verifier le bucket Storage site-news/event-services/ ;
-- 4. verifier que les prestations actives restent lisibles publiquement.
