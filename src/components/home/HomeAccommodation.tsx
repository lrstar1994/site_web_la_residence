// import { getTranslations } from "next-intl/server";
// import Image from "next/image";
// import Link from "next/link";
// import { siteConfig } from "@/data/site";
// import type { Locale } from "@/lib/i18n/routing";

// type HomeAccommodationProps = {
//   locale: Locale;
// };

// export async function HomeAccommodation({ locale }: HomeAccommodationProps) {
//   const t = await getTranslations({ locale, namespace: "home.accommodation" });
//   const route = siteConfig.primaryRoutes.find(
//     (item) => item.key === "hebergement",
//   );

//   return (
//     <section
//       className="accommodation-overlap"
//       aria-labelledby="home-accommodation-title"
//     >
//       <div className="overlap-container">
//         <div className="overlap-image">
//           <Image
//             src="/ChatGPT Image 2 août 2026, 14_21_13.png"
//             alt={t("image_alt")}
//             width={780}
//             height={500}
//             sizes="(max-width: 1024px) 90vw, 62vw"
//             className="overlap-img"
//           />
//         </div>
//         <div className="overlap-card">
//           <h2 id="home-accommodation-title">{t("title")}</h2>
//           <div className="gold-divider" aria-hidden="true" />
//           <p className="description">{t("description")}</p>
//           <Link
//             href={route?.paths[locale] ?? siteConfig.homeRoute.paths[locale]}
//             className="btn-explore"
//           >
//             {t("cta")}
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// }


import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type HomeAccommodationProps = {
  locale: Locale;
};

export async function HomeAccommodation({
  locale,
}: HomeAccommodationProps) {
  const t = await getTranslations({
    locale,
    namespace: "home.accommodation",
  });

  const route = siteConfig.primaryRoutes.find(
    (item) => item.key === "hebergement",
  );

  return (
    <section
      className="accommodation-overlap"
      aria-labelledby="home-accommodation-title"
    >
      <div className="overlap-container">
        <div className="overlap-image">
          <Image
            src="/ChatGPT Image 2 août 2026, 14_21_13.png"
            alt={t("image_alt")}
            width={780}
            height={500}
            sizes="(max-width: 1024px) 90vw, 62vw"
            className="overlap-img"
          />
        </div>

        <div className="overlap-card">
          <p className="category-label accommodation-category-label">
            {locale === "fr" ? "Hébergements" : "Accommodation"}
          </p>

          <h2 id="home-accommodation-title">
            {t("title")}
          </h2>

          <div
            className="gold-divider"
            aria-hidden="true"
          />

          <p className="description">
            {t("description")}
          </p>

          <Link
            href={
              route?.paths[locale] ??
              siteConfig.homeRoute.paths[locale]
            }
            className="btn-explore"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}