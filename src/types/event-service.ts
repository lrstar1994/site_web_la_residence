export type EventService = {
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
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
