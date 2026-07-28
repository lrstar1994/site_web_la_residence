import type { Locale } from "@/lib/i18n/routing";

type LocalizedText = Record<Locale, string>;

export type Accommodation = {
  id: string;
  category: LocalizedText;
  name: LocalizedText;
  subtitle: LocalizedText;
  price: string;
  surface: string;
  capacity: LocalizedText;
  atouts: LocalizedText[];
  essentials: LocalizedText[];
  plus: LocalizedText[];
  images: string[];
};

const commonEssentials: LocalizedText[] = [
  {
    fr: "Salle de bain privée",
    en: "Private bathroom",
  },
  {
    fr: "Wi-Fi gratuit",
    en: "Free Wi-Fi",
  },
  {
    fr: "Parking gratuit",
    en: "Free parking",
  },
  {
    fr: "TV",
    en: "TV",
  },
];

const residencePlus: LocalizedText[] = [
  {
    fr: "Cadre verdoyant",
    en: "Green setting",
  },
  {
    fr: "Accès piscine",
    en: "Pool access",
  },
  {
    fr: "Aires de jeux",
    en: "Play areas",
  },
];

const roomCategory = {
  fr: "Chambre",
  en: "Room",
};

const studioCategory = {
  fr: "Espace Studio",
  en: "Studio Space",
};

