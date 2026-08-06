export type AdminNewsStatus = "draft" | "published" | "archived";

export type AdminNewsCategory = {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  sortOrder: number;
  isActive: boolean;
};

export type AdminNewsArticle = {
  id: string;
  code: string;
  titleFr: string;
  titleEn: string;
  excerptFr: string;
  excerptEn: string;
  contentFr: string;
  contentEn: string;
  imagePath: string;
  imageAltFr: string;
  imageAltEn: string;
  images: AdminNewsArticleImage[];
  status: AdminNewsStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  category: AdminNewsCategory | null;
};

export type AdminNewsArticleImage = {
  id: string;
  imagePath: string;
  altFr: string;
  altEn: string;
  sortOrder: number;
  isCover: boolean;
  isActive: boolean;
};

export type AdminNewsFormIntent = "draft" | "publish" | "schedule" | "save" | "archive";

export type AdminNewsFormValues = {
  code: string;
  categoryId: string;
  imagePath: string;
  imageAltFr: string;
  imageAltEn: string;
  titleFr: string;
  titleEn: string;
  excerptFr: string;
  excerptEn: string;
  contentFr: string;
  contentEn: string;
  scheduledAt: string;
  coverImageValue: string;
  deletedImageIds: string[];
};

export type AdminNewsFormState = {
  ok: boolean;
  message: string;
  fieldErrors: Partial<Record<keyof AdminNewsFormValues | "intent", string>>;
  values: AdminNewsFormValues;
};

export const emptyAdminNewsFormValues: AdminNewsFormValues = {
  code: "",
  categoryId: "",
  imagePath: "",
  imageAltFr: "",
  imageAltEn: "",
  titleFr: "",
  titleEn: "",
  excerptFr: "",
  excerptEn: "",
  contentFr: "",
  contentEn: "",
  scheduledAt: "",
  coverImageValue: "",
  deletedImageIds: [],
};
