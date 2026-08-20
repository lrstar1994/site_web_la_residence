/* ============================================================
   BUCKET STORAGE - GALERIE RESTAURANT
   ============================================================ */

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'restaurant-gallery',
  'restaurant-gallery',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


/* ============================================================
   POLICIES STORAGE
   ============================================================ */

/* Lecture publique */

drop policy if exists
  "Public can read restaurant gallery"
on storage.objects;

create policy
  "Public can read restaurant gallery"

on storage.objects

for select
to anon, authenticated

using (
  bucket_id = 'restaurant-gallery'
);


/* Upload réservé aux admins actifs */

drop policy if exists
  "Active admins can upload restaurant gallery"
on storage.objects;

create policy
  "Active admins can upload restaurant gallery"

on storage.objects

for insert
to authenticated

with check (
  bucket_id = 'restaurant-gallery'
  and site.is_active_admin()
);


/* Modification réservée aux admins actifs */

drop policy if exists
  "Active admins can update restaurant gallery"
on storage.objects;

create policy
  "Active admins can update restaurant gallery"

on storage.objects

for update
to authenticated

using (
  bucket_id = 'restaurant-gallery'
  and site.is_active_admin()
)

with check (
  bucket_id = 'restaurant-gallery'
  and site.is_active_admin()
);


/* Suppression réservée aux admins actifs */

drop policy if exists
  "Active admins can delete restaurant gallery"
on storage.objects;

create policy
  "Active admins can delete restaurant gallery"

on storage.objects

for delete
to authenticated

using (
  bucket_id = 'restaurant-gallery'
  and site.is_active_admin()
);

/* ============================================================
   TABLE - GALERIE RESTAURANT
   ============================================================ */

create schema if not exists site;

create table if not exists site.restaurant_gallery_images (

  id uuid
    primary key
    default gen_random_uuid(),

  /*
   * URL publique ou chemin de l'image dans le bucket
   * restaurant-gallery.
   */
  image_path text
    not null,

  alt_fr varchar(250)
    not null,

  alt_en varchar(250)
    not null,

  sort_order integer
    not null
    default 0,

  /*
   * Les premières images actives marquées
   * is_featured = true alimenteront la mosaïque
   * visible directement sur la page Restaurant.
   */
  is_featured boolean
    not null
    default false,

  is_active boolean
    not null
    default true,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint restaurant_gallery_images_path_not_empty
    check (
      char_length(trim(image_path)) > 0
    ),

  constraint restaurant_gallery_images_alt_fr_not_empty
    check (
      char_length(trim(alt_fr)) > 0
    ),

  constraint restaurant_gallery_images_alt_en_not_empty
    check (
      char_length(trim(alt_en)) > 0
    ),

  constraint restaurant_gallery_images_sort_order_positive
    check (
      sort_order >= 0
    )
);


/* ============================================================
   TRIGGER UPDATED_AT
   ============================================================ */

drop trigger if exists
  restaurant_gallery_images_set_updated_at
on site.restaurant_gallery_images;

create trigger
  restaurant_gallery_images_set_updated_at

before update
on site.restaurant_gallery_images

for each row
execute function site.set_updated_at();


/* ============================================================
   INDEX
   ============================================================ */

create index if not exists
  restaurant_gallery_images_active_sort_idx

on site.restaurant_gallery_images (
  is_active,
  sort_order
);


create index if not exists
  restaurant_gallery_images_featured_sort_idx

on site.restaurant_gallery_images (
  is_active,
  is_featured,
  sort_order
);


create unique index if not exists
  restaurant_gallery_images_unique_path_idx

on site.restaurant_gallery_images (
  image_path
);


/* ============================================================
   RLS
   ============================================================ */

alter table
  site.restaurant_gallery_images
enable row level security;


/* ============================================================
   PRIVILÈGES
   ============================================================ */

grant select
on site.restaurant_gallery_images
to anon, authenticated;

grant insert, update, delete
on site.restaurant_gallery_images
to authenticated;

grant all privileges
on site.restaurant_gallery_images
to service_role;


/* ============================================================
   POLICIES TABLE
   ============================================================ */

/* Lecture publique uniquement des images actives */

drop policy if exists
  "Public can read active restaurant gallery images"
on site.restaurant_gallery_images;

create policy
  "Public can read active restaurant gallery images"

on site.restaurant_gallery_images

for select
to anon, authenticated

using (
  is_active = true
);


/* Lecture complète pour admins actifs */

drop policy if exists
  "Active admins can read all restaurant gallery images"
on site.restaurant_gallery_images;

create policy
  "Active admins can read all restaurant gallery images"

on site.restaurant_gallery_images

for select
to authenticated

using (
  site.is_active_admin()
);


/* Insertion */

drop policy if exists
  "Active admins can insert restaurant gallery images"
on site.restaurant_gallery_images;

create policy
  "Active admins can insert restaurant gallery images"

on site.restaurant_gallery_images

for insert
to authenticated

with check (
  site.is_active_admin()
);


/* Modification */

drop policy if exists
  "Active admins can update restaurant gallery images"
on site.restaurant_gallery_images;

create policy
  "Active admins can update restaurant gallery images"

on site.restaurant_gallery_images

for update
to authenticated

using (
  site.is_active_admin()
)

with check (
  site.is_active_admin()
);


/* Suppression */

drop policy if exists
  "Active admins can delete restaurant gallery images"
on site.restaurant_gallery_images;

create policy
  "Active admins can delete restaurant gallery images"

on site.restaurant_gallery_images

for delete
to authenticated

using (
  site.is_active_admin()
);