import type { Locale } from "@/lib/i18n/routing";

type LocalizedText = Record<Locale, string>;

export type EventService = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  alt: LocalizedText;
};

export const eventServices: EventService[] = [
  {
    id: "seminaire",
    title: {
      fr: "Séminaire",
      en: "Seminar",
    },
    description: {
      fr: "Conférences, formations, ateliers et activités de team-building dans un environnement propice au travail et à la détente.",
      en: "Conferences, training sessions, workshops and team-building activities in a setting suited to work and relaxation.",
    },
    image: "/evenements.jpeg",
    alt: {
      fr: "Séminaire organisé à La Résidence Ankerana",
      en: "Seminar at La Résidence Ankerana",
    },
  },
  {
    id: "ceremonies",
    title: {
      fr: "Mariage / Vodiondry / Baptême / Anniversaire",
      en: "Wedding / Vodiondry / Baptism / Birthday",
    },
    description: {
      fr: "Des moments uniques célébrés avec élégance, dans un cadre calme et avec une organisation attentive.",
      en: "Celebrate weddings, traditional ceremonies, baptisms and birthdays in an elegant and peaceful setting.",
    },
    image: "/chapelle-la-residence-ankerana.jpg",
    alt: {
      fr: "Cérémonie dans la chapelle de La Résidence Ankerana",
      en: "Ceremony in the chapel at La Résidence Ankerana",
    },
  },
  {
    id: "piscine",
    title: {
      fr: "Événements Piscine",
      en: "Poolside Events",
    },
    description: {
      fr: "Cocktails, journées de détente et célébrations conviviales dans les espaces situés autour de la piscine.",
      en: "Cocktails, relaxing days and friendly celebrations in our poolside spaces.",
    },
    image: "/espace-piscine-la-residence-ankerana.jpg",
    alt: {
      fr: "Événement au bord de la piscine à La Résidence Ankerana",
      en: "Poolside event at La Résidence Ankerana",
    },
  },
  {
    id: "traiteur",
    title: {
      fr: "Service Traiteur",
      en: "Catering Service",
    },
    description: {
      fr: "Une cuisine raffinée proposée sur place ou en prestation extérieure pour accompagner vos réceptions.",
      en: "Refined catering services available on site or at an external venue for your events.",
    },
    image: "/restaurant.jpeg",
    alt: {
      fr: "Service traiteur de La Résidence Ankerana",
      en: "Catering service by La Résidence Ankerana",
    },
  },
];
