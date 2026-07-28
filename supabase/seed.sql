insert into site.news_categories (
  code,
  name_fr,
  name_en,
  sort_order,
  is_active
)
values
  ('event', 'Événements', 'Events', 10, true),
  ('restaurant', 'Restaurant', 'Restaurant', 20, true),
  ('venues', 'Salles', 'Venues', 30, true),
  ('accommodation', 'Hébergement', 'Accommodation', 40, true),
  ('offers', 'Offres', 'Offers', 50, true)
on conflict (code) do update
set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into site.news_articles (
  code,
  category_id,
  title_fr,
  title_en,
  excerpt_fr,
  excerpt_en,
  content_fr,
  content_en,
  image_path,
  image_alt_fr,
  image_alt_en,
  status,
  published_at
)
values
  (
    'brunch',
    (select id from site.news_categories where code = 'event'),
    'Brunch du dimanche à Ankerana',
    'Sunday brunch in Ankerana',
    'Un rendez-vous convivial pour profiter du restaurant Le Privilège.',
    'A friendly Sunday gathering at Le Privilège restaurant.',
    'Le brunch du dimanche à La Résidence Ankerana est pensé comme un moment de détente à partager en famille ou entre amis.

Le restaurant Le Privilège propose une sélection de plats salés et sucrés, accompagnée d’activités adaptées à l’ambiance du jour.

Profitez du cadre calme d’Ankerana, du restaurant et des espaces de La Résidence pour terminer la semaine dans une atmosphère conviviale.',
    'Sunday brunch at La Résidence Ankerana is designed as a relaxing moment to enjoy with family or friends.

Le Privilège restaurant offers a selection of savoury and sweet dishes, together with activities suited to the day’s atmosphere.

Enjoy the peaceful setting of Ankerana, the restaurant and the Residence’s facilities for a friendly end to the week.',
    '/restaurant.jpeg',
    'Brunch du dimanche à La Résidence Ankerana',
    'Sunday brunch at La Résidence Ankerana',
    'published',
    '2026-06-01T09:00:00+03:00'
  ),
  (
    'restaurant-menu',
    (select id from site.news_categories where code = 'restaurant'),
    'Nouvelle carte du restaurant',
    'New restaurant menu',
    'Découvrez les plats, pizzas, desserts et saveurs malagasy.',
    'Discover main courses, pizzas, desserts and Malagasy flavours.',
    'Le restaurant Le Privilège renouvelle sa carte avec une sélection de recettes adaptées aux déjeuners, dîners et repas de groupe.

La nouvelle proposition met en avant plusieurs univers : plats internationaux, spécialités malagasy, pizzas, desserts et boissons.

La carte est conçue pour offrir davantage de choix aux clients de La Résidence Ankerana.',
    'Le Privilège restaurant has renewed its menu with a selection of dishes for lunch, dinner and group meals.

The new menu highlights international dishes, Malagasy specialities, pizzas, desserts and drinks.

It is designed to provide guests of La Résidence Ankerana with a wider choice.',
    '/menu-plats-restaurant-le-privilege-ankerana.jpeg',
    'Nouvelle carte du restaurant Le Privilège à Ankerana',
    'New menu at Le Privilège restaurant in Ankerana',
    'published',
    '2026-05-18T09:00:00+03:00'
  ),
  (
    'seminar',
    (select id from site.news_categories where code = 'venues'),
    'Organiser un séminaire à Antananarivo',
    'Organising a seminar in Antananarivo',
    'Conseils pour préparer une réunion professionnelle efficace.',
    'Practical advice for planning an effective professional meeting.',
    'La réussite d’un séminaire dépend du choix du lieu, de la configuration de la salle et de la qualité des services proposés aux participants.

Il est important de définir le nombre de participants, de choisir une configuration adaptée, de prévoir le matériel audiovisuel et d’organiser les pauses ainsi que le déjeuner.

La Résidence Ankerana propose plusieurs salles modulables pour les réunions, formations, conférences et événements professionnels à Antananarivo.',
    'A successful seminar depends on the choice of venue, the room layout and the quality of services provided to participants.

It is important to define the number of guests, select an appropriate layout, prepare audiovisual equipment and organise breaks and lunch.

La Résidence Ankerana offers several flexible venues for meetings, training sessions, conferences and corporate events in Antananarivo.',
    '/salles.jpeg',
    'Salle de séminaire à La Résidence Ankerana à Antananarivo',
    'Seminar venue at La Résidence Ankerana in Antananarivo',
    'published',
    '2026-05-05T09:00:00+03:00'
  )
