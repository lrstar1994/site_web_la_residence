export type AdminRestaurantCategory = {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  usageCount: number;
};

export type AdminRestaurantMenu = {
  id: string;
  code: string;
  categoryId: string;
  categoryNameFr: string;
  titleFr: string;
  titleEn: string;
  shortDescriptionFr: string;
  shortDescriptionEn: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  coverImage: string | null;
  imageCount: number;
};

export type AdminRestaurantMenuImage = {
  id: string;
  imagePath: string;
  altFr: string;
  altEn: string;
  isCover: boolean;
  isActive: boolean;
};

export type AdminRestaurantMenuDetail = Omit<AdminRestaurantMenu, "sortOrder"> & {
  sortOrder: string;
  images: AdminRestaurantMenuImage[];
};

export type AdminRestaurantMenuFormValues = {
  code: string;
  categoryId: string;
  titleFr: string;
  titleEn: string;
  shortDescriptionFr: string;
  shortDescriptionEn: string;
  sortOrder: string;
  isActive: boolean;
  coverImageValue: string;
  deletedImageIds: string[];
};

export type AdminRestaurantCategoryFormValues = {
  code: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  sortOrder: string;
  isActive: boolean;
};

export type AdminRestaurantFormState<T> = {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
  values: T;
};

export const emptyRestaurantMenuFormValues: AdminRestaurantMenuFormValues = {
  code: "",
  categoryId: "",
  titleFr: "",
  titleEn: "",
  shortDescriptionFr: "",
  shortDescriptionEn: "",
  sortOrder: "0",
  isActive: true,
  coverImageValue: "",
  deletedImageIds: [],
};

export const emptyRestaurantCategoryFormValues: AdminRestaurantCategoryFormValues = {
  code: "",
  nameFr: "",
  nameEn: "",
  descriptionFr: "",
  descriptionEn: "",
  sortOrder: "0",
  isActive: true,
};
