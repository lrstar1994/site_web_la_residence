type ImageAltInput = {
  titleFr: string;
  titleEn: string;
};

export function generateNewsImageAlt({ titleFr, titleEn }: ImageAltInput) {
  return {
    fr: `${titleFr} — La Résidence Ankerana`,
    en: `${titleEn} — La Résidence Ankerana`,
  };
}

export function generateEventServiceImageAlt({ titleFr, titleEn }: ImageAltInput) {
  return {
    fr: `${titleFr} à La Résidence Ankerana`,
    en: `${titleEn} at La Résidence Ankerana`,
  };
}

export function generateAccommodationImageAlt({ titleFr, titleEn }: ImageAltInput) {
  return {
    fr: `${titleFr} à La Résidence Ankerana`,
    en: `${titleEn} at La Résidence Ankerana`,
  };
}

export function generateVenueImageAlt(name: string) {
  return {
    fr: `${name} à La Résidence Ankerana`,
    en: `${name} at La Résidence Ankerana`,
  };
}

export function generateRestaurantMenuImageAlt({ titleFr, titleEn }: ImageAltInput) {
  return {
    fr: `${titleFr} du restaurant Le Privilège`,
    en: `${titleEn} at Le Privilège restaurant`,
  };
}