on conflict (code) do update
set
  category_id = excluded.category_id,
  title_fr = excluded.title_fr,
  title_en = excluded.title_en,
  excerpt_fr = excluded.excerpt_fr,
  excerpt_en = excluded.excerpt_en,
  content_fr = excluded.content_fr,
  content_en = excluded.content_en,
  image_path = excluded.image_path,
  image_alt_fr = excluded.image_alt_fr,
  image_alt_en = excluded.image_alt_en,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();

insert into site.event_services (
  code,
  title_fr,
  title_en,
  description_fr,
  description_en,
  image_path,
  image_alt_fr,
  image_alt_en,
  sort_order,
  is_active
)
values
  (
    'seminar',
    'Séminaire',
    'Seminars',
    'Conférences, formations, ateliers et activités de team-building dans un environnement propice au travail et à la détente.',
    'Conferences, training sessions, workshops and team-building activities in a setting suited to work and relaxation.',
    '/evenements.jpeg',
    'Séminaire organisé à La Résidence Ankerana',
    'Seminar at La Résidence Ankerana',
    10,
    true
  ),
  (
    'private-celebrations',
    'Mariage, Vodiondry, Baptême et Anniversaire',
    'Weddings, Traditional Ceremonies, Baptisms and Birthdays',
    'Des moments uniques célébrés avec élégance, dans un cadre calme et avec une organisation attentive.',
    'Celebrate weddings, traditional ceremonies, baptisms and birthdays in an elegant and peaceful setting.',
    '/chapelle-la-residence-ankerana.jpg',
    'Cérémonie à La Résidence Ankerana',
    'Ceremony at La Résidence Ankerana',
    20,
    true
  ),
  (
    'pool-events',
    'Événements Piscine',
    'Poolside Events',
    'Cocktails, journées de détente et célébrations conviviales dans les espaces situés autour de la piscine.',
    'Cocktails, relaxing days and friendly celebrations in our poolside spaces.',
    '/espace-piscine-la-residence-ankerana.jpg',
    'Événement au bord de la piscine à La Résidence Ankerana',
    'Poolside event at La Résidence Ankerana',
    30,
    true
  ),
  (
    'catering',
    'Service Traiteur',
    'Catering Service',
    'Une cuisine raffinée proposée sur place ou en prestation extérieure pour accompagner vos réceptions.',
    'Refined catering services available on site or at an external venue for your events.',
    '/restaurant.jpeg',
    'Service traiteur de La Résidence Ankerana',
    'Catering service by La Résidence Ankerana',
    40,
    true
  )
on conflict (code) do update
set
  title_fr = excluded.title_fr,
  title_en = excluded.title_en,
  description_fr = excluded.description_fr,
  description_en = excluded.description_en,
  image_path = excluded.image_path,
  image_alt_fr = excluded.image_alt_fr,
  image_alt_en = excluded.image_alt_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into site.accommodation_feature_groups (code, name_fr, name_en, sort_order, is_active)
values
  ('assets', 'Les Atouts', 'Highlights', 10, true),
  ('essentials', 'Les Essentiels', 'Essentials', 20, true),
  ('residence-benefits', 'Les + de la Résidence', 'Residence Benefits', 30, true)
on conflict (code) do update
set name_fr = excluded.name_fr, name_en = excluded.name_en, sort_order = excluded.sort_order, is_active = excluded.is_active, updated_at = now();

