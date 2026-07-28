import type { Locale } from "@/lib/i18n/routing";

export type RestaurantMenuCategoryId =
  | "restaurant"
  | "entrees"
  | "plats"
  | "malagasy"
  | "desserts"
  | "petit-dejeuner"
  | "pizzas"
  | "boissons";

type LocalizedText = Record<Locale, string>;

export type RestaurantMenuImage = {
  src: string;
  title: LocalizedText;
  alt: LocalizedText;
};

export type RestaurantMenuCategory = {
  id: RestaurantMenuCategoryId;
  label: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  cover: string;
  images: RestaurantMenuImage[];
};

export const restaurantMenuCategories: RestaurantMenuCategory[] = [
  {
    id: "restaurant",
    label: { fr: "Restaurant", en: "Restaurant" },
    title: { fr: "La carte Le Privilège", en: "Le Privilège menu" },
    description: {
      fr: "Carte générale et menu dégustation",
      en: "Main menu and tasting menu",
    },
    cover: "/menu-le-privilege-restaurant-ankerana-couverture.jpeg",
    images: [
      {
        src: "/menu-le-privilege-restaurant-ankerana-couverture.jpeg",
        title: { fr: "La carte Le Privilège", en: "Le Privilège menu" },
        alt: {
          fr: "Carte générale du restaurant Le Privilège à Ankerana",
          en: "Main menu at Le Privilège restaurant in Ankerana",
        },
      },
      {
        src: "/menu-degustation-le-privilege.jpeg",
        title: { fr: "Menu dégustation", en: "Tasting menu" },
        alt: {
          fr: "Menu dégustation du restaurant Le Privilège",
          en: "Tasting menu at Le Privilège restaurant",
        },
      },
    ],
  },
  {
    id: "entrees",
    label: { fr: "Entrées", en: "Starters" },
    title: { fr: "Entrées & starters", en: "Starters" },
    description: {
      fr: "Nos entrées, salades et apéritifs",
      en: "Our starters, salads and appetizers",
    },
    cover: "/menu-entrees-starters-le-privilege-ankerana.jpeg",
    images: [
      {
        src: "/menu-entrees-starters-le-privilege-ankerana.jpeg",
        title: { fr: "Entrées & starters", en: "Starters" },
        alt: {
          fr: "Carte des entrées et starters du restaurant Le Privilège",
          en: "Starters menu at Le Privilège restaurant",
        },
      },
    ],
  },
  {
    id: "plats",
    label: { fr: "Plats", en: "Main courses" },
    title: { fr: "Plats principaux", en: "Main courses" },
    description: {
      fr: "Nos plats du jour et nos grands classiques",
      en: "Our daily dishes and signature classics",
    },
    cover: "/menu-plats-restaurant-le-privilege-ankerana.jpeg",
    images: [
      {
        src: "/menu-plats-restaurant-le-privilege-ankerana.jpeg",
        title: { fr: "Plats principaux", en: "Main courses" },
        alt: {
          fr: "Carte des plats principaux du restaurant Le Privilège",
          en: "Main courses menu at Le Privilège restaurant",
        },
      },
    ],
  },
  {
    id: "malagasy",
    label: { fr: "Malagasy", en: "Malagasy" },
    title: { fr: "Saveurs malagasy", en: "Malagasy flavours" },
    description: {
      fr: "Découvrez nos spécialités locales",
      en: "Discover our local specialties",
    },
    cover: "/menu-saveurs-malagasy-le-privilege-ankerana.jpeg",
    images: [
      {
        src: "/menu-saveurs-malagasy-le-privilege-ankerana.jpeg",
        title: { fr: "Saveurs malagasy", en: "Malagasy flavours" },
        alt: {
          fr: "Carte des saveurs malagasy du restaurant Le Privilège",
          en: "Malagasy flavours menu at Le Privilège restaurant",
        },
      },
    ],
  },
  {
    id: "desserts",
    label: { fr: "Desserts", en: "Desserts" },
    title: { fr: "Desserts & gourmandises", en: "Desserts and treats" },
    description: {
      fr: "Nos desserts et pâtisseries maison",
      en: "Our desserts and homemade pastries",
    },
    cover: "/menu-desserts-le-privilege-ankerana.jpeg",
    images: [
      {
        src: "/menu-desserts-le-privilege-ankerana.jpeg",
        title: { fr: "Desserts & gourmandises", en: "Desserts and treats" },
        alt: {
          fr: "Carte des desserts du restaurant Le Privilège",
          en: "Desserts menu at Le Privilège restaurant",
        },
      },
      {
        src: "/menu-patisseries-le-privilege.jpeg",
        title: { fr: "Pâtisseries maison", en: "Homemade pastries" },
        alt: {
          fr: "Carte des pâtisseries maison du restaurant Le Privilège",
          en: "Homemade pastries menu at Le Privilège restaurant",
        },
      },
    ],
  },
  {
    id: "petit-dejeuner",
    label: { fr: "Petit-déjeuner", en: "Breakfast" },
    title: { fr: "Matin gourmand", en: "Gourmet morning" },
    description: {
      fr: "Nos formules de petit-déjeuner",
      en: "Our breakfast options",
    },
    cover: "/menu-matin-gourmand-la-residence-ankerana.jpeg",
    images: [
      {
        src: "/menu-matin-gourmand-la-residence-ankerana.jpeg",
        title: { fr: "Matin gourmand", en: "Gourmet morning" },
        alt: {
          fr: "Carte petit-déjeuner Matin gourmand à La Résidence Ankerana",
          en: "Gourmet morning breakfast menu at La Résidence Ankerana",
        },
      },
    ],
  },
  {
    id: "pizzas",
    label: { fr: "Pizzas", en: "Pizzas" },
    title: { fr: "Nos pizzas", en: "Our pizzas" },
    description: {
      fr: "Découvrez nos pizzas artisanales",
      en: "Discover our artisan pizzas",
    },
    cover: "/menu-pizzas-la-residence-ankerana.jpeg",
    images: [
      {
        src: "/menu-pizzas-la-residence-ankerana.jpeg",
        title: { fr: "Nos pizzas", en: "Our pizzas" },
        alt: {
          fr: "Carte des pizzas artisanales de La Résidence Ankerana",
          en: "Artisan pizza menu at La Résidence Ankerana",
        },
      },
    ],
  },
  {
    id: "boissons",
    label: { fr: "Boissons", en: "Drinks" },
    title: { fr: "Vins & boissons", en: "Wines and drinks" },
    description: {
      fr: "Notre sélection de vins et boissons",
      en: "Our selection of wines and drinks",
    },
    cover: "/carte-vins-la-residence-ankerana.jpeg",
    images: [
      {
        src: "/carte-vins-la-residence-ankerana.jpeg",
        title: { fr: "Carte des vins & boissons", en: "Wine and drinks menu" },
        alt: {
          fr: "Carte des vins et boissons de La Résidence Ankerana",
          en: "Wine and drinks menu at La Résidence Ankerana",
        },
      },
    ],
  },
];
