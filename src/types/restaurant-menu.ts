import type { Locale } from "@/lib/i18n/routing";

type LocalizedText = Record<Locale, string>;

export type RestaurantMenuCategory = {
  id: string;
  code: string;
  name: LocalizedText;
  description: { fr: string | null; en: string | null };
  sortOrder: number;
  isActive: boolean;
};

export type RestaurantMenuImage = {
  id: string;
  imagePath: string;
  alt: LocalizedText;
  sortOrder: number;
  isCover: boolean;
  isActive: boolean;
};

export type RestaurantMenu = {
  id: string;
  code: string;
  categoryId: string;
  categoryCode: string;
  categoryName: LocalizedText;
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: { fr: string | null; en: string | null };
  sortOrder: number;
  isActive: boolean;
  images: RestaurantMenuImage[];
  createdAt: string;
  updatedAt: string;
};

export type RestaurantMenuCardModel = {
  id: string;
  label: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  cover: string;
  images: Array<{
    id: string;
    src: string;
    title: LocalizedText;
    alt: LocalizedText;
  }>;
  categoryId?: string;
  sortOrder?: number;
  isActive?: boolean;
};
