import type { EventService } from "@/types/event-service";

export type AdminEventService = EventService;

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
};
