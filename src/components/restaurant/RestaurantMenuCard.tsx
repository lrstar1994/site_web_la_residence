"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n/routing";
import type { RestaurantMenuCardModel } from "@/types/restaurant-menu";

type RestaurantMenuCardProps = {
  menu: RestaurantMenuCardModel;
  locale: Locale;
  labels: {
    imageCountSingular: string;
    imageCountPlural: string;
    viewSingle: string;
    viewMultiple: string;
  };
  onOpen: (menuId: string, trigger: HTMLButtonElement) => void;
};

export function RestaurantMenuCard({
  menu,
  locale,
  labels,
  onOpen,
}: RestaurantMenuCardProps) {
  const t = useTranslations("restaurantPage.menus");
  const imageCount = menu.images.length;
  const countLabel =
    imageCount > 1
      ? `${imageCount} ${labels.imageCountPlural}`
      : `1 ${labels.imageCountSingular}`;
  const actionLabel = imageCount > 1 ? labels.viewMultiple : labels.viewSingle;

  return (
    <article className="menu-card visible">
      <button
        type="button"
        className="card-link-wrapper"
        aria-label={`${actionLabel} : ${menu.label[locale]}`}
        onClick={(event) => onOpen(menu.id, event.currentTarget)}
      >
        <div className="card-image">
          <Image
            src={menu.cover}
            alt={menu.images[0]?.alt[locale] ?? menu.title[locale]}
            width={640}
            height={860}
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 42vw, 28vw"
          />
          <span className="card-image-count">{countLabel}</span>
          <div className="card-overlay">
            <span className="view-btn">{actionLabel}</span>
          </div>
        </div>
        <div className="card-content">
          <span className="menu-card-badge">{menu.label[locale]}</span>
          <h3>{menu.title[locale]}</h3>
          <p>{menu.description[locale]}</p>
          {imageCount > 1 ? (
            <span className="menu-card-gallery-info">
              {t("gallery_info", {
                count: imageCount,
              })}
            </span>
          ) : null}
        </div>
      </button>
    </article>
  );
}
