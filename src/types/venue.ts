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

/*
 * Catégorie publique d'une salle.
 *
 * Exemple :
 * - seminar
 * - reception
 */
export type VenueCategory = {
  id: string;
  code: string;
  name: LocalizedText;
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

  /*
   * Relation directe :
   * site.venues.category_id
   */
  categoryId: string;

  /*
   * Données complètes de la catégorie.
   * Null pour les anciennes salles qui
   * n'ont pas encore été classées.
   */
  category: VenueCategory | null;

  images: VenueImage[];

  setups: VenueSetup[];

  /*
   * Ancien système conservé temporairement
   * pour compatibilité avec les données
   * et le diaporama existant.
   */
  uses: VenueUsePresentation[];

  createdAt: string;
  updatedAt: string;
};

export type VenueCardImage = {
  src: string;
  alt: LocalizedText;
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

  /*
   * Catégorie utilisée pour séparer
   * l'affichage public.
   */
  category: VenueCategory | null;

  setups: LocalizedText[];

  setupItems?: VenueSetup[];

  coverImage: VenueCardImage;

  /*
   * Galerie générale de la salle.
   */
  images: VenueCardImage[];

  /*
   * Galerie mélangée utilisée par VenueCard.tsx
   * pour le diaporama automatique.
   */
  allImages?: VenueCardImage[];

  /*
   * Ancien système des usages.
   * Conservé temporairement.
   */
  uses: Array<{
    id: string;

    useTypeCode: string;

    useTypeName: LocalizedText;

    title: LocalizedText;

    description: LocalizedText;

    images: VenueCardImage[];
  }>;
};
