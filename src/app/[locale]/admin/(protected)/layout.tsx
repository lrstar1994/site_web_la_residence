import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";
import "../admin.css";

type AdminProtectedLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function AdminProtectedLayout({
  children,
  params,
}: AdminProtectedLayoutProps) {
  const { locale } = await params;
  const admin = await requireAdmin(locale as Locale);
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const active = pathname.includes("/admin/actualites")
    ? "news"
    : pathname.includes("/admin/demandes-de-devis")
      ? "quotes"
      : pathname.includes("/admin/evenements")
        ? "events"
        : pathname.includes("/admin/hebergements")
          ? "accommodations"
          : pathname.includes("/admin/restaurant")
            ? "restaurant"
            : pathname.includes("/admin/salles")
              ? "venues"
              : "accommodations";
  const title =
    active === "news"
      ? "Actualités"
      : active === "quotes"
        ? "Demandes de devis"
        : active === "events"
        ? "Prestations événementielles"
        : active === "accommodations"
          ? "Hébergements"
          : active === "restaurant"
            ? "Restaurant"
            : active === "venues"
              ? "Salles"
              : "Hébergements";

  return (
    <div className="admin-shell">
      <AdminSidebar active={active} />
      <div className="admin-shell-main">
        <AdminHeader title={title} admin={admin} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
