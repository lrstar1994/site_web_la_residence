-- Script manuel pour fiabiliser la suppression definitive des prestations Evenements.
-- Ne pas executer via supabase db push.
-- A executer manuellement dans le SQL Editor Supabase si les droits DELETE/SELECT manquent.
-- Ce script ne supprime aucune donnee.

begin;

grant usage on schema site to authenticated;

grant delete on table site.event_services to authenticated;
grant select, delete on table site.event_service_images to authenticated;
grant select, delete on table site.event_quote_fields to authenticated;
grant select on table site.event_quote_requests to authenticated;

alter table site.event_services enable row level security;
alter table site.event_service_images enable row level security;
alter table site.event_quote_fields enable row level security;
alter table site.event_quote_requests enable row level security;

drop policy if exists "Active admins can delete event services"
on site.event_services;

create policy "Active admins can delete event services"
on site.event_services
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can delete event service images"
on site.event_service_images;

create policy "Active admins can delete event service images"
on site.event_service_images
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can read all event service images"
on site.event_service_images;

create policy "Active admins can read all event service images"
on site.event_service_images
for select
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can delete event quote fields"
on site.event_quote_fields;

create policy "Active admins can delete event quote fields"
on site.event_quote_fields
for delete
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can read all event quote fields"
on site.event_quote_fields;

create policy "Active admins can read all event quote fields"
on site.event_quote_fields
for select
to authenticated
using (
  (select site.is_active_admin())
);

drop policy if exists "Active admins can read event quote requests"
on site.event_quote_requests;

create policy "Active admins can read event quote requests"
on site.event_quote_requests
for select
to authenticated
using (
  (select site.is_active_admin())
);

commit;

-- Verification utile avant execution :
-- select
--   tc.table_schema,
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_schema as foreign_table_schema,
--   ccu.table_name as foreign_table_name,
--   ccu.column_name as foreign_column_name,
--   rc.delete_rule
-- from information_schema.table_constraints tc
-- join information_schema.key_column_usage kcu
--   on tc.constraint_name = kcu.constraint_name
--  and tc.constraint_schema = kcu.constraint_schema
-- join information_schema.constraint_column_usage ccu
--   on ccu.constraint_name = tc.constraint_name
--  and ccu.constraint_schema = tc.constraint_schema
-- join information_schema.referential_constraints rc
--   on rc.constraint_name = tc.constraint_name
--  and rc.constraint_schema = tc.constraint_schema
-- where tc.constraint_type = 'FOREIGN KEY'
--   and ccu.table_schema = 'site'
--   and ccu.table_name = 'event_services';

-- Apres execution :
-- 1. tester la suppression d'une prestation sans demande de devis ;
-- 2. tester le blocage d'une prestation avec demandes de devis ;
-- 3. verifier que les demandes de devis historiques ne sont pas supprimees ;
-- 4. verifier que les champs dynamiques et images de la prestation sont supprimes.
