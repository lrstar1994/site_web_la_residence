import type { EventService } from "@/types/event-service";

export type EventQuoteFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "radio"
  | "checkbox_group"
  | "multi_select";

export type EventQuoteStatus =
  | "new"
  | "in_progress"
  | "quote_sent"
  | "confirmed"
  | "declined"
  | "archived";

export type EventQuoteFieldOption = {
  value: string;
  labelFr: string;
  labelEn: string;
};

export type EventQuoteConditionalLogic = {
  dependsOn: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than";
  value: string | number | boolean;
};

export type EventQuoteField = {
  id: string;
  eventTypeId: string;
  fieldKey: string;
  labelFr: string;
  labelEn: string;
  fieldType: EventQuoteFieldType;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  placeholderFr: string | null;
  placeholderEn: string | null;
  helpTextFr: string | null;
  helpTextEn: string | null;
  options: EventQuoteFieldOption[];
  conditionalLogic: EventQuoteConditionalLogic | null;
};

export type EventQuotePublicConfig = {
  services: EventService[];
  fields: EventQuoteField[];
};
