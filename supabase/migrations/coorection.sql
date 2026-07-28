begin;

-- Autoriser le rôle authentifié à utiliser le schéma métier.
grant usage on schema site to authenticated;

-- Ajouter le droit DELETE manquant sur la table des images Restaurant.
grant select, insert, update, delete
on table site.restaurant_menu_images
to authenticated;

-- S'assurer que RLS reste actif.
alter table site.restaurant_menu_images
enable row level security;

-- Politique de suppression réservée aux administrateurs actifs.
drop policy if exists "Active admins can delete restaurant menu images"
on site.restaurant_menu_images;

create policy "Active admins can delete restaurant menu images"
on site.restaurant_menu_images
for delete
to authenticated
using (
  (select site.is_active_admin())
);

commit;


-- ---------------------------------------------------------------------------------------------
begin;

grant usage on schema site to authenticated;

grant select, insert, update, delete
on table site.restaurant_menus
to authenticated;

alter table site.restaurant_menus
enable row level security;

drop policy if exists "Active admins can delete restaurant menus"
on site.restaurant_menus;

create policy "Active admins can delete restaurant menus"
on site.restaurant_menus
for delete
to authenticated
using (
  (select site.is_active_admin())
);

commit;