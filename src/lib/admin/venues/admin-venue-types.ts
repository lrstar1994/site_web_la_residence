export type AdminVenue = {
  id: string;
  code: string;
  name: string;
  locationFr: string;
  locationEn: string;
  shortDescriptionFr: string;
  shortDescriptionEn: string;
  capacity: number;
  surfaceM2: number | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  coverImage: string | null;
  imageCount: number;
  setupCount: number;
};

export type AdminVenueImage = {
  id: string;
  imagePath: string;
  altFr: string;
  altEn: string;
  sortOrder: number;
  isCover: boolean;
  isActive: boolean;
};

export type AdminVenueDetail = Omit<AdminVenue, "coverImage" | "imageCount" | "setupCount" | "surfaceM2" | "sortOrder"> & {
  surfaceM2: string;
  sortOrder: string;
  images: AdminVenueImage[];
  selectedSetupIds: string[];
};

export type AdminVenueSetup = {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  usageCount: number;
};

export type AdminVenueFormValues = {
  code: string;
  name: string;
  locationFr: string;
  locationEn: string;
  shortDescriptionFr: string;
  shortDescriptionEn: string;
  capacity: string;
  surfaceM2: string;
  sortOrder: string;
  isActive: boolean;
  coverImageValue: string;
  deletedImageIds: string[];
};

export type AdminVenueFormState = {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  values: AdminVenueFormValues;
};

export type AdminVenueSetupFormValues = {
  code: string;
  nameFr: string;
  nameEn: string;
  iconKey: string;
  sortOrder: string;
  isActive: boolean;
};

export type AdminVenueSetupFormState = {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  values: AdminVenueSetupFormValues;
};

export const emptyVenueFormValues: AdminVenueFormValues = {
  code: "",
  name: "",
  locationFr: "",
  locationEn: "",
  shortDescriptionFr: "",
  shortDescriptionEn: "",
  capacity: "10",
  surfaceM2: "",
  sortOrder: "0",
  isActive: true,
  coverImageValue: "",
  deletedImageIds: [],
};

export const emptyVenueSetupFormValues: AdminVenueSetupFormValues = {
  code: "",
  nameFr: "",
  nameEn: "",
  iconKey: "",
  sortOrder: "0",
  isActive: true,
};
