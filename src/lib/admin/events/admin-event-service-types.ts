export type AdminEventServiceImage = {
  id: string;
  imagePath: string;
  altFr: string;
  altEn: string;
  sortOrder: number;
  isCover: boolean;
  isActive: boolean;
};

export type AdminEventService = {
  id: string;
  code: string;
  title: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
  imagePath: string;
  imageAlt: {
    fr: string;
    en: string;
  };
  images: AdminEventServiceImage[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminEventServiceFormValues = {
  code: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  imagePath: string;
  imageAltFr: string;
  imageAltEn: string;
  sortOrder: string;
  isActive: boolean;
  coverImageValue: string;
  deletedImageIds: string[];
};

export type AdminEventServiceFormState = {
  ok: boolean;
  message: string;
  fieldErrors: Partial<Record<keyof AdminEventServiceFormValues, string>>;
  values: AdminEventServiceFormValues;
};

export const emptyAdminEventServiceFormValues: AdminEventServiceFormValues = {
  code: "",
  titleFr: "",
  titleEn: "",
  descriptionFr: "",
  descriptionEn: "",
  imagePath: "",
  imageAltFr: "",
  imageAltEn: "",
  sortOrder: "0",
  isActive: true,
  coverImageValue: "",
  deletedImageIds: [],
};
