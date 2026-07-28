export type AccommodationFeatureGroupCode =
  | "assets"
  | "essentials"
  | "residence-benefits";

export type AccommodationFeature = {
  id: string;
  code: string;
  groupCode: AccommodationFeatureGroupCode;
  name: {
    fr: string;
    en: string;
  };
  description: {
    fr: string | null;
    en: string | null;
  };
  iconKey: string | null;
  sortOrder: number;
  customLabel: {
    fr: string | null;
    en: string | null;
  };
};

export type AccommodationFeatureGroup = {
  id: string;
  code: AccommodationFeatureGroupCode;
  name: {
    fr: string;
    en: string;
  };
  sortOrder: number;
  features: AccommodationFeature[];
};

export type AccommodationImage = {
  id: string;
  imagePath: string;
  alt: {
    fr: string;
    en: string;
  };
  sortOrder: number;
  isCover: boolean;
  isActive: boolean;
};

export type Accommodation = {
  id: string;
  code: string;
  name: {
    fr: string;
    en: string;
  };
  shortDescription: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
  category: {
    fr: string | null;
    en: string | null;
  };
  capacity: number;
  surfaceM2: number | null;
  priceFrom: number;
  currency: "MGA";
  sortOrder: number;
  isActive: boolean;
  images: AccommodationImage[];
  featureGroups: AccommodationFeatureGroup[];
  createdAt: string;
  updatedAt: string;
};

export type AccommodationCardModel = {
  id: string;
  category: { fr: string; en: string };
  name: { fr: string; en: string };
  subtitle: { fr: string; en: string };
  price: string;
  surface: string;
  capacity: { fr: string; en: string };
  atouts: { fr: string; en: string }[];
  essentials: { fr: string; en: string }[];
  plus: { fr: string; en: string }[];
  images: string[];
  featureGroups?: AccommodationFeatureGroup[];
};