insert into site.accommodation_features (group_id, code, name_fr, name_en, icon_key, sort_order, is_active)
values
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'surface-20', '20 m²', '20 m²', 'surface', 10, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'surface-25', '25 m²', '25 m²', 'surface', 11, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'surface-37', '37 m²', '37 m²', 'surface', 12, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'surface-40', '40 m²', '40 m²', 'surface', 13, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'surface-50', '50 m²', '50 m²', 'surface', 14, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'up-to-4-guests', 'Jusqu''à 4 personnes', 'Up to 4 guests', 'people', 20, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'up-to-6-guests', 'Jusqu''à 6 personnes', 'Up to 6 guests', 'people', 21, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'king-size-bed', 'Lit King size', 'King size bed', 'bed', 30, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'queen-size-bed', 'Lit Queen size', 'Queen size bed', 'bed', 31, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'queen-bed', 'Lit Queen', 'Queen bed', 'bed', 32, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'two-beds', 'Deux lits', 'Two beds', 'bed', 33, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'two-single-beds', 'Deux lits simples', 'Two single beds', 'bed', 34, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'three-single-beds', 'Trois lits simples', 'Three single beds', 'bed', 35, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'two-queen-size-beds', 'Deux lits Queen size', 'Two queen size beds', 'bed', 36, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'shower', 'Douche', 'Shower', 'shower', 40, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'bathtub', 'Baignoire', 'Bathtub', 'bath', 41, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'wardrobe', 'Penderie', 'Wardrobe', 'hanger', 42, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'terrace', 'Terrasse', 'Terrace', 'terrace', 43, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'desk', 'Bureau', 'Desk', 'workspace', 44, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'lounge-area', 'Coin salon', 'Lounge area', 'living-room', 45, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'equipped-kitchenette', 'Kitchenette équipée', 'Equipped kitchenette', 'kitchen', 46, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'canal-plus-basic', 'Canal Plus Basic', 'Canal Plus Basic', 'canal-plus', 50, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'canal-plus-essential', 'Canal Plus Essentiel', 'Canal Plus Essentiel', 'canal-plus', 51, true),
  ((select id from site.accommodation_feature_groups where code = 'assets'), 'canal-plus-prestige', 'Canal Plus Prestige', 'Canal Plus Prestige', 'canal-plus', 52, true),
  ((select id from site.accommodation_feature_groups where code = 'essentials'), 'private-bathroom', 'Salle de bain privée', 'Private bathroom', 'private-bathroom', 10, true),
  ((select id from site.accommodation_feature_groups where code = 'essentials'), 'free-wifi', 'Wi-Fi gratuit', 'Free Wi-Fi', 'wifi', 20, true),
  ((select id from site.accommodation_feature_groups where code = 'essentials'), 'free-parking', 'Parking gratuit', 'Free parking', 'parking', 30, true),
  ((select id from site.accommodation_feature_groups where code = 'essentials'), 'tv', 'TV', 'TV', 'tv', 40, true),
  ((select id from site.accommodation_feature_groups where code = 'residence-benefits'), 'green-setting', 'Cadre verdoyant', 'Green setting', 'garden', 10, true),
  ((select id from site.accommodation_feature_groups where code = 'residence-benefits'), 'pool-access', 'Accès piscine', 'Pool access', 'pool', 20, true),
  ((select id from site.accommodation_feature_groups where code = 'residence-benefits'), 'play-areas', 'Aires de jeux', 'Play areas', 'play', 30, true)
on conflict (code) do update
set group_id = excluded.group_id, name_fr = excluded.name_fr, name_en = excluded.name_en, icon_key = excluded.icon_key, sort_order = excluded.sort_order, is_active = excluded.is_active, updated_at = now();

