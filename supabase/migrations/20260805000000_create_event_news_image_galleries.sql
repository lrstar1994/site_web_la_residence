begin;

create table if not exists site.event_service_images (
  id uuid primary key default gen_random_uuid(),
  event_service_id uuid not null references site.event_services(id) on update cascade on delete cascade,
  image_path text not null,
  alt_fr text,
  alt_en text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_service_images_path_not_empty check (char_length(trim(image_path)) > 0),
  constraint event_service_images_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.news_article_images (
  id uuid primary key default gen_random_uuid(),
  news_article_id uuid not null references site.news_articles(id) on update cascade on delete cascade,
  image_path text not null,
  alt_fr text,
  alt_en text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_article_images_path_not_empty check (char_length(trim(image_path)) > 0),
  constraint news_article_images_sort_order_positive check (sort_order >= 0)
);

drop trigger if exists event_service_images_set_updated_at on site.event_service_images;
create trigger event_service_images_set_updated_at
before update on site.event_service_images
for each row execute function site.set_updated_at();

drop trigger if exists news_article_images_set_updated_at on site.news_article_images;
create trigger news_article_images_set_updated_at
before update on site.news_article_images
for each row execute function site.set_updated_at();

create unique index if not exists event_service_images_parent_path_uidx
on site.event_service_images (event_service_id, image_path);

create unique index if not exists news_article_images_parent_path_uidx
on site.news_article_images (news_article_id, image_path);

create unique index if not exists event_service_images_one_cover_uidx
on site.event_service_images (event_service_id)
where is_cover and is_active;

create unique index if not exists news_article_images_one_cover_uidx
on site.news_article_images (news_article_id)
where is_cover and is_active;

create index if not exists event_service_images_active_sort_idx
on site.event_service_images (event_service_id, is_active, sort_order);

create index if not exists news_article_images_active_sort_idx
on site.news_article_images (news_article_id, is_active, sort_order);

alter table site.event_service_images enable row level security;
alter table site.news_article_images enable row level security;

grant select on site.event_service_images to anon, authenticated;
grant select on site.news_article_images to anon, authenticated;
grant insert, update, delete on site.event_service_images to authenticated;
grant insert, update, delete on site.news_article_images to authenticated;
grant delete on site.news_articles to authenticated;
grant all privileges on table site.event_service_images to service_role;
grant all privileges on table site.news_article_images to service_role;

drop policy if exists "Public can read active event service images"
on site.event_service_images;

create policy "Public can read active event service images"
on site.event_service_images
for select
using (
  is_active
  and exists (
    select 1
    from site.event_services service
    where service.id = event_service_id
      and service.is_active
  )
);

drop policy if exists "Active admins can read all event service images"
on site.event_service_images;

create policy "Active admins can read all event service images"
on site.event_service_images
for select
to authenticated
using (site.is_active_admin());

drop policy if exists "Active admins can insert event service images"
on site.event_service_images;

create policy "Active admins can insert event service images"
on site.event_service_images
for insert
to authenticated
with check (site.is_active_admin());

drop policy if exists "Active admins can update event service images"
on site.event_service_images;

create policy "Active admins can update event service images"
on site.event_service_images
for update
to authenticated
using (site.is_active_admin())
with check (site.is_active_admin());

drop policy if exists "Active admins can delete event service images"
on site.event_service_images;

create policy "Active admins can delete event service images"
on site.event_service_images
for delete
to authenticated
using (site.is_active_admin());

drop policy if exists "Public can read active news article images"
on site.news_article_images;

create policy "Public can read active news article images"
on site.news_article_images
for select
using (
  is_active
  and exists (
    select 1
    from site.news_articles article
    where article.id = news_article_id
      and article.status = 'published'
      and article.published_at <= now()
  )
);

drop policy if exists "Active admins can read all news article images"
on site.news_article_images;

create policy "Active admins can read all news article images"
on site.news_article_images
for select
to authenticated
using (site.is_active_admin());

drop policy if exists "Active admins can insert news article images"
on site.news_article_images;

create policy "Active admins can insert news article images"
on site.news_article_images
for insert
to authenticated
with check (site.is_active_admin());

drop policy if exists "Active admins can update news article images"
on site.news_article_images;

create policy "Active admins can update news article images"
on site.news_article_images
for update
to authenticated
using (site.is_active_admin())
with check (site.is_active_admin());

drop policy if exists "Active admins can delete news article images"
on site.news_article_images;

create policy "Active admins can delete news article images"
on site.news_article_images
for delete
to authenticated
using (site.is_active_admin());

drop policy if exists "Active admins can delete news articles"
on site.news_articles;

create policy "Active admins can delete news articles"
on site.news_articles
for delete
to authenticated
using (site.is_active_admin());

insert into site.event_service_images (
  event_service_id,
  image_path,
  alt_fr,
  alt_en,
  sort_order,
  is_cover,
  is_active
)
select
  service.id,
  service.image_path,
  service.image_alt_fr,
  service.image_alt_en,
  0,
  true,
  true
from site.event_services service
where service.image_path is not null
  and char_length(trim(service.image_path)) > 0
on conflict (event_service_id, image_path) do update
set
  alt_fr = excluded.alt_fr,
  alt_en = excluded.alt_en,
  is_cover = true,
  is_active = true;

insert into site.news_article_images (
  news_article_id,
  image_path,
  alt_fr,
  alt_en,
  sort_order,
  is_cover,
  is_active
)
select
  article.id,
  article.image_path,
  article.image_alt_fr,
  article.image_alt_en,
  0,
  true,
  true
from site.news_articles article
where article.image_path is not null
  and char_length(trim(article.image_path)) > 0
on conflict (news_article_id, image_path) do update
set
  alt_fr = excluded.alt_fr,
  alt_en = excluded.alt_en,
  is_cover = true,
  is_active = true;

commit;
