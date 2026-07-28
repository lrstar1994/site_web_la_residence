import type { Locale } from "@/lib/i18n/routing";
import type { AccommodationCardModel } from "@/types/accommodation";

const cardAltText: Record<string, Record<Locale, string>> = {
  appartement: {
    fr: "Appartement meublé à Ankerana pour six personnes",
    en: "Furnished apartment in Ankerana for up to six guests",
  },
  cozy: {
    fr: "Chambre Cozy à La Résidence Ankerana à Antananarivo",
    en: "Cozy room at La Résidence Ankerana in Antananarivo",
  },
  "cozy-familiale": {
    fr: "Chambre Cozy Familiale à La Résidence Ankerana à Antananarivo",
    en: "Family Cozy room at La Résidence Ankerana in Antananarivo",
  },
  "cozy-twin": {
    fr: "Chambre Cozy Twin à La Résidence Ankerana à Antananarivo",
    en: "Cozy Twin room at La Résidence Ankerana in Antananarivo",
  },
  "cozy-triple": {
    fr: "Chambre Cozy Triple à La Résidence Ankerana à Antananarivo",
    en: "Cozy Triple room at La Résidence Ankerana in Antananarivo",
  },
  "studio-vip": {
    fr: "Studio VIP avec coin salon à La Résidence Ankerana",
    en: "VIP studio with lounge area at La Résidence Ankerana",
  },
  "studio-confort": {
    fr: "Studio Confort avec kitchenette à La Résidence Ankerana",
    en: "Comfort studio with kitchenette at La Résidence Ankerana",
  },
  "vintage-double": {
    fr: "Chambre Vintage Double avec terrasse à La Résidence Ankerana",
    en: "Vintage Double room with terrace at La Résidence Ankerana",
  },
  "vintage-superieure": {
    fr: "Chambre Vintage Supérieure avec terrasse privée à La Résidence Ankerana",
    en: "Superior Vintage room with private terrace at La Résidence Ankerana",
  },
  "vintage-familiale": {
    fr: "Chambre Vintage Familiale pour quatre personnes à La Résidence Ankerana",
    en: "Family Vintage room for four guests at La Résidence Ankerana",
  },
};

export function getAccommodationImageAlt(
  accommodation: AccommodationCardModel,
  locale: Locale,
) {
  const fallback =
    locale === "fr"
      ? `${accommodation.category[locale]} ${accommodation.name[locale]} à La Résidence Ankerana à Antananarivo`
      : `${accommodation.name[locale]} ${accommodation.category[locale]} at La Résidence Ankerana in Antananarivo`;

  return cardAltText[accommodation.id]?.[locale] ?? fallback;
}

export function getAccommodationGalleryImageAlt(
  accommodation: AccommodationCardModel,
  locale: Locale,
  index: number,
  total: number,
) {
  const baseAlt = getAccommodationImageAlt(accommodation, locale);

  if (locale === "fr") {
    return `${baseAlt}, photo ${index + 1} sur ${total}`;
  }

  return `${baseAlt}, photo ${index + 1} of ${total}`;
}
