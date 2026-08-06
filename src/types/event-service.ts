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
  images: {
    id: string;
    imagePath: string;
    alt: {
      fr: string;
      en: string;
    };
    sortOrder: number;
    isCover: boolean;
  }[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
