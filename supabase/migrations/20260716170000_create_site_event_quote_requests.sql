create table if not exists site.event_quote_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  whatsapp text,
  estimated_budget numeric(12,2),
  additional_details text,
  event_type_id uuid not null references site.event_services(id) on update cascade on delete restrict,
  event_date date,
  specific_answers jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_quote_requests_full_name_not_empty check (char_length(trim(full_name)) >= 2),
  constraint event_quote_requests_email_not_empty check (char_length(trim(email)) >= 5),
  constraint event_quote_requests_phone_not_empty check (char_length(trim(phone)) >= 4),
  constraint event_quote_requests_budget_positive check (estimated_budget is null or estimated_budget >= 0),
  constraint event_quote_requests_answers_object check (jsonb_typeof(specific_answers) = 'object'),
  constraint event_quote_requests_status_valid check (
    status in ('new', 'in_progress', 'quote_sent', 'confirmed', 'declined', 'archived')
  )
);

create table if not exists site.event_quote_fields (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references site.event_services(id) on update cascade on delete cascade,
  field_key text not null,
  label_fr text not null,
  label_en text not null,
  field_type text not null,
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  placeholder_fr text,
  placeholder_en text,
  help_text_fr text,
  help_text_en text,
  options jsonb not null default '[]'::jsonb,
  conditional_logic jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_quote_fields_key_not_empty check (field_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint event_quote_fields_label_fr_not_empty check (char_length(trim(label_fr)) >= 2),
  constraint event_quote_fields_label_en_not_empty check (char_length(trim(label_en)) >= 2),
  constraint event_quote_fields_type_valid check (
    field_type in ('text', 'textarea', 'number', 'date', 'boolean', 'select', 'radio', 'checkbox_group', 'multi_select')
  ),
  constraint event_quote_fields_options_array check (jsonb_typeof(options) = 'array'),
  constraint event_quote_fields_conditional_object check (
    conditional_logic is null or jsonb_typeof(conditional_logic) = 'object'
  ),
  constraint event_quote_fields_sort_order_positive check (sort_order >= 0),
  constraint event_quote_fields_unique_key unique (event_type_id, field_key)
);

drop trigger if exists event_quote_requests_set_updated_at on site.event_quote_requests;
create trigger event_quote_requests_set_updated_at
before update on site.event_quote_requests
for each row execute function site.set_updated_at();

drop trigger if exists event_quote_fields_set_updated_at on site.event_quote_fields;
create trigger event_quote_fields_set_updated_at
before update on site.event_quote_fields
for each row execute function site.set_updated_at();

drop trigger if exists event_quote_fields_set_next_sort_order on site.event_quote_fields;
create trigger event_quote_fields_set_next_sort_order
before insert on site.event_quote_fields
for each row execute function site.set_next_sort_order();

create index if not exists event_quote_requests_type_created_idx
on site.event_quote_requests (event_type_id, created_at desc);

create index if not exists event_quote_requests_status_created_idx
on site.event_quote_requests (status, created_at desc);

create index if not exists event_quote_fields_type_active_sort_idx
on site.event_quote_fields (event_type_id, is_active, sort_order);

alter table site.event_quote_requests enable row level security;
alter table site.event_quote_fields enable row level security;

grant usage on schema site to anon, authenticated;
grant select, insert, update, delete on site.event_quote_requests to authenticated;
grant insert on site.event_quote_requests to anon;
grant select, insert, update, delete on site.event_quote_fields to authenticated;
grant select on site.event_quote_fields to anon;

drop policy if exists "Public can create event quote requests" on site.event_quote_requests;
create policy "Public can create event quote requests"
on site.event_quote_requests
for insert
to anon, authenticated
with check (
  status = 'new'
  and internal_notes is null
  and exists (
    select 1 from site.event_services service
    where service.id = event_type_id
    and service.is_active = true
  )
);

drop policy if exists "Active admins can read event quote requests" on site.event_quote_requests;
create policy "Active admins can read event quote requests"
on site.event_quote_requests
for select
to authenticated
using (site.is_active_admin());

drop policy if exists "Active admins can update event quote requests" on site.event_quote_requests;
create policy "Active admins can update event quote requests"
on site.event_quote_requests
for update
to authenticated
using (site.is_active_admin())
with check (site.is_active_admin());

drop policy if exists "Active admins can delete event quote requests" on site.event_quote_requests;
create policy "Active admins can delete event quote requests"
on site.event_quote_requests
for delete
to authenticated
using (site.is_active_admin());

drop policy if exists "Public can read active event quote fields" on site.event_quote_fields;
create policy "Public can read active event quote fields"
on site.event_quote_fields
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from site.event_services service
    where service.id = event_type_id
    and service.is_active = true
  )
);