insert into site.accommodations (
  code, name_fr, name_en, short_description_fr, short_description_en, description_fr, description_en,
  category_fr, category_en, capacity, surface_m2, price_from, currency, sort_order, is_active
)
values
  ('appartement', 'Appartement', 'Apartment', 'Grand espace, grand confort.', 'Generous space and full comfort.', 'Grand espace, grand confort.', 'Generous space and full comfort.', 'Espace de Vie', 'Living Space', 6, 50, 240000, 'MGA', 10, true),
  ('cozy', 'Cozy', 'Cozy', 'Solo ou duo.', 'For one or two guests.', 'Solo ou duo.', 'For one or two guests.', 'Chambre', 'Room', 2, 20, 140000, 'MGA', 20, true),
  ('cozy-familiale', 'Cozy Familiale', 'Family Cozy', 'Pratique et conviviale pour les séjours en famille.', 'Practical and welcoming for family stays.', 'Pratique et conviviale pour les séjours en famille.', 'Practical and welcoming for family stays.', 'Chambre', 'Room', 4, 20, 185000, 'MGA', 30, true),
  ('cozy-twin', 'Cozy Twin', 'Cozy Twin', 'Deux lits séparés, plus de liberté.', 'Twin beds for more flexibility.', 'Deux lits séparés, plus de liberté.', 'Twin beds for more flexibility.', 'Chambre', 'Room', 2, 20, 160000, 'MGA', 40, true),
  ('cozy-triple', 'Cozy Triple', 'Cozy Triple', 'Pratique et conviviale, idéale pour trois.', 'Practical and welcoming, ideal for three.', 'Pratique et conviviale, idéale pour trois.', 'Practical and welcoming, ideal for three.', 'Chambre', 'Room', 3, 20, 175000, 'MGA', 50, true),
  ('studio-vip', 'Studio VIP', 'VIP Studio', 'Spacieux et raffiné, pour un séjour tout confort.', 'Spacious and refined for a comfortable stay.', 'Spacieux et raffiné, pour un séjour tout confort.', 'Spacious and refined for a comfortable stay.', 'Espace Studio', 'Studio Space', 2, 40, 240000, 'MGA', 60, true),
  ('studio-confort', 'Studio Confort', 'Comfort Studio', 'Spacieux et pratique, idéal pour un séjour en toute autonomie.', 'Spacious and practical, ideal for an independent stay.', 'Spacieux et pratique, idéal pour un séjour en toute autonomie.', 'Spacious and practical, ideal for an independent stay.', 'Espace Studio', 'Studio Space', 2, 37, 210000, 'MGA', 70, true),
  ('vintage-double', 'Vintage Double', 'Vintage Double', 'Charme vintage, avec terrasse.', 'Vintage charm with a terrace.', 'Charme vintage, avec terrasse.', 'Vintage charm with a terrace.', 'Chambre', 'Room', 2, 25, 170000, 'MGA', 80, true),
  ('vintage-superieure', 'Vintage Supérieure', 'Superior Vintage', 'Plus équipée, avec terrasse privée.', 'More fully equipped, with a private terrace.', 'Plus équipée, avec terrasse privée.', 'More fully equipped, with a private terrace.', 'Chambre', 'Room', 2, 25, 190000, 'MGA', 90, true),
  ('vintage-familiale', 'Vintage Familiale', 'Family Vintage', 'Spacieuse et conviviale pour les séjours en famille.', 'Spacious and welcoming for family stays.', 'Spacieuse et conviviale pour les séjours en famille.', 'Spacious and welcoming for family stays.', 'Chambre', 'Room', 4, 25, 205000, 'MGA', 100, true)
on conflict (code) do update
set name_fr = excluded.name_fr, name_en = excluded.name_en, short_description_fr = excluded.short_description_fr, short_description_en = excluded.short_description_en,
    description_fr = excluded.description_fr, description_en = excluded.description_en, category_fr = excluded.category_fr, category_en = excluded.category_en,
    capacity = excluded.capacity, surface_m2 = excluded.surface_m2, price_from = excluded.price_from, currency = excluded.currency, sort_order = excluded.sort_order,
    is_active = excluded.is_active, updated_at = now();

insert into site.accommodation_images (accommodation_id, image_path, alt_fr, alt_en, sort_order, is_cover, is_active)
select a.id, v.image_path, v.alt_fr, v.alt_en, v.sort_order, v.is_cover, true
from (values
  ('appartement', '/hebergement.jpeg', 'Appartement meublé à Ankerana pour six personnes', 'Furnished apartment in Ankerana for up to six guests', 10, true),
  ('appartement', '/hebergement2.jpeg', 'Appartement à La Résidence Ankerana', 'Apartment at La Résidence Ankerana', 20, false),
  ('cozy', '/hebergement.jpeg', 'Chambre Cozy à La Résidence Ankerana à Antananarivo', 'Cozy room at La Résidence Ankerana in Antananarivo', 10, true),
  ('cozy-familiale', '/hebergement.jpeg', 'Chambre Cozy Familiale à La Résidence Ankerana', 'Family Cozy room at La Résidence Ankerana', 10, true),
  ('cozy-twin', '/hebergement.jpeg', 'Chambre Cozy Twin à La Résidence Ankerana', 'Cozy Twin room at La Résidence Ankerana', 10, true),
  ('cozy-triple', '/hebergement.jpeg', 'Chambre Cozy Triple à La Résidence Ankerana', 'Cozy Triple room at La Résidence Ankerana', 10, true),
  ('studio-vip', '/hebergement.jpeg', 'Studio VIP avec coin salon à La Résidence Ankerana', 'VIP studio with lounge area at La Résidence Ankerana', 10, true),
  ('studio-confort', '/hebergement.jpeg', 'Studio Confort à La Résidence Ankerana', 'Comfort Studio at La Résidence Ankerana', 10, true),
  ('vintage-double', '/hebergement.jpeg', 'Chambre Vintage Double à La Résidence Ankerana', 'Vintage Double room at La Résidence Ankerana', 10, true),
  ('vintage-superieure', '/hebergement.jpeg', 'Chambre Vintage Supérieure à La Résidence Ankerana', 'Superior Vintage room at La Résidence Ankerana', 10, true),
  ('vintage-familiale', '/hebergement.jpeg', 'Chambre Vintage Familiale à La Résidence Ankerana', 'Family Vintage room at La Résidence Ankerana', 10, true)
) as v(code, image_path, alt_fr, alt_en, sort_order, is_cover)
join site.accommodations a on a.code = v.code
on conflict do nothing;

