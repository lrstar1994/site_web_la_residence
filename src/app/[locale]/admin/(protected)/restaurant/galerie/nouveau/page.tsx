import type {
  Metadata,
} from "next";
import {
  redirect,
} from "next/navigation";

import {
  AdminRestaurantGalleryForm,
} from "@/components/admin/restaurant/AdminRestaurantGalleryForm";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import type {
  Locale,
} from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const dynamic =
  "force-dynamic";

export const metadata:
  Metadata = {
  title:
    "Ajouter une image | Galerie restaurant | Administration",

  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function NewRestaurantGalleryImagePage({
  params,
}: PageProps) {
  const {
    locale,
  } = await params;

  if (
    locale !== "fr"
  ) {
    redirect(
      "/fr/admin/restaurant/galerie/nouveau",
    );
  }

  await requireAdmin(
    locale as Locale,
  );

  return (
    <AdminRestaurantGalleryForm />
  );
}