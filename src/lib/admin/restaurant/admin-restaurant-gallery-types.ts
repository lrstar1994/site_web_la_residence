export type AdminRestaurantGalleryImage = {
  id: string;

  imagePath: string;

  altFr: string;
  altEn: string;

  sortOrder: number;

  isFeatured: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};

export type AdminRestaurantGalleryImageFormState = {
  ok: boolean;

  message: string;

  fieldErrors: Record<string, string>;
};

export const emptyAdminRestaurantGalleryImageFormState: AdminRestaurantGalleryImageFormState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
  };
