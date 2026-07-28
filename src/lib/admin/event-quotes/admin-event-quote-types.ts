import type { EventQuoteField, EventQuoteStatus } from "@/types/event-quote";
import type { EventService } from "@/types/event-service";

export type AdminEventQuoteRequest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  estimatedBudget: number | null;
  additionalDetails: string | null;
  eventTypeId: string;
  eventTypeTitleFr: string;
  eventTypeTitleEn: string;
  eventDate: string | null;
  specificAnswers: Record<string, unknown>;
  status: EventQuoteStatus;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminEventQuoteConfig = {
  services: EventService[];
  fields: EventQuoteField[];
};

export const EVENT_QUOTE_STATUS_LABELS_FR: Record<EventQuoteStatus, string> = {
  new: "Nouvelle",
  in_progress: "En cours",
  quote_sent: "Devis envoyé",
  confirmed: "Confirmée",
  declined: "Refusée",
  archived: "Archivée",
};

export const EVENT_QUOTE_STATUSES: EventQuoteStatus[] = [
  "new",
  "in_progress",
  "quote_sent",
  "confirmed",
  "declined",
  "archived",
];
