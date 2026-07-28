create schema if not exists site;

create table if not exists site.accommodations (
  id uuid primary key default gen_random_uuid(),
  code varchar(100) not null unique,
  name_fr varchar(200) not null,
  name_en varchar(200) not null,
  short_description_fr text not null,
  short_description_en text not null,
  description_fr text not null,
  description_en text not null,
  category_fr varchar(120),
  category_en varchar(120),
  capacity integer not null,
  surface_m2 numeric(8,2),
  price_from numeric(12,2) not null,
  currency varchar(3) not null default 'MGA',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodations_code_not_empty check (char_length(trim(code)) >= 2),
  constraint accommodations_name_fr_not_empty check (char_length(trim(name_fr)) >= 2),
  constraint accommodations_name_en_not_empty check (char_length(trim(name_en)) >= 2),
  constraint accommodations_short_description_fr_not_empty check (char_length(trim(short_description_fr)) > 0),
  constraint accommodations_short_description_en_not_empty check (char_length(trim(short_description_en)) > 0),
  constraint accommodations_description_fr_not_empty check (char_length(trim(description_fr)) > 0),
  constraint accommodations_description_en_not_empty check (char_length(trim(description_en)) > 0),
  constraint accommodations_capacity_positive check (capacity > 0),
  constraint accommodations_surface_positive check (surface_m2 is null or surface_m2 > 0),
  constraint accommodations_price_positive check (price_from >= 0),
  constraint accommodations_currency_mga check (currency = 'MGA'),
  constraint accommodations_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.accommodation_images (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references site.accommodations(id) on update cascade on delete cascade,
  image_path text not null,
  alt_fr varchar(250) not null,
  alt_en varchar(250) not null,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_images_path_not_empty check (char_length(trim(image_path)) > 0),
  constraint accommodation_images_alt_fr_not_empty check (char_length(trim(alt_fr)) > 0),
  constraint accommodation_images_alt_en_not_empty check (char_length(trim(alt_en)) > 0),
  constraint accommodation_images_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.accommodation_feature_groups (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  name_fr varchar(120) not null,
  name_en varchar(120) not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site.accommodation_features (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references site.accommodation_feature_groups(id) on update cascade on delete restrict,
  code varchar(100) not null unique,
  name_fr varchar(160) not null,
  name_en varchar(160) not null,
  description_fr text,
  description_en text,
  icon_key varchar(80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_features_code_not_empty check (char_length(trim(code)) >= 2),
  constraint accommodation_features_name_fr_not_empty check (char_length(trim(name_fr)) >= 2),
  constraint accommodation_features_name_en_not_empty check (char_length(trim(name_en)) >= 2),
  constraint accommodation_features_sort_order_positive check (sort_order >= 0)
);

create table if not exists site.accommodation_feature_links (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references site.accommodations(id) on update cascade on delete cascade,
  feature_id uuid not null references site.accommodation_features(id) on update cascade on delete restrict,
  sort_order integer not null default 0,
  custom_label_fr varchar(160),
  custom_label_en varchar(160),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (accommodation_id, feature_id),
  constraint accommodation_feature_links_sort_order_positive check (sort_order >= 0)
);

drop trigger if exists accommodations_set_updated_at on site.accommodations;
create trigger accommodations_set_updated_at before update on site.accommodations
for each row execute function site.set_updated_at();

drop trigger if exists accommodation_images_set_updated_at on site.accommodation_images;
create trigger accommodation_images_set_updated_at before update on site.accommodation_images
for each row execute function site.set_updated_at();

drop trigger if exists accommodation_feature_groups_set_updated_at on site.accommodation_feature_groups;
create trigger accommodation_feature_groups_set_updated_at before update on site.accommodation_feature_groups
for each row execute function site.set_updated_at();

drop trigger if exists accommodation_features_set_updated_at on site.accommodation_features;
create trigger accommodation_features_set_updated_at before update on site.accommodation_features
for each row execute function site.set_updated_at();

drop trigger if exists accommodation_feature_links_set_updated_at on site.accommodation_feature_links;
create trigger accommodation_feature_links_set_updated_at before update on site.accommodation_feature_links
for each row execute function site.set_updated_at();

create index if not exists accommodations_active_sort_idx on site.accommodations (is_active, sort_order);
create index if not exists accommodation_images_accommodation_sort_idx on site.accommodation_images (accommodation_id, is_active, sort_order);
create unique index if not exists accommodation_images_one_active_cover_idx
on site.accommodation_images (accommodation_id)
where is_cover = true and is_active = true;
create unique index if not exists accommodation_images_unique_path_idx
on site.accommodation_images (accommodation_id, image_path);
create index if not exists accommodation_feature_groups_active_sort_idx on site.accommodation_feature_groups (is_active, sort_order);
create index if not exists accommodation_features_group_sort_idx on site.accommodation_features (group_id, is_active, sort_order);
create index if not exists accommodation_feature_links_accommodation_sort_idx on site.accommodation_feature_links (accommodation_id, is_active, sort_order);
create index if not exists accommodation_feature_links_feature_idx on site.accommodation_feature_links (feature_id);

alter table site.accommodations enable row level security;
alter table site.accommodation_images enable row level security;
alter table site.accommodation_feature_groups enable row level security;
alter table site.accommodation_features enable row level security;
alter table site.accommodation_feature_links enable row level security;

grant select on site.accommodations, site.accommodation_images, site.accommodation_feature_groups, site.accommodation_features, site.accommodation_feature_links to anon, authenticated;
grant insert, update on site.accommodations, site.accommodation_images, site.accommodation_feature_groups, site.accommodation_features, site.accommodation_feature_links to authenticated;
grant all privileges on site.accommodations, site.accommodation_images, site.accommodation_feature_groups, site.accommodation_features, site.accommodation_feature_links to service_role;

drop policy if exists "Public can read active accommodations" on site.accommodations;
create policy "Public can read active accommodations" on site.accommodations
for select to anon, authenticated using (is_active = true);
drop policy if exists "Active admins can read all accommodations" on site.accommodations;
create policy "Active admins can read all accommodations" on site.accommodations
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert accommodations" on site.accommodations;
create policy "Active admins can insert accommodations" on site.accommodations
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update accommodations" on site.accommodations;
create policy "Active admins can update accommodations" on site.accommodations
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active accommodation images" on site.accommodation_images;
create policy "Public can read active accommodation images" on site.accommodation_images
for select to anon, authenticated using (
  is_active = true and exists (
    select 1 from site.accommodations a where a.id = accommodation_id and a.is_active = true
  )
);
drop policy if exists "Active admins can manage accommodation images" on site.accommodation_images;
drop policy if exists "Active admins can read all accommodation images" on site.accommodation_images;
create policy "Active admins can read all accommodation images" on site.accommodation_images
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert accommodation images" on site.accommodation_images;
create policy "Active admins can insert accommodation images" on site.accommodation_images
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update accommodation images" on site.accommodation_images;
create policy "Active admins can update accommodation images" on site.accommodation_images
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active accommodation feature groups" on site.accommodation_feature_groups;
create policy "Public can read active accommodation feature groups" on site.accommodation_feature_groups
for select to anon, authenticated using (is_active = true);
drop policy if exists "Active admins can manage accommodation feature groups" on site.accommodation_feature_groups;
drop policy if exists "Active admins can read all accommodation feature groups" on site.accommodation_feature_groups;
create policy "Active admins can read all accommodation feature groups" on site.accommodation_feature_groups
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert accommodation feature groups" on site.accommodation_feature_groups;
create policy "Active admins can insert accommodation feature groups" on site.accommodation_feature_groups
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update accommodation feature groups" on site.accommodation_feature_groups;
create policy "Active admins can update accommodation feature groups" on site.accommodation_feature_groups
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active accommodation features" on site.accommodation_features;
create policy "Public can read active accommodation features" on site.accommodation_features
for select to anon, authenticated using (
  is_active = true and exists (
    select 1 from site.accommodation_feature_groups g where g.id = group_id and g.is_active = true
  )
);
drop policy if exists "Active admins can manage accommodation features" on site.accommodation_features;
drop policy if exists "Active admins can read all accommodation features" on site.accommodation_features;
create policy "Active admins can read all accommodation features" on site.accommodation_features
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert accommodation features" on site.accommodation_features;
create policy "Active admins can insert accommodation features" on site.accommodation_features
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update accommodation features" on site.accommodation_features;
create policy "Active admins can update accommodation features" on site.accommodation_features
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());

drop policy if exists "Public can read active accommodation feature links" on site.accommodation_feature_links;
create policy "Public can read active accommodation feature links" on site.accommodation_feature_links
for select to anon, authenticated using (
  is_active = true
  and exists (select 1 from site.accommodations a where a.id = accommodation_id and a.is_active = true)
  and exists (
    select 1
    from site.accommodation_features f
    join site.accommodation_feature_groups g on g.id = f.group_id
    where f.id = feature_id and f.is_active = true and g.is_active = true
  )
);
drop policy if exists "Active admins can manage accommodation feature links" on site.accommodation_feature_links;
drop policy if exists "Active admins can read all accommodation feature links" on site.accommodation_feature_links;
create policy "Active admins can read all accommodation feature links" on site.accommodation_feature_links
for select to authenticated using (site.is_active_admin());
drop policy if exists "Active admins can insert accommodation feature links" on site.accommodation_feature_links;
create policy "Active admins can insert accommodation feature links" on site.accommodation_feature_links
for insert to authenticated with check (site.is_active_admin());
drop policy if exists "Active admins can update accommodation feature links" on site.accommodation_feature_links;
create policy "Active admins can update accommodation feature links" on site.accommodation_feature_links
for update to authenticated using (site.is_active_admin()) with check (site.is_active_admin());
