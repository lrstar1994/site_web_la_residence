create table if not exists site.admin_users (
  user_id uuid primary key
    references auth.users(id)
    on update cascade
    on delete cascade,
  role varchar(30) not null default 'editor',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_role_valid check (role in ('admin', 'editor'))
);

drop trigger if exists admin_users_set_updated_at on site.admin_users;
create trigger admin_users_set_updated_at
before update on site.admin_users
for each row
execute function site.set_updated_at();

create index if not exists admin_users_active_role_idx
on site.admin_users (is_active, role);

alter table site.admin_users enable row level security;

grant usage on schema site to authenticated;
grant select on site.admin_users to authenticated;
grant select, insert, update on site.news_categories to authenticated;
grant select, insert, update on site.news_articles to authenticated;

grant usage on schema site to service_role;
grant all privileges on site.admin_users to service_role;

drop policy if exists "Authenticated users can read their own admin access"
on site.admin_users;

create policy "Authenticated users can read their own admin access"
on site.admin_users
for select
to authenticated
using (
  user_id = auth.uid()
  and is_active = true
);

create or replace function site.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = site, auth, pg_temp
as $$
  select exists (
    select 1
    from site.admin_users
    where user_id = auth.uid()
      and is_active = true
  );
$$;

revoke all on function site.is_active_admin() from public;
grant execute on function site.is_active_admin() to authenticated;

drop policy if exists "Active admins can read all news categories"
on site.news_categories;

create policy "Active admins can read all news categories"
on site.news_categories
for select
to authenticated
using (site.is_active_admin());

drop policy if exists "Active admins can insert news categories"
on site.news_categories;

create policy "Active admins can insert news categories"
on site.news_categories
for insert
to authenticated
with check (site.is_active_admin());

drop policy if exists "Active admins can update news categories"
on site.news_categories;

create policy "Active admins can update news categories"
on site.news_categories
for update
to authenticated
using (site.is_active_admin())
with check (site.is_active_admin());

drop policy if exists "Active admins can read all news articles"
on site.news_articles;

create policy "Active admins can read all news articles"
on site.news_articles
for select
to authenticated
using (site.is_active_admin());

drop policy if exists "Active admins can insert news articles"
on site.news_articles;

create policy "Active admins can insert news articles"
on site.news_articles
for insert
to authenticated
with check (site.is_active_admin());

drop policy if exists "Active admins can update news articles"
on site.news_articles;

create policy "Active admins can update news articles"
on site.news_articles
for update
to authenticated
using (site.is_active_admin())
with check (site.is_active_admin());
