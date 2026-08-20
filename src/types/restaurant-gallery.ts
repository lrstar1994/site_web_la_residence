import type { Locale } from "@/lib/i18n/routing";

type LocalizedText = Record<Locale, string>;

export type RestaurantGalleryImage = {
  id: string;

  imagePath: string;

  alt: LocalizedText;

  sortOrder: number;

  isFeatured: boolean;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
};

export type RestaurantGalleryResult =
  | {
      ok: true;
      images: RestaurantGalleryImage[];
      featuredImages: RestaurantGalleryImage[];
    }
  | {
      ok: false;
      images: RestaurantGalleryImage[];
      featuredImages: RestaurantGalleryImage[];
      error: string;
    };