insert into site.accommodation_feature_links (accommodation_id, feature_id, sort_order, is_active)
select a.id, f.id, v.sort_order, true
from (values
  ('appartement','surface-50',10),('appartement','up-to-6-guests',20),('appartement','king-size-bed',30),('appartement','canal-plus-prestige',40),('appartement','equipped-kitchenette',50),
  ('cozy','surface-20',10),('cozy','queen-size-bed',20),('cozy','shower',30),('cozy','wardrobe',40),('cozy','canal-plus-basic',50),
  ('cozy-familiale','surface-20',10),('cozy-familiale','two-beds',20),('cozy-familiale','up-to-4-guests',30),('cozy-familiale','shower',40),('cozy-familiale','canal-plus-basic',50),
  ('cozy-twin','surface-20',10),('cozy-twin','two-single-beds',20),('cozy-twin','shower',30),('cozy-twin','wardrobe',40),('cozy-twin','canal-plus-basic',50),
  ('cozy-triple','surface-20',10),('cozy-triple','three-single-beds',20),('cozy-triple','shower',30),('cozy-triple','wardrobe',40),('cozy-triple','canal-plus-basic',50),
  ('studio-vip','surface-40',10),('studio-vip','queen-size-bed',20),('studio-vip','lounge-area',30),('studio-vip','equipped-kitchenette',40),('studio-vip','canal-plus-prestige',50),
  ('studio-confort','surface-37',10),('studio-confort','queen-size-bed',20),('studio-confort','equipped-kitchenette',30),('studio-confort','lounge-area',40),('studio-confort','canal-plus-prestige',50),
  ('vintage-double','surface-25',10),('vintage-double','queen-bed',20),('vintage-double','bathtub',30),('vintage-double','terrace',40),('vintage-double','canal-plus-essential',50),
  ('vintage-superieure','surface-25',10),('vintage-superieure','queen-size-bed',20),('vintage-superieure','terrace',30),('vintage-superieure','desk',40),('vintage-superieure','canal-plus-prestige',50),
  ('vintage-familiale','surface-25',10),('vintage-familiale','up-to-4-guests',20),('vintage-familiale','two-queen-size-beds',30),('vintage-familiale','bathtub',40),('vintage-familiale','canal-plus-essential',50)
) as v(accommodation_code, feature_code, sort_order)
join site.accommodations a on a.code = v.accommodation_code
join site.accommodation_features f on f.code = v.feature_code
on conflict (accommodation_id, feature_id) do update
set sort_order = excluded.sort_order, is_active = true, updated_at = now();

insert into site.accommodation_feature_links (accommodation_id, feature_id, sort_order, is_active)
select a.id, f.id, v.sort_order, true
from site.accommodations a
cross join (values
  ('private-bathroom', 110), ('free-wifi', 120), ('free-parking', 130), ('tv', 140),
  ('green-setting', 210), ('pool-access', 220), ('play-areas', 230)
) as v(feature_code, sort_order)
join site.accommodation_features f on f.code = v.feature_code
on conflict (accommodation_id, feature_id) do update
set sort_order = excluded.sort_order, is_active = true, updated_at = now();

insert into site.venue_setup_types (code, name_fr, name_en, icon_key, sort_order, is_active)
values
  ('u-shape', 'En U', 'U-shape', 'u-shape', 10, true),
  ('theatre', 'Théâtrale', 'Theatre', 'theatre', 20, true),
  ('classroom', 'En épi', 'Classroom', 'classroom', 30, true),
  ('banquet', 'En banquet', 'Banquet', 'banquet', 40, true),
  ('meeting', 'En réunion', 'Meeting', 'boardroom', 50, true)
