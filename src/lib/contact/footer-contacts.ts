export type FooterContactSection =
  | "general"
  | "hebergement"
  | "salles"
  | "evenements";

export type FooterContact = {
  phone: string;
  whatsapp: string;
  email: string;
};

export const footerContacts: Record<FooterContactSection, FooterContact> = {
  general: {
    phone: "0340180770",
    whatsapp: "0380680770",
    email: "laresidence@laresidence-ankerana.mg",
  },
  hebergement: {
    phone: "0340180770",
    whatsapp: "0340180770",
    email: "hebergement@laresidence-ankerana.mg",
  },
  salles: {
    phone: "0380180770",
    whatsapp: "0380180770",
    email: "contact@laresidence-ankerana.mg",
  },
  evenements: {
    phone: "0340180770",
    whatsapp: "0380680770",
    email: "evenement@laresidence-ankerana.mg",
  },
};

const sectionBySegment: Record<string, FooterContactSection> = {
  hebergement: "hebergement",
  accommodation: "hebergement",
  salles: "salles",
  venues: "salles",
  evenements: "evenements",
  events: "evenements",
};

export function getFooterContactSection(pathname: string): FooterContactSection {
  const segments = pathname.split("/").filter(Boolean);
  const firstContentSegment = segments[0] === "fr" || segments[0] === "en"
    ? segments[1]
    : segments[0];

  return firstContentSegment
    ? sectionBySegment[firstContentSegment] ?? "general"
    : "general";
}

export function getFooterContact(pathname: string): FooterContact {
  return footerContacts[getFooterContactSection(pathname)];
}

export function formatMadagascarPhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (/^0\d{9}$/.test(digits)) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  return value;
}

export function getTelephoneHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `261${digits.slice(1)}` : digits;
  return `tel:+${international}`;
}

export function getWhatsAppHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `261${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}
