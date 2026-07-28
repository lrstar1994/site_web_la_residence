create schema if not exists site;

create extension if not exists pgcrypto;

create table if not exists site.news_categories (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) not null unique,
  name_fr varchar(100) not null,
  name_en varchar(100) not null,
  description_fr text,
  description_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_categories_code_not_blank check (char_length(trim(code)) > 0),
  constraint news_categories_name_fr_not_blank check (char_length(trim(name_fr)) > 0),
  constraint news_categories_name_en_not_blank check (char_length(trim(name_en)) > 0),
  constraint news_categories_sort_order_non_negative check (sort_order >= 0)
);

create table if not exists site.news_articles (
  id uuid primary key default gen_random_uuid(),
  code varchar(100) not null unique,
  category_id uuid not null
    references site.news_categories(id)
    on update cascade
    on delete restrict,
  title_fr varchar(200) not null,
  title_en varchar(200) not null,
  excerpt_fr text not null,
  excerpt_en text not null,
  content_fr text not null,
  content_en text not null,
  image_path text not null,
  image_alt_fr varchar(250) not null,
  image_alt_en varchar(250) not null,
  status varchar(20) not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_articles_code_not_blank check (char_length(trim(code)) > 0),
  constraint news_articles_title_fr_not_blank check (char_length(trim(title_fr)) > 0),
  constraint news_articles_title_en_not_blank check (char_length(trim(title_en)) > 0),
  constraint news_articles_excerpt_fr_not_blank check (char_length(trim(excerpt_fr)) > 0),
  constraint news_articles_excerpt_en_not_blank check (char_length(trim(excerpt_en)) > 0),
  constraint news_articles_content_fr_not_blank check (char_length(trim(content_fr)) > 0),
  constraint news_articles_content_en_not_blank check (char_length(trim(content_en)) > 0),
  constraint news_articles_image_path_not_blank check (char_length(trim(image_path)) > 0),
  constraint news_articles_image_alt_fr_not_blank check (char_length(trim(image_alt_fr)) > 0),
  constraint news_articles_image_alt_en_not_blank check (char_length(trim(image_alt_en)) > 0),
  constraint news_articles_status_valid check (status in ('draft', 'published', 'archived')),
  constraint news_articles_published_at_required check (
    status <> 'published'
    or published_at is not null
  )
);

create or replace function site.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_categories_set_updated_at on site.news_categories;
create trigger news_categories_set_updated_at
before update on site.news_categories
for each row
execute function site.set_updated_at();

drop trigger if exists news_articles_set_updated_at on site.news_articles;
create trigger news_articles_set_updated_at
before update on site.news_articles
for each row
execute function site.set_updated_at();

create index if not exists news_categories_active_sort_idx
on site.news_categories (is_active, sort_order);

create index if not exists news_articles_status_published_at_idx
on site.news_articles (status, published_at desc);

create index if not exists news_articles_category_id_idx
on site.news_articles (category_id);

create index if not exists news_articles_published_idx
on site.news_articles (published_at desc)
where status = 'published';

alter table site.news_categories enable row level security;
alter table site.news_articles enable row level security;

grant usage on schema site to anon, authenticated;
grant select on site.news_categories to anon, authenticated;
grant select on site.news_articles to anon, authenticated;

grant usage on schema site to service_role;
grant all privileges on all tables in schema site to service_role;
grant all privileges on all routines in schema site to service_role;

alter default privileges in schema site
grant select on tables to anon, authenticated;

alter default privileges in schema site
grant all privileges on tables to service_role;

alter default privileges in schema site
grant all privileges on routines to service_role;

drop policy if exists "Public can read active news categories"
on site.news_categories;

create policy "Public can read active news categories"
on site.news_categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read published news articles"
on site.news_articles;

create policy "Public can read published news articles"
on site.news_articles
for select
to anon, authenticated
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);