export const accommodations: Accommodation[] = [
  {
    id: "appartement",
    category: {
      fr: "Espace de Vie",
      en: "Living Space",
    },
    name: {
      fr: "Appartement",
      en: "Apartment",
    },
    subtitle: {
      fr: "Grand espace, grand confort.",
      en: "Generous space and full comfort.",
    },
    price: "240 000",
    surface: "50 m²",
    capacity: {
      fr: "6 pers.",
      en: "6 guests",
    },
    atouts: [
      { fr: "50 m²", en: "50 m²" },
      { fr: "Jusqu'à 6 personnes", en: "Up to 6 guests" },
      { fr: "Lit King size", en: "King size bed" },
      { fr: "Canal Plus Prestige", en: "Canal Plus Prestige" },
      { fr: "Kitchenette équipée", en: "Equipped kitchenette" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg", "/hebergement2.jpeg"],
  },
  {
    id: "cozy",
    category: roomCategory,
    name: {
      fr: "Cozy",
      en: "Cozy",
    },
    subtitle: {
      fr: "Solo ou duo.",
      en: "For one or two guests.",
    },
    price: "140 000",
    surface: "20 m²",
    capacity: {
      fr: "2 pers.",
      en: "2 guests",
    },
    atouts: [
      { fr: "20 m²", en: "20 m²" },
      { fr: "Lit Queen size", en: "Queen size bed" },
      { fr: "Douche", en: "Shower" },
      { fr: "Penderie", en: "Wardrobe" },
      { fr: "Canal Plus Basic", en: "Canal Plus Basic" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
  {
    id: "cozy-familiale",
    category: roomCategory,
    name: {
      fr: "Cozy Familiale",
      en: "Family Cozy",
    },
    subtitle: {
      fr: "Pratique et conviviale pour les séjours en famille.",
      en: "Practical and welcoming for family stays.",
    },
    price: "185 000",
    surface: "20 m²",
    capacity: {
      fr: "4 pers.",
      en: "4 guests",
    },
    atouts: [
      { fr: "20 m²", en: "20 m²" },
      { fr: "Deux lits", en: "Two beds" },
      { fr: "Jusqu'à 4 personnes", en: "Up to 4 guests" },
      { fr: "Douche", en: "Shower" },
      { fr: "Canal Plus Basic", en: "Canal Plus Basic" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
  {
    id: "cozy-twin",
    category: roomCategory,
    name: {
      fr: "Cozy Twin",
      en: "Cozy Twin",
    },
    subtitle: {
      fr: "Deux lits séparés, plus de liberté.",
      en: "Twin beds for more flexibility.",
    },
    price: "160 000",
    surface: "20 m²",
    capacity: {
      fr: "2 pers.",
      en: "2 guests",
    },
    atouts: [
      { fr: "20 m²", en: "20 m²" },
      { fr: "Deux lits simples", en: "Two single beds" },
      { fr: "Douche", en: "Shower" },
      { fr: "Penderie", en: "Wardrobe" },
      { fr: "Canal Plus Basic", en: "Canal Plus Basic" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
  {
    id: "cozy-triple",
    category: roomCategory,
    name: {
      fr: "Cozy Triple",
      en: "Cozy Triple",
    },
    subtitle: {
      fr: "Pratique et conviviale, idéale pour trois.",
      en: "Practical and welcoming, ideal for three.",
    },
    price: "175 000",
    surface: "20 m²",
    capacity: {
      fr: "3 pers.",
      en: "3 guests",
    },
    atouts: [
      { fr: "20 m²", en: "20 m²" },
      { fr: "Trois lits simples", en: "Three single beds" },
      { fr: "Douche", en: "Shower" },
      { fr: "Penderie", en: "Wardrobe" },
      { fr: "Canal Plus Basic", en: "Canal Plus Basic" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
  {
    id: "studio-vip",
    category: studioCategory,
    name: {
      fr: "Studio VIP",
      en: "VIP Studio",
    },
    subtitle: {
      fr: "Spacieux et raffiné, pour un séjour tout confort.",
      en: "Spacious and refined for a comfortable stay.",
    },
    price: "240 000",
    surface: "40 m²",
    capacity: {
      fr: "2 pers.",
      en: "2 guests",
    },
    atouts: [
      { fr: "40 m²", en: "40 m²" },
      { fr: "Lit Queen size", en: "Queen size bed" },
      { fr: "Coin salon", en: "Lounge area" },
      { fr: "Kitchenette équipée", en: "Equipped kitchenette" },
      { fr: "Canal Plus Prestige", en: "Canal Plus Prestige" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
  {
    id: "studio-confort",
    category: studioCategory,
    name: {
      fr: "Studio Confort",
      en: "Comfort Studio",
    },
    subtitle: {
      fr: "Spacieux et pratique, idéal pour un séjour en toute autonomie.",
      en: "Spacious and practical, ideal for an independent stay.",
    },
    price: "210 000",
    surface: "37 m²",
    capacity: {
      fr: "2 pers.",
      en: "2 guests",
    },
    atouts: [
      { fr: "37 m²", en: "37 m²" },
      { fr: "Lit Queen size", en: "Queen size bed" },
      { fr: "Kitchenette équipée", en: "Equipped kitchenette" },
      { fr: "Coin salon", en: "Lounge area" },
      { fr: "Canal Plus Prestige", en: "Canal Plus Prestige" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
  {
    id: "vintage-double",
    category: roomCategory,
    name: {
      fr: "Vintage Double",
      en: "Vintage Double",
    },
    subtitle: {
      fr: "Charme vintage, avec terrasse.",
      en: "Vintage charm with a terrace.",
    },
    price: "170 000",
    surface: "25 m²",
    capacity: {
      fr: "2 pers.",
      en: "2 guests",
    },
    atouts: [
      { fr: "25 m²", en: "25 m²" },
      { fr: "Lit Queen", en: "Queen bed" },
      { fr: "Baignoire", en: "Bathtub" },
      { fr: "Terrasse", en: "Terrace" },
      { fr: "Canal Plus Essentiel", en: "Canal Plus Essentiel" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
  {
    id: "vintage-superieure",
    category: roomCategory,
    name: {
      fr: "Vintage Supérieure",
      en: "Superior Vintage",
    },
    subtitle: {
      fr: "Plus équipée, avec terrasse privée.",
      en: "More fully equipped, with a private terrace.",
    },
    price: "190 000",
    surface: "25 m²",
    capacity: {
      fr: "2 pers.",
      en: "2 guests",
    },
    atouts: [
      { fr: "25 m²", en: "25 m²" },
      { fr: "Lit Queen size", en: "Queen size bed" },
      { fr: "Terrasse", en: "Terrace" },
      { fr: "Bureau", en: "Desk" },
      { fr: "Canal Plus Prestige", en: "Canal Plus Prestige" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
  {
    id: "vintage-familiale",
    category: roomCategory,
    name: {
      fr: "Vintage Familiale",
      en: "Family Vintage",
    },
    subtitle: {
      fr: "Spacieuse et conviviale pour les séjours en famille.",
      en: "Spacious and welcoming for family stays.",
    },
    price: "205 000",
    surface: "25 m²",
    capacity: {
      fr: "4 pers.",
      en: "4 guests",
    },
    atouts: [
      { fr: "25 m²", en: "25 m²" },
      { fr: "Jusqu'à 4 personnes", en: "Up to 4 guests" },
      { fr: "Deux lits Queen size", en: "Two queen size beds" },
      { fr: "Baignoire", en: "Bathtub" },
      { fr: "Canal Plus Essentiel", en: "Canal Plus Essentiel" },
    ],
    essentials: commonEssentials,
    plus: residencePlus,
    images: ["/hebergement.jpeg"],
  },
];
