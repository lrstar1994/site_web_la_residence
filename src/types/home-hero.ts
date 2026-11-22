import type { Locale } from "@/lib/i18n/routing";

export type HomeHeroImage = {
  id: string;
  imagePath: string;
  publicUrl: string;
  alt: Record<Locale, string>;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicHomeHeroImage = Pick<
  HomeHeroImage,
  "id" | "publicUrl" | "alt" | "sortOrder"
>;