drop policy if exists "Active admins can read all event quote fields" on site.event_quote_fields;
create policy "Active admins can read all event quote fields"
on site.event_quote_fields
for select
to authenticated
using (site.is_active_admin());

drop policy if exists "Active admins can insert event quote fields" on site.event_quote_fields;
create policy "Active admins can insert event quote fields"
on site.event_quote_fields
for insert
to authenticated
with check (site.is_active_admin());

drop policy if exists "Active admins can update event quote fields" on site.event_quote_fields;
create policy "Active admins can update event quote fields"
on site.event_quote_fields
for update
to authenticated
using (site.is_active_admin())
with check (site.is_active_admin());

drop policy if exists "Active admins can delete event quote fields" on site.event_quote_fields;
create policy "Active admins can delete event quote fields"
on site.event_quote_fields
for delete
to authenticated
using (site.is_active_admin());

insert into site.event_quote_fields (
  event_type_id,
  field_key,
  label_fr,
  label_en,
  field_type,
  is_required,
  sort_order,
  options,
  conditional_logic
)
select
  service.id,
  field.field_key,
  field.label_fr,
  field.label_en,
  field.field_type,
  field.is_required,
  field.sort_order,
  field.options,
  field.conditional_logic
from site.event_services service
cross join (
  values
    ('participants_count', 'Nombre de participants', 'Number of participants', 'number', true, 10, '[]'::jsonb, null::jsonb),
    ('coffee_break', 'Pause café', 'Coffee break', 'boolean', false, 20, '[]'::jsonb, null::jsonb),
    ('coffee_break_varieties', 'Nombre de sortes de pause café', 'Number of coffee break varieties', 'select', false, 30, '[{"value":"2","label_fr":"2","label_en":"2"},{"value":"3","label_fr":"3","label_en":"3"},{"value":"4","label_fr":"4","label_en":"4"},{"value":"5","label_fr":"5","label_en":"5"},{"value":"6","label_fr":"6","label_en":"6"}]'::jsonb, '{"dependsOn":"coffee_break","operator":"equals","value":true}'::jsonb),
    ('lunch_formula', 'Formule déjeuner', 'Lunch formula', 'radio', false, 40, '[{"value":"menu","label_fr":"Menu entrée + plat + dessert","label_en":"Starter, main course and dessert menu"},{"value":"buffet","label_fr":"Buffet","label_en":"Buffet"},{"value":"lunch_cocktail","label_fr":"Cocktail déjeunatoire","label_en":"Lunch cocktail"},{"value":"none","label_fr":"Aucun","label_en":"None"}]'::jsonb, null::jsonb),
    ('accommodation_people_count', 'Nombre de personnes à loger', 'Number of people to accommodate', 'number', false, 50, '[]'::jsonb, null::jsonb),
    ('closing_cocktail', 'Cocktail de clôture', 'Closing cocktail', 'boolean', false, 60, '[]'::jsonb, null::jsonb),
    ('room_setup', 'Mise en place de la salle', 'Room setup', 'select', false, 70, '[{"value":"theatre","label_fr":"Théâtre","label_en":"Theater"},{"value":"classroom","label_fr":"Salle de classe","label_en":"Classroom"},{"value":"u_shape","label_fr":"En U","label_en":"U-shape"},{"value":"boardroom","label_fr":"Conseil","label_en":"Boardroom"},{"value":"banquet","label_fr":"Banquet","label_en":"Banquet"},{"value":"cocktail","label_fr":"Cocktail","label_en":"Cocktail"},{"value":"other","label_fr":"Autre","label_en":"Other"}]'::jsonb, null::jsonb),
    ('equipment', 'Équipements', 'Equipment', 'checkbox_group', false, 80, '[{"value":"sound_system","label_fr":"Sonorisation","label_en":"Sound system"},{"value":"dedicated_wifi","label_fr":"Wi-Fi dédié","label_en":"Dedicated Wi-Fi"},{"value":"projector","label_fr":"Vidéoprojecteur","label_en":"Projector"}]'::jsonb, null::jsonb),
    ('transport_service', 'Transport', 'Transport', 'boolean', false, 90, '[]'::jsonb, null::jsonb)
) as field(field_key, label_fr, label_en, field_type, is_required, sort_order, options, conditional_logic)
where service.code = 'seminar'
on conflict (event_type_id, field_key) do update
set
  label_fr = excluded.label_fr,
  label_en = excluded.label_en,
  field_type = excluded.field_type,
  is_required = excluded.is_required,
  sort_order = excluded.sort_order,
  options = excluded.options,
  conditional_logic = excluded.conditional_logic,
  is_active = true,
  updated_at = now();
