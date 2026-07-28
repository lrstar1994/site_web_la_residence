create schema if not exists site;

insert into storage.buckets (id, name, public)
values ('site-news', 'site-news', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can read site news images" on storage.objects;
create policy "Public can read site news images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-news');

drop policy if exists "Active admins can upload site news images" on storage.objects;
create policy "Active admins can upload site news images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-news'
  and site.is_active_admin()
);

drop policy if exists "Active admins can update site news images" on storage.objects;
create policy "Active admins can update site news images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-news'
  and site.is_active_admin()
)
with check (
  bucket_id = 'site-news'
  and site.is_active_admin()
);
