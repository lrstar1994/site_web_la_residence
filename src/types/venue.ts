import type { Locale } from "@/lib/i18n/routing";

type LocalizedText = Record<Locale, string>;

export type VenueImage = {
  id: string;
  imagePath: string;
  alt: LocalizedText;
  sortOrder: number;
  isCover: boolean;
  isActive: boolean;
};

export type VenueSetup = {
  id: string;
  code: string;
  name: LocalizedText;
  iconKey: string | null;
  capacity: number | null;
  sortOrder: number;
  isActive: boolean;
};

export type VenueUsePresentation = {
  id: string;
  useTypeId: string;
  useTypeCode: string;
  useTypeName: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  images: VenueImage[];
  coverImage: VenueImage | null;
  sortOrder: number;
  isActive: boolean;
};

export type Venue = {
  id: string;
  code: string;
  name: string;
  location: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  capacity: number;
  surfaceM2: number | null;
  sortOrder: number;
  isActive: boolean;
  images: VenueImage[];
  setups: VenueSetup[];
  uses: VenueUsePresentation[];
  createdAt: string;
  updatedAt: string;
};

export type VenueCardModel = {
  id: string;
  code?: string;
  name: LocalizedText;
  location: LocalizedText;
  capacity: LocalizedText;
  area: string;
  shortDescription: LocalizedText;
  fullDescription: LocalizedText;
  setups: LocalizedText[];
  setupItems?: VenueSetup[];
  coverImage: {
    src: string;
    alt: LocalizedText;
  };
  images: Array<{
    src: string;
    alt: LocalizedText;
  }>;
  allImages: Array<{
    src: string;
    alt: LocalizedText;
  }>;
  uses: Array<{
    id: string;
    useTypeCode: string;
    useTypeName: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    images: Array<{
      src: string;
      alt: LocalizedText;
    }>;
  }>;
};
