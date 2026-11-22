import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminHomeHeroManager } from "@/components/admin/home-hero/AdminHomeHeroManager";
import { getAdminHomeHeroImages } from "@/lib/admin/home-hero/get-admin-home-hero-images";
import { requireFullAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diaporama de l’accueil | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminHomeHeroPage({ params }: PageProps) {
  const { locale } = await params;
  await requireFullAdmin(locale);
  const [images, t] = await Promise.all([
    getAdminHomeHeroImages(),
    getTranslations({ locale, namespace: "homeHeroAdmin" }),
  ]);

  return (
    <main className="admin-home-hero-page">
      <header className="admin-news-form-header admin-home-hero-header">
        <div>
          <p className="admin-section-kicker">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <strong>{t("counter", { count: images.length, max: 6 })}</strong>
      </header>
      <AdminHomeHeroManager
        key={images.map((image) => `${image.id}:${image.updatedAt}:${image.sortOrder}`).join("|")}
        images={images}
        locale={locale}
        labels={{
          addTitle: t("add_title"),
          addDescription: t("add_description"),
          chooseImage: t("choose_image"),
          replaceImage: t("replace_image"),
          altFr: t("alt_fr"),
          altEn: t("alt_en"),
          active: t("active"),
          inactive: t("inactive"),
          activateOnAdd: t("activate_on_add"),
          add: t("add"),
          adding: t("adding"),
          listTitle: t("list_title"),
          listDescription: t("list_description"),
          empty: t("empty"),
          order: t("order"),
          save: t("save"),
          saving: t("saving"),
          moveUp: t("move_up"),
          moveDown: t("move_down"),
          drag: t("drag"),
          delete: t("delete"),
          deleteTitle: t("delete_title"),
          deleteDescription: t("delete_description"),
          deleteConfirm: t("delete_confirm"),
          cancel: t("cancel"),
          deleting: t("deleting"),
          maxReached: t("max_reached"),
          invalidFile: t("invalid_file"),
          altRequired: t("alt_required"),
          uploadFailed: t("upload_failed"),
          reorderFailed: t("reorder_failed"),
        }}
      />
    </main>
  );
}
