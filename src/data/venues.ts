import type { Locale } from "@/lib/i18n/routing";

type LocalizedText = Record<Locale, string>;

export type VenueImage = {
  src: string;
  alt: LocalizedText;
};

export type Venue = {
  id: string;
  name: LocalizedText;
  location: LocalizedText;
  capacity: LocalizedText;
  area: string;
  shortDescription: LocalizedText;
  fullDescription: LocalizedText;
  setups: LocalizedText[];
  coverImage: VenueImage;
  images: VenueImage[];
};

export const venues: Venue[] = [
  {
    id: "mosaic",
    name: { fr: "Mosaic", en: "Mosaic" },
    location: { fr: "Côté piscine", en: "Poolside" },
    capacity: { fr: "200 personnes", en: "200 guests" },
    area: "150 m²",
    shortDescription: {
      fr: "Espace lumineux et modulable, idéal pour réceptions et séminaires avec vue sur les jardins.",
      en: "A bright and flexible space, ideal for receptions and seminars with garden views.",
    },
    fullDescription: {
      fr: "Espace lumineux et modulable avec vue panoramique sur les jardins. Parfait pour les grandes réceptions, mariages et séminaires d'entreprise.",
      en: "A bright and flexible space with panoramic garden views. Perfect for large receptions, weddings and corporate seminars.",
    },
    setups: [
      { fr: "En U", en: "U-shape" },
      { fr: "Théâtrale", en: "Theatre" },
      { fr: "En épi", en: "Classroom" },
      { fr: "En banquet", en: "Banquet" },
    ],
    coverImage: {
      src: "/mosaic.jpeg",
      alt: {
        fr: "Salle Mosaic à La Résidence Ankerana",
        en: "Mosaic venue at La Résidence Ankerana",
      },
    },
    images: [
      {
        src: "/event1.jpeg",
        alt: {
          fr: "Salle Mosaic configurée pour un événement",
          en: "Mosaic venue set up for an event",
        },
      },
      {
        src: "/room.jpg",
        alt: {
          fr: "Vue intérieure de la salle Mosaic",
          en: "Interior view of the Mosaic venue",
        },
      },
      {
        src: "/hero.jpg",
        alt: {
          fr: "Espace événementiel Mosaic avec vue sur les jardins",
          en: "Mosaic event space with garden views",
        },
      },
    ],
  },
  {
    id: "castel",
    name: { fr: "Castel", en: "Castel" },
    location: { fr: "Niveau réception", en: "Reception level" },
    capacity: { fr: "200 personnes", en: "200 guests" },
    area: "180 m²",
    shortDescription: {
      fr: "Salle élégante au cœur de la résidence, parfaite pour événements professionnels et privés.",
      en: "An elegant venue at the heart of the residence, perfect for professional and private events.",
    },
    fullDescription: {
      fr: "Salle prestigieuse avec accès indépendant, idéale pour conférences, cocktails et cérémonies.",
      en: "A prestigious room with independent access, ideal for conferences, cocktails and ceremonies.",
    },
    setups: [
      { fr: "En U", en: "U-shape" },
      { fr: "Théâtrale", en: "Theatre" },
      { fr: "En épi", en: "Classroom" },
      { fr: "En banquet", en: "Banquet" },
    ],
    coverImage: {
      src: "/BoardroomPrestige.jpg",
      alt: {
        fr: "Salle Castel à La Résidence Ankerana",
        en: "Castel venue at La Résidence Ankerana",
      },
    },
    images: [
      {
        src: "/BoardroomPrestige.jpg",
        alt: {
          fr: "Salle Castel préparée pour une réunion",
          en: "Castel venue prepared for a meeting",
        },
      },
      {
        src: "/event1.jpeg",
        alt: {
          fr: "Salle Castel pour un événement privé",
          en: "Castel venue for a private event",
        },
      },
    ],
  },
  {
    id: "club",
    name: { fr: "Club", en: "Club" },
    location: { fr: "1er étage", en: "First floor" },
    capacity: { fr: "50 personnes", en: "50 guests" },
    area: "60 m²",
    shortDescription: {
      fr: "Espace intime et raffiné, parfait pour réunions de direction et petits événements.",
      en: "An intimate and refined space, perfect for executive meetings and small events.",
    },
    fullDescription: {
      fr: "Salle confidentielle avec vue dégagée, équipée pour vos réunions stratégiques et dîners d'affaires.",
      en: "A private room with open views, equipped for strategic meetings and business dinners.",
    },
    setups: [
      { fr: "En U", en: "U-shape" },
      { fr: "Théâtrale", en: "Theatre" },
      { fr: "En banquet", en: "Banquet" },
    ],
    coverImage: {
      src: "/room.jpg",
      alt: {
        fr: "Salle Club à La Résidence Ankerana",
        en: "Club venue at La Résidence Ankerana",
      },
    },
    images: [
      {
        src: "/room.jpg",
        alt: {
          fr: "Salle Club pour réunion de direction",
          en: "Club venue for an executive meeting",
        },
      },
      {
        src: "/chambredoublestandard1.jpg",
        alt: {
          fr: "Ambiance intime de la salle Club",
          en: "Intimate atmosphere of the Club venue",
        },
      },
    ],
  },
  {
    id: "sp2",
    name: { fr: "Salon Privé 2", en: "Private Lounge 2" },
    location: { fr: "1er étage", en: "First floor" },
    capacity: { fr: "15 personnes", en: "15 guests" },
    area: "25 m²",
    shortDescription: {
      fr: "Salon privé pour réunions confidentielles et entretiens stratégiques.",
      en: "A private lounge for confidential meetings and strategic interviews.",
    },
    fullDescription: {
      fr: "Espace discret équipé pour vos comités de direction et entretiens confidentiels.",
      en: "A discreet space equipped for executive committees and confidential interviews.",
    },
    setups: [{ fr: "En réunion", en: "Meeting" }],
    coverImage: {
      src: "/SP2.jpeg",
      alt: {
        fr: "Salon Privé 2 à La Résidence Ankerana",
        en: "Private Lounge 2 at La Résidence Ankerana",
      },
    },
    images: [
      {
        src: "/SP2.jpeg",
        alt: {
          fr: "Salon Privé 2 pour réunion confidentielle",
          en: "Private Lounge 2 for a confidential meeting",
        },
      },
    ],
  },
  {
    id: "sp3",
    name: { fr: "Salon Privé 3", en: "Private Lounge 3" },
    location: { fr: "1er étage", en: "First floor" },
    capacity: { fr: "15 personnes", en: "15 guests" },
    area: "25 m²",
    shortDescription: {
      fr: "Second salon privé, idéal pour ateliers et formations en petit comité.",
      en: "A second private lounge, ideal for workshops and small-group training sessions.",
    },
    fullDescription: {
      fr: "Espace flexible pour vos sessions de travail collaboratif et formations internes.",
      en: "A flexible space for collaborative work sessions and internal training.",
    },
    setups: [{ fr: "En réunion", en: "Meeting" }],
    coverImage: {
      src: "/cds2.jpg",
      alt: {
        fr: "Salon Privé 3 à La Résidence Ankerana",
        en: "Private Lounge 3 at La Résidence Ankerana",
      },
    },
    images: [
      {
        src: "/cds2.jpg",
        alt: {
          fr: "Salon Privé 3 pour atelier en petit comité",
          en: "Private Lounge 3 for a small-group workshop",
        },
      },
    ],
  },
  {
    id: "chapelle",
    name: { fr: "Chapelle", en: "Chapel" },
    location: { fr: "1er étage", en: "First floor" },
    capacity: { fr: "100 personnes", en: "100 guests" },
    area: "80 m²",
    shortDescription: {
      fr: "Lieu d'exception pour cérémonies intimes et moments solennels.",
      en: "An exceptional place for intimate ceremonies and solemn moments.",
    },
    fullDescription: {
      fr: "Espace sacré et majestueux pour mariages, baptêmes et célébrations religieuses.",
      en: "A sacred and majestic space for weddings, baptisms and religious celebrations.",
    },
    setups: [
      { fr: "Cérémonie", en: "Ceremony" },
      { fr: "Assis", en: "Seated" },
    ],
    coverImage: {
      src: "/LesJardinsdAnkerana.jpg",
      alt: {
        fr: "Chapelle de La Résidence Ankerana",
        en: "Chapel at La Résidence Ankerana",
      },
    },
    images: [
      {
        src: "/LesJardinsdAnkerana.jpg",
        alt: {
          fr: "Chapelle pour cérémonie à La Résidence Ankerana",
          en: "Chapel for a ceremony at La Résidence Ankerana",
        },
      },
      {
        src: "/hero.jpg",
        alt: {
          fr: "Vue de la chapelle de La Résidence Ankerana",
          en: "View of the chapel at La Résidence Ankerana",
        },
      },
    ],
  },
  {
    id: "piscine",
    name: { fr: "Espace Piscine", en: "Pool Area" },
    location: { fr: "Côté Mosaic", en: "Mosaic side" },
    capacity: { fr: "300 personnes", en: "300 guests" },
    area: "400 m²",
    shortDescription: {
      fr: "Grand espace extérieur pour événements festifs et cocktails en plein air.",
      en: "A large outdoor area for festive events and open-air cocktails.",
    },
    fullDescription: {
      fr: "Zone piscine modulable pour soirées d'été, lancements de produits et événements festifs.",
      en: "A flexible pool area for summer evenings, product launches and festive events.",
    },
    setups: [
      { fr: "Cocktail", en: "Cocktail" },
      { fr: "Buffet", en: "Buffet" },
      { fr: "Debout", en: "Standing" },
    ],
    coverImage: {
      src: "/hero.jpg",
      alt: {
        fr: "Espace Piscine de La Résidence Ankerana",
        en: "Pool Area at La Résidence Ankerana",
      },
    },
    images: [
      {
        src: "/hero.jpg",
        alt: {
          fr: "Espace Piscine pour cocktail en plein air",
          en: "Pool Area for an open-air cocktail",
        },
      },
      {
        src: "/event1.jpeg",
        alt: {
          fr: "Événement autour de l'Espace Piscine",
          en: "Event around the Pool Area",
        },
      },
    ],
  },
  {
    id: "terrasse",
    name: { fr: "Terrasse", en: "Terrace" },
    location: { fr: "2e étage", en: "Second floor" },
    capacity: { fr: "150 personnes", en: "150 guests" },
    area: "120 m²",
    shortDescription: {
      fr: "Vue panoramique sur Antananarivo pour événements avec cachet et élégance.",
      en: "A panoramic view over Antananarivo for elegant events with character.",
    },
    fullDescription: {
      fr: "Terrasse d'exception avec vue imprenable, parfaite pour cocktails, dîners et séminaires en plein air.",
      en: "An exceptional terrace with breathtaking views, perfect for cocktails, dinners and open-air seminars.",
    },
    setups: [
      { fr: "En U", en: "U-shape" },
      { fr: "Théâtrale", en: "Theatre" },
      { fr: "En épi", en: "Classroom" },
      { fr: "En banquet", en: "Banquet" },
    ],
    coverImage: {
      src: "/Traiteur02.jpg",
      alt: {
        fr: "Terrasse de La Résidence Ankerana",
        en: "Terrace at La Résidence Ankerana",
      },
    },
    images: [
      {
        src: "/Traiteur02.jpg",
        alt: {
          fr: "Terrasse avec vue sur Antananarivo",
          en: "Terrace with a view over Antananarivo",
        },
      },
      {
        src: "/room.jpg",
        alt: {
          fr: "Terrasse configurée pour un événement",
          en: "Terrace configured for an event",
        },
      },
    ],
  },
];