on conflict (code) do update
set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into site.venues (
  code, name, location_fr, location_en, short_description_fr, short_description_en,
  description_fr, description_en, capacity, surface_m2, sort_order, is_active
)
values
  ('mosaic', 'Mosaic', 'Côté piscine', 'Poolside', 'Espace lumineux et modulable, idéal pour réceptions et séminaires avec vue sur les jardins.', 'A bright and flexible space, ideal for receptions and seminars with garden views.', 'Espace lumineux et modulable avec vue panoramique sur les jardins. Parfait pour les grandes réceptions, mariages et séminaires d''entreprise.', 'A bright and flexible space with panoramic garden views. Perfect for large receptions, weddings and corporate seminars.', 200, 150, 10, true),
  ('castel', 'Castel', 'Niveau réception', 'Reception level', 'Salle élégante au cœur de la résidence, parfaite pour événements professionnels et privés.', 'An elegant venue at the heart of the residence, perfect for professional and private events.', 'Salle prestigieuse avec accès indépendant, idéale pour conférences, cocktails et cérémonies.', 'A prestigious room with independent access, ideal for conferences, cocktails and ceremonies.', 200, 180, 20, true),
  ('club', 'Club', '1er étage', 'First floor', 'Espace intime et raffiné, parfait pour réunions de direction et petits événements.', 'An intimate and refined space, perfect for executive meetings and small events.', 'Salle confidentielle avec vue dégagée, équipée pour vos réunions stratégiques et dîners d''affaires.', 'A private room with open views, equipped for strategic meetings and business dinners.', 50, 60, 30, true),
  ('sp2', 'Salon Privé 2', '1er étage', 'First floor', 'Salon privé pour réunions confidentielles et entretiens stratégiques.', 'A private lounge for confidential meetings and strategic interviews.', 'Espace discret équipé pour vos comités de direction et entretiens confidentiels.', 'A discreet space equipped for executive committees and confidential interviews.', 15, 25, 40, true),
  ('sp3', 'Salon Privé 3', '1er étage', 'First floor', 'Second salon privé, idéal pour ateliers et formations en petit comité.', 'A second private lounge, ideal for workshops and small-group training sessions.', 'Espace flexible pour vos sessions de travail collaboratif et formations internes.', 'A flexible space for collaborative work sessions and internal training.', 15, 25, 50, true),
  ('chapelle', 'Chapelle', '1er étage', 'First floor', 'Lieu d''exception pour cérémonies intimes et moments solennels.', 'An exceptional place for intimate ceremonies and solemn moments.', 'Espace sacré et majestueux pour mariages, baptêmes et célébrations religieuses.', 'A sacred and majestic space for weddings, baptisms and religious celebrations.', 100, 80, 60, true),
  ('piscine', 'Espace Piscine', 'Côté Mosaic', 'Mosaic side', 'Grand espace extérieur pour événements festifs et cocktails en plein air.', 'A large outdoor area for festive events and open-air cocktails.', 'Zone piscine modulable pour soirées d''été, lancements de produits et événements festifs.', 'A flexible pool area for summer evenings, product launches and festive events.', 300, 400, 70, true),
  ('terrasse', 'Terrasse', '2e étage', 'Second floor', 'Vue panoramique sur Antananarivo pour événements avec cachet et élégance.', 'A panoramic view over Antananarivo for elegant events with character.', 'Terrasse d''exception avec vue imprenable, parfaite pour cocktails, dîners et séminaires en plein air.', 'An exceptional terrace with breathtaking views, perfect for cocktails, dinners and open-air seminars.', 150, 120, 80, true)
on conflict (code) do update
set
  name = excluded.name,
  location_fr = excluded.location_fr,
  location_en = excluded.location_en,
  short_description_fr = excluded.short_description_fr,
  short_description_en = excluded.short_description_en,
  description_fr = excluded.description_fr,
  description_en = excluded.description_en,
  capacity = excluded.capacity,
  surface_m2 = excluded.surface_m2,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into site.venue_images (venue_id, image_path, alt_fr, alt_en, sort_order, is_cover, is_active)
