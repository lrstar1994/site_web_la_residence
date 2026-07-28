create schema if not exists site;

create table if not exists site.restaurant_menu_categories (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  name_fr varchar(120) not null,
  name_en varchar(120) not null,
  description_fr text,
  description_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_menu_categories_code_not_empty check (char_length(trim(code)) >= 2),
  constraint restaurant_menu_categories_name_fr_not_empty check (char_length(trim(name_fr)) >= 2),
  constraint restaurant_menu_categories_name_en_not_empty check (char_length(trim(name_en)) >= 2),
  constraint restaurant_menu_categories_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.restaurant_menus (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references site.restaurant_menu_categories(id) on update cascade on delete restrict,
  code varchar(100) not null unique,
  title_fr varchar(200) not null,
  title_en varchar(200) not null,
  short_description_fr text not null,
  short_description_en text not null,
  description_fr text,
  description_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_menus_code_not_empty check (char_length(trim(code)) >= 2),
  constraint restaurant_menus_title_fr_not_empty check (char_length(trim(title_fr)) >= 2),
  constraint restaurant_menus_title_en_not_empty check (char_length(trim(title_en)) >= 2),
  constraint restaurant_menus_short_description_fr_not_empty check (char_length(trim(short_description_fr)) > 0),
  constraint restaurant_menus_short_description_en_not_empty check (char_length(trim(short_description_en)) > 0),
  constraint restaurant_menus_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.restaurant_menu_images (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references site.restaurant_menus(id) on update cascade on delete cascade,
  image_path text not null,
  alt_fr varchar(250) not null,
  alt_en varchar(250) not null,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_menu_images_path_not_empty check (char_length(trim(image_path)) > 0),
  constraint restaurant_menu_images_alt_fr_not_empty check (char_length(trim(alt_fr)) > 0),
  constraint restaurant_menu_images_alt_en_not_empty check (char_length(trim(alt_en)) > 0),
  constraint restaurant_menu_images_sort_order_positive check (sort_order >= 0)
);

drop trigger if exists restaurant_menu_categories_set_updated_at on site.restaurant_menu_categories;
create trigger restaurant_menu_categories_set_updated_at before update on site.restaurant_menu_categories
for each row execute function site.set_updated_at();
drop trigger if exists restaurant_menus_set_updated_at on site.restaurant_menus;
create trigger restaurant_menus_set_updated_at before update on site.restaurant_menus
for each row execute function site.set_updated_at();
drop trigger if exists restaurant_menu_images_set_updated_at on site.restaurant_menu_images;
create trigger restaurant_menu_images_set_updated_at before update on site.restaurant_menu_images
for each row execute function site.set_updated_at();

create index if not exists restaurant_menu_categories_active_sort_idx on site.restaurant_menu_categories (is_active, sort_order);
create index if not exists restaurant_menus_category_active_sort_idx on site.restaurant_menus (category_id, is_active, sort_order);
create index if not exists restaurant_menu_images_menu_sort_idx on site.restaurant_menu_images (menu_id, is_active, sort_order);
create unique index if not exists restaurant_menu_images_one_active_cover_idx on site.restaurant_menu_images (menu_id) where is_cover = true and is_active = true;
create unique index if not exists restaurant_menu_images_unique_path_idx on site.restaurant_menu_images (menu_id, image_path);

alter table site.restaurant_menu_categories enable row level security;
alter table site.restaurant_menus enable row level security;
alter table site.restaurant_menu_images enable row level security;

grant select on site.restaurant_menu_categories, site.restaurant_menus, site.restaurant_menu_images to anon, authenticated;
grant insert, update on site.restaurant_menu_categories, site.restaurant_menus, site.restaurant_menu_images to authenticated;
grant all privileges on site.restaurant_menu_categories, site.restaurant_menus, site.restaurant_menu_images to service_role;

drop policy if exists "Public can read active restaurant menu categories" on site.restaurant_menu_categories;
create policy "Public can read active restaurant menu categories" on site.restaurant_menu_categories
for select to anon, authenticated using (is_active = true);
drop policy if exists "Active admins can read all restaurant menu categories" on site.restaurant_menu_categories;
create policy "Active admins can read all restaurant menu categories" on site.restaurant_menu_categories
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert restaurant menu categories" on site.restaurant_menu_categories;
create policy "Active admins can insert restaurant menu categories" on site.restaurant_menu_categories
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update restaurant menu categories" on site.restaurant_menu_categories;
create policy "Active admins can update restaurant menu categories" on site.restaurant_menu_categories
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active restaurant menus" on site.restaurant_menus;
create policy "Public can read active restaurant menus" on site.restaurant_menus
for select to anon, authenticated using (
  is_active = true
  and exists (select 1 from site.restaurant_menu_categories c where c.id = category_id and c.is_active = true)
);
drop policy if exists "Active admins can read all restaurant menus" on site.restaurant_menus;
create policy "Active admins can read all restaurant menus" on site.restaurant_menus
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert restaurant menus" on site.restaurant_menus;
create policy "Active admins can insert restaurant menus" on site.restaurant_menus
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update restaurant menus" on site.restaurant_menus;
create policy "Active admins can update restaurant menus" on site.restaurant_menus
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active restaurant menu images" on site.restaurant_menu_images;
create policy "Public can read active restaurant menu images" on site.restaurant_menu_images
for select to anon, authenticated using (
  is_active = true
  and exists (
    select 1
    from site.restaurant_menus m
    join site.restaurant_menu_categories c on c.id = m.category_id
    where m.id = menu_id and m.is_active = true and c.is_active = true
  )
);
drop policy if exists "Active admins can read all restaurant menu images" on site.restaurant_menu_images;
create policy "Active admins can read all restaurant menu images" on site.restaurant_menu_images
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert restaurant menu images" on site.restaurant_menu_images;
create policy "Active admins can insert restaurant menu images" on site.restaurant_menu_images
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update restaurant menu images" on site.restaurant_menu_images;
create policy "Active admins can update restaurant menu images" on site.restaurant_menu_images
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());
