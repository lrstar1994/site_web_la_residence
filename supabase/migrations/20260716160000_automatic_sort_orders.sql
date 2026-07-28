create or replace function site.set_next_sort_order()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  next_order integer;
  lock_key bigint;
begin
  if new.sort_order is null or new.sort_order <= 0 then
    lock_key := hashtextextended(TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, 0);
    perform pg_advisory_xact_lock(lock_key);

    execute format(
      'select coalesce(max(sort_order), 0) + 10 from %I.%I',
      TG_TABLE_SCHEMA,
      TG_TABLE_NAME
    )
    into next_order;

    new.sort_order := next_order;
  end if;

  return new;
end;
$$;

with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.news_categories)
update site.news_categories t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.event_services)
update site.event_services t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.accommodations)
update site.accommodations t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.accommodation_images)
update site.accommodation_images t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.accommodation_feature_groups)
update site.accommodation_feature_groups t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.accommodation_features)
update site.accommodation_features t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.accommodation_feature_links)
update site.accommodation_feature_links t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.venues)
update site.venues t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.venue_images)
update site.venue_images t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.venue_setup_types)
update site.venue_setup_types t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.venue_setup_links)
update site.venue_setup_links t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.restaurant_menu_categories)
update site.restaurant_menu_categories t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.restaurant_menus)
update site.restaurant_menus t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;
with ordered as (select id, row_number() over (order by sort_order asc, created_at asc, id asc) * 10 as next_order from site.restaurant_menu_images)
update site.restaurant_menu_images t set sort_order = ordered.next_order from ordered where t.id = ordered.id and t.sort_order is distinct from ordered.next_order;

drop trigger if exists news_categories_set_next_sort_order on site.news_categories;
create trigger news_categories_set_next_sort_order before insert on site.news_categories for each row execute function site.set_next_sort_order();
drop trigger if exists event_services_set_next_sort_order on site.event_services;
create trigger event_services_set_next_sort_order before insert on site.event_services for each row execute function site.set_next_sort_order();
drop trigger if exists accommodations_set_next_sort_order on site.accommodations;
create trigger accommodations_set_next_sort_order before insert on site.accommodations for each row execute function site.set_next_sort_order();
drop trigger if exists accommodation_images_set_next_sort_order on site.accommodation_images;
create trigger accommodation_images_set_next_sort_order before insert on site.accommodation_images for each row execute function site.set_next_sort_order();
drop trigger if exists accommodation_feature_groups_set_next_sort_order on site.accommodation_feature_groups;
create trigger accommodation_feature_groups_set_next_sort_order before insert on site.accommodation_feature_groups for each row execute function site.set_next_sort_order();
drop trigger if exists accommodation_features_set_next_sort_order on site.accommodation_features;
create trigger accommodation_features_set_next_sort_order before insert on site.accommodation_features for each row execute function site.set_next_sort_order();
drop trigger if exists accommodation_feature_links_set_next_sort_order on site.accommodation_feature_links;
create trigger accommodation_feature_links_set_next_sort_order before insert on site.accommodation_feature_links for each row execute function site.set_next_sort_order();
drop trigger if exists venues_set_next_sort_order on site.venues;
create trigger venues_set_next_sort_order before insert on site.venues for each row execute function site.set_next_sort_order();
drop trigger if exists venue_images_set_next_sort_order on site.venue_images;
create trigger venue_images_set_next_sort_order before insert on site.venue_images for each row execute function site.set_next_sort_order();
drop trigger if exists venue_setup_types_set_next_sort_order on site.venue_setup_types;
create trigger venue_setup_types_set_next_sort_order before insert on site.venue_setup_types for each row execute function site.set_next_sort_order();
drop trigger if exists venue_setup_links_set_next_sort_order on site.venue_setup_links;
create trigger venue_setup_links_set_next_sort_order before insert on site.venue_setup_links for each row execute function site.set_next_sort_order();
drop trigger if exists restaurant_menu_categories_set_next_sort_order on site.restaurant_menu_categories;
create trigger restaurant_menu_categories_set_next_sort_order before insert on site.restaurant_menu_categories for each row execute function site.set_next_sort_order();
drop trigger if exists restaurant_menus_set_next_sort_order on site.restaurant_menus;
create trigger restaurant_menus_set_next_sort_order before insert on site.restaurant_menus for each row execute function site.set_next_sort_order();
drop trigger if exists restaurant_menu_images_set_next_sort_order on site.restaurant_menu_images;
create trigger restaurant_menu_images_set_next_sort_order before insert on site.restaurant_menu_images for each row execute function site.set_next_sort_order();
