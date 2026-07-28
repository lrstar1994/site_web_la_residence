import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminPath } from "@/lib/auth/admin-paths";
import { getCurrentAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "Administration",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function AdminLoginPage({ params }: PageProps) {
  const { locale } = await params;
  if (locale !== "fr") {
    redirect("/fr/admin/connexion");
  }

  const currentLocale = locale as Locale;
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect(getAdminPath(currentLocale));
  }

  const t = await getTranslations({
    locale: currentLocale,
    namespace: "adminAuth.login",
  });

  return (
    <main className="admin-auth-page">
      <AdminLoginForm
        locale={currentLocale}
        labels={{
          title: t("title"),
          subtitle: t("subtitle"),
          email: t("email"),
          password: t("password"),
          submit: t("submit"),
          pending: t("pending"),
          error: t("error"),
          logoAlt: t("logo_alt"),
        }}
      />
    </main>
  );
}
