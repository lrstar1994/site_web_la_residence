import type { AccommodationFeatureGroupCode } from "@/types/accommodation";

export type AdminAccommodationFeatureGroup = {
  id: string;
  code: AccommodationFeatureGroupCode;
  nameFr: string;
  nameEn: string;
  sortOrder: number;
};

export type AdminAccommodationFeature = {
  id: string;
  groupId: string;
  groupCode: AccommodationFeatureGroupCode;
  code: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  usageCount: number;
};

export type AdminAccommodationImage = {
  id: string;
  imagePath: string;
  altFr: string;
  altEn: string;
  sortOrder: number;
  isCover: boolean;
  isActive: boolean;
};

export type AdminAccommodationDetail = {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  categoryFr: string;
  categoryEn: string;
  shortDescriptionFr: string;
  shortDescriptionEn: string;
  capacity: number;
  surfaceM2: string;
  priceFrom: string;
  sortOrder: string;
  isActive: boolean;
  images: AdminAccommodationImage[];
  selectedFeatureIds: string[];
};

export type AdminAccommodationFormValues = {
  code: string;
  nameFr: string;
  nameEn: string;
  categoryFr: string;
  categoryEn: string;
  shortDescriptionFr: string;
  shortDescriptionEn: string;
  capacity: string;
  surfaceM2: string;
  priceFrom: string;
  sortOrder: string;
  isActive: boolean;
  coverImageValue: string;
  deletedImageIds: string[];
};

export type AdminAccommodationFormState = {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  values: AdminAccommodationFormValues;
};

export type AdminFeatureFormValues = {
  groupId: string;
  code: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  iconKey: string;
  sortOrder: string;
  isActive: boolean;
};

export type AdminFeatureFormState = {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  values: AdminFeatureFormValues;
};

export const emptyAccommodationFormValues: AdminAccommodationFormValues = {
  code: "",
  nameFr: "",
  nameEn: "",
  categoryFr: "",
  categoryEn: "",
  shortDescriptionFr: "",
  shortDescriptionEn: "",
  capacity: "2",
  surfaceM2: "",
  priceFrom: "0",
  sortOrder: "0",
  isActive: true,
  coverImageValue: "",
  deletedImageIds: [],
};

export const emptyFeatureFormValues: AdminFeatureFormValues = {
  groupId: "",
  code: "",
  nameFr: "",
  nameEn: "",
  descriptionFr: "",
  descriptionEn: "",
  iconKey: "",
  sortOrder: "0",
  isActive: true,
};
