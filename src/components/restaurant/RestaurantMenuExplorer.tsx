"use client";

import { useCallback, useMemo, useState } from "react";
import { RestaurantMenuCard } from "@/components/restaurant/RestaurantMenuCard";
import { RestaurantMenuModal } from "@/components/restaurant/RestaurantMenuModal";
import type { Locale } from "@/lib/i18n/routing";
import type { RestaurantMenuCardModel, RestaurantMenuCategory } from "@/types/restaurant-menu";

type ActiveCategoryId = "all" | string;

type RestaurantMenuExplorerProps = {
  categories: RestaurantMenuCategory[];
  menus: RestaurantMenuCardModel[];
  locale: Locale;
  labels: {
    tabsLabel: string;
    filters: Record<string, string>;
    imageCountSingular: string;
    imageCountPlural: string;
    viewSingle: string;
    viewMultiple: string;
    modal: {
      close: string;
      previous: string;
      next: string;
      thumbnails: string;
    };
  };
};

export function RestaurantMenuExplorer({
  categories,
  menus,
  locale,
  labels,
}: RestaurantMenuExplorerProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<ActiveCategoryId>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const visibleMenus = useMemo(
    () =>
      activeCategoryId === "all"
        ? menus
        : menus.filter((menu) => menu.categoryId === activeCategoryId),
    [activeCategoryId, menus],
  );
  const selectedMenu =
    menus.find((menu) => menu.id === selectedId) ?? null;
  const availableCategoryIds = useMemo(
    () => new Set(menus.map((menu) => menu.categoryId).filter(Boolean)),
    [menus],
  );
  const filters = useMemo(
    () => categories.filter((category) => availableCategoryIds.has(category.id)),
    [availableCategoryIds, categories],
  );

  const handleOpen = useCallback(
    (menuId: string, trigger: HTMLButtonElement) => {
      setTriggerElement(trigger);
      setSelectedId(menuId);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setSelectedId(null);
    triggerElement?.focus();
    setTriggerElement(null);
  }, [triggerElement]);

  return (
    <>
      <div className="menu-tabs" role="tablist" aria-label={labels.tabsLabel}>
        <button
          className={activeCategoryId === "all" ? "menu-tab active" : "menu-tab"}
          type="button"
          role="tab"
          aria-selected={activeCategoryId === "all"}
          aria-controls="restaurant-menus-panel"
          id="restaurant-menu-tab-all"
          key="filter-all"
          onClick={() => setActiveCategoryId("all")}
        >
          {labels.filters.all}
        </button>
        {filters.map((category) => {
          const selected = activeCategoryId === category.id;

          return (
            <button
              className={selected ? "menu-tab active" : "menu-tab"}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="restaurant-menus-panel"
              id={`restaurant-menu-tab-${category.id}`}
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name[locale]}
            </button>
          );
        })}
      </div>
      <div
        className="menus-grid menu-image-grid"
        id="restaurant-menus-panel"
        role="tabpanel"
        aria-labelledby={`restaurant-menu-tab-${activeCategoryId}`}
      >
        {visibleMenus.map((menu) => (
          <RestaurantMenuCard
            key={menu.id}
            menu={menu}
            locale={locale}
            labels={{
              imageCountSingular: labels.imageCountSingular,
              imageCountPlural: labels.imageCountPlural,
              viewSingle: labels.viewSingle,
              viewMultiple: labels.viewMultiple,
            }}
            onOpen={handleOpen}
          />
        ))}
      </div>
      {selectedMenu ? (
        <RestaurantMenuModal
          menu={selectedMenu}
          locale={locale}
          labels={labels.modal}
          onClose={handleClose}
        />
      ) : null}
    </>
  );
}
