import type { Locale } from "@/lib/i18n/routing";

export type LocalizedText = Record<Locale, string>;

export type NewsCategory = string;

export type NewsCategoryItem = {
  code: NewsCategory;
  name: LocalizedText;
  sortOrder: number;
};

export type NewsArticle = {
  id: string;
  category: NewsCategory;
  categoryLabel?: LocalizedText;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: LocalizedText;
  publishedAt: string;
  image: string;
  alt: LocalizedText;
};

export const newsCategories: NewsCategoryItem[] = [
  {
    code: "event",
    name: {
      fr: "Événements",
      en: "Events",
    },
    sortOrder: 10,
  },
  {
    code: "restaurant",
    name: {
      fr: "Restaurant",
      en: "Restaurant",
    },
    sortOrder: 20,
  },
  {
    code: "venues",
    name: {
      fr: "Salles",
      en: "Venues",
    },
    sortOrder: 30,
  },
  {
    code: "accommodation",
    name: {
      fr: "Hébergement",
      en: "Accommodation",
    },
    sortOrder: 40,
  },
  {
    code: "offers",
    name: {
      fr: "Offres",
      en: "Offers",
    },
    sortOrder: 50,
  },
];

export const newsArticles: NewsArticle[] = [
  {
    id: "brunch",
    category: "event",
    publishedAt: "2026-06-01",
    image: "/restaurant.jpeg",
    title: {
      fr: "Brunch du dimanche à Ankerana",
      en: "Sunday brunch in Ankerana",
    },
    excerpt: {
      fr: "Un rendez-vous convivial pour profiter du restaurant Le Privilège.",
      en: "A friendly Sunday gathering at Le Privilège restaurant.",
    },
    content: {
      fr: "Le brunch du dimanche à La Résidence Ankerana est pensé comme un moment de détente à partager en famille ou entre amis.\n\nLe restaurant Le Privilège propose une sélection de plats salés et sucrés, accompagnée d’activités adaptées à l’ambiance du jour.\n\nProfitez du cadre calme d’Ankerana, du restaurant et des espaces de La Résidence pour terminer la semaine dans une atmosphère conviviale.",
      en: "Sunday brunch at La Résidence Ankerana is designed as a relaxing moment to enjoy with family or friends.\n\nLe Privilège restaurant offers a selection of savoury and sweet dishes, together with activities suited to the day’s atmosphere.\n\nEnjoy the peaceful setting of Ankerana, the restaurant and the Residence’s facilities for a friendly end to the week.",
    },
    alt: {
      fr: "Brunch au restaurant Le Privilège à La Résidence Ankerana",
      en: "Brunch at Le Privilège restaurant at La Résidence Ankerana",
    },
  },
  {
    id: "restaurant-menu",
    category: "restaurant",
    publishedAt: "2026-05-18",
    image: "/menu-plats-restaurant-le-privilege-ankerana.jpeg",
    title: {
      fr: "Nouvelle carte du restaurant",
      en: "New restaurant menu",
    },
    excerpt: {
      fr: "Découvrez les plats, pizzas, desserts et saveurs malagasy.",
      en: "Discover main courses, pizzas, desserts and Malagasy flavours.",
    },
    content: {
      fr: "Le restaurant Le Privilège renouvelle sa carte avec une sélection de recettes adaptées aux déjeuners, dîners et repas de groupe.\n\nLa nouvelle proposition met en avant plusieurs univers : plats internationaux, spécialités malagasy, pizzas, desserts et boissons.\n\nLa carte est conçue pour offrir davantage de choix aux clients de La Résidence Ankerana.",
      en: "Le Privilège restaurant has renewed its menu with a selection of dishes for lunch, dinner and group meals.\n\nThe new menu highlights international dishes, Malagasy specialities, pizzas, desserts and drinks.\n\nIt is designed to provide guests of La Résidence Ankerana with a wider choice.",
    },
    alt: {
      fr: "Nouvelle carte du restaurant Le Privilège à Ankerana",
      en: "New menu at Le Privilège restaurant in Ankerana",
    },
  },
  {
    id: "seminar",
    category: "venues",
    publishedAt: "2026-05-05",
    image: "/salles.jpeg",
    title: {
      fr: "Organiser un séminaire à Antananarivo",
      en: "Organising a seminar in Antananarivo",
    },
    excerpt: {
      fr: "Conseils pour préparer une réunion professionnelle efficace.",
      en: "Practical advice for planning an effective professional meeting.",
    },
    content: {
      fr: "La réussite d’un séminaire dépend du choix du lieu, de la configuration de la salle et de la qualité des services proposés aux participants.\n\nIl est important de définir le nombre de participants, de choisir une configuration adaptée, de prévoir le matériel audiovisuel et d’organiser les pauses ainsi que le déjeuner.\n\nLa Résidence Ankerana propose plusieurs salles modulables pour les réunions, formations, conférences et événements professionnels à Antananarivo.",
      en: "A successful seminar depends on the choice of venue, the room layout and the quality of services provided to participants.\n\nIt is important to define the number of guests, select an appropriate layout, prepare audiovisual equipment and organise breaks and lunch.\n\nLa Résidence Ankerana offers several flexible venues for meetings, training sessions, conferences and corporate events in Antananarivo.",
    },
    alt: {
      fr: "Salle de séminaire à La Résidence Ankerana à Antananarivo",
      en: "Seminar venue at La Résidence Ankerana in Antananarivo",
    },
  },
];