select v.id, i.image_path, i.alt_fr, i.alt_en, i.sort_order, i.is_cover, true
from (values
  ('mosaic','/mosaic.jpeg','Salle Mosaic à La Résidence Ankerana','Mosaic venue at La Résidence Ankerana',10,true),
  ('mosaic','/event1.jpeg','Salle Mosaic configurée pour un événement','Mosaic venue set up for an event',20,false),
  ('mosaic','/room.jpg','Vue intérieure de la salle Mosaic','Interior view of the Mosaic venue',30,false),
  ('mosaic','/hero.jpg','Espace événementiel Mosaic avec vue sur les jardins','Mosaic event space with garden views',40,false),
  ('castel','/BoardroomPrestige.jpg','Salle Castel à La Résidence Ankerana','Castel venue at La Résidence Ankerana',10,true),
  ('castel','/event1.jpeg','Salle Castel pour un événement privé','Castel venue for a private event',20,false),
  ('club','/room.jpg','Salle Club à La Résidence Ankerana','Club venue at La Résidence Ankerana',10,true),
  ('club','/chambredoublestandard1.jpg','Ambiance intime de la salle Club','Intimate atmosphere of the Club venue',20,false),
  ('sp2','/SP2.jpeg','Salon Privé 2 à La Résidence Ankerana','Private Lounge 2 at La Résidence Ankerana',10,true),
  ('sp3','/cds2.jpg','Salon Privé 3 à La Résidence Ankerana','Private Lounge 3 at La Résidence Ankerana',10,true),
  ('chapelle','/LesJardinsdAnkerana.jpg','Chapelle de La Résidence Ankerana','Chapel at La Résidence Ankerana',10,true),
  ('chapelle','/hero.jpg','Vue de la chapelle de La Résidence Ankerana','View of the chapel at La Résidence Ankerana',20,false),
  ('piscine','/hero.jpg','Espace Piscine de La Résidence Ankerana','Pool Area at La Résidence Ankerana',10,true),
  ('piscine','/event1.jpeg','Événement autour de l''Espace Piscine','Event around the Pool Area',20,false),
  ('terrasse','/Traiteur02.jpg','Terrasse de La Résidence Ankerana','Terrace at La Résidence Ankerana',10,true),
  ('terrasse','/room.jpg','Terrasse configurée pour un événement','Terrace configured for an event',20,false)
) as i(venue_code, image_path, alt_fr, alt_en, sort_order, is_cover)
join site.venues v on v.code = i.venue_code
on conflict (venue_id, image_path) do update
set alt_fr = excluded.alt_fr, alt_en = excluded.alt_en, sort_order = excluded.sort_order, is_cover = excluded.is_cover, is_active = true, updated_at = now();

insert into site.venue_setup_links (venue_id, setup_type_id, capacity, sort_order, is_active)
select v.id, s.id, null, x.sort_order, true
from (values
  ('mosaic','u-shape',10),('mosaic','theatre',20),('mosaic','classroom',30),('mosaic','banquet',40),
  ('castel','u-shape',10),('castel','theatre',20),('castel','classroom',30),('castel','banquet',40),
  ('club','u-shape',10),('club','theatre',20),('club','banquet',30),
  ('sp2','meeting',10),
  ('sp3','meeting',10),
  ('chapelle','ceremony',10),('chapelle','seated',20),
  ('piscine','cocktail',10),('piscine','buffet',20),('piscine','standing',30),
  ('terrasse','u-shape',10),('terrasse','theatre',20),('terrasse','classroom',30),('terrasse','banquet',40)
) as x(venue_code, setup_code, sort_order)
join site.venues v on v.code = x.venue_code
join site.venue_setup_types s on s.code = x.setup_code
on conflict (venue_id, setup_type_id) do update
set capacity = excluded.capacity, sort_order = excluded.sort_order, is_active = true, updated_at = now();

insert into site.restaurant_menu_categories (code, name_fr, name_en, sort_order, is_active)
values
  ('entrees', 'Entrées', 'Starters', 20, true),
  ('plats', 'Plats', 'Main courses', 30, true),
  ('desserts', 'Desserts', 'Desserts', 50, true),
  ('petit-dejeuner', 'Petit-déjeuner', 'Breakfast', 60, true),
  ('pizzas', 'Pizzas', 'Pizzas', 70, true),
  ('boissons', 'Boissons', 'Drinks', 80, true)
on conflict (code) do update
set name_fr = excluded.name_fr, name_en = excluded.name_en, sort_order = excluded.sort_order, is_active = excluded.is_active, updated_at = now();

insert into site.restaurant_menus (
  category_id, code, title_fr, title_en, short_description_fr, short_description_en,
  description_fr, description_en, sort_order, is_active
)
select c.id, m.code, m.title_fr, m.title_en, m.description_fr, m.description_en, null, null, m.sort_order, true
from (values
  ('restaurant','restaurant','La carte Le Privilège','Le Privilège menu','Carte générale et menu dégustation','Main menu and tasting menu',10),
  ('entrees','entrees','Entrées & starters','Starters','Nos entrées, salades et apéritifs','Our starters, salads and appetizers',20),
  ('plats','plats','Plats principaux','Main courses','Nos plats du jour et nos grands classiques','Our daily dishes and signature classics',30),
  ('malagasy','malagasy','Saveurs malagasy','Malagasy flavours','Découvrez nos spécialités locales','Discover our local specialties',40),
  ('desserts','desserts','Desserts & gourmandises','Desserts and treats','Nos desserts et pâtisseries maison','Our desserts and homemade pastries',50),
  ('petit-dejeuner','petit-dejeuner','Matin gourmand','Gourmet morning','Nos formules de petit-déjeuner','Our breakfast options',60),
  ('pizzas','pizzas','Nos pizzas','Our pizzas','Découvrez nos pizzas artisanales','Discover our artisan pizzas',70),
  ('boissons','boissons','Vins & boissons','Wines and drinks','Notre sélection de vins et boissons','Our selection of wines and drinks',80)
) as m(category_code, code, title_fr, title_en, description_fr, description_en, sort_order)
join site.restaurant_menu_categories c on c.code = m.category_code
on conflict (code) do update
set
  category_id = excluded.category_id,
  title_fr = excluded.title_fr,
  title_en = excluded.title_en,
  short_description_fr = excluded.short_description_fr,
  short_description_en = excluded.short_description_en,
  description_fr = excluded.description_fr,
  description_en = excluded.description_en,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into site.restaurant_menu_images (menu_id, image_path, alt_fr, alt_en, sort_order, is_cover, is_active)
select m.id, i.image_path, i.alt_fr, i.alt_en, i.sort_order, i.is_cover, true
from (values
  ('restaurant','/menu-le-privilege-restaurant-ankerana-couverture.jpeg','Carte générale du restaurant Le Privilège à Ankerana','Main menu at Le Privilège restaurant in Ankerana',10,true),
  ('restaurant','/menu-degustation-le-privilege.jpeg','Menu dégustation du restaurant Le Privilège','Tasting menu at Le Privilège restaurant',20,false),
  ('entrees','/menu-entrees-starters-le-privilege-ankerana.jpeg','Carte des entrées et starters du restaurant Le Privilège','Starters menu at Le Privilège restaurant',10,true),
  ('plats','/menu-plats-restaurant-le-privilege-ankerana.jpeg','Carte des plats principaux du restaurant Le Privilège','Main courses menu at Le Privilège restaurant',10,true),
  ('malagasy','/menu-saveurs-malagasy-le-privilege-ankerana.jpeg','Carte des saveurs malagasy du restaurant Le Privilège','Malagasy flavours menu at Le Privilège restaurant',10,true),
  ('desserts','/menu-desserts-le-privilege-ankerana.jpeg','Carte des desserts du restaurant Le Privilège','Desserts menu at Le Privilège restaurant',10,true),
  ('desserts','/menu-patisseries-le-privilege.jpeg','Carte des pâtisseries maison du restaurant Le Privilège','Homemade pastries menu at Le Privilège restaurant',20,false),
  ('petit-dejeuner','/menu-matin-gourmand-la-residence-ankerana.jpeg','Carte petit-déjeuner Matin gourmand à La Résidence Ankerana','Gourmet morning breakfast menu at La Résidence Ankerana',10,true),
  ('pizzas','/menu-pizzas-la-residence-ankerana.jpeg','Carte des pizzas artisanales de La Résidence Ankerana','Artisan pizza menu at La Résidence Ankerana',10,true),
  ('boissons','/carte-vins-la-residence-ankerana.jpeg','Carte des vins et boissons de La Résidence Ankerana','Wine and drinks menu at La Résidence Ankerana',10,true)
) as i(menu_code, image_path, alt_fr, alt_en, sort_order, is_cover)
join site.restaurant_menus m on m.code = i.menu_code
on conflict (menu_id, image_path) do update
set alt_fr = excluded.alt_fr, alt_en = excluded.alt_en, sort_order = excluded.sort_order, is_cover = excluded.is_cover, is_active = true, updated_at = now();
