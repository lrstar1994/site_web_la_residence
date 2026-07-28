import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/data/site";
import { buildWebsiteSchema } from "@/lib/seo/schema";
import { routing, type Locale } from "@/lib/i18n/routing";
import { getBaseUrl, getHomeMetadata } from "@/lib/seo/metadata";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  return getHomeMetadata(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const baseUrl = getBaseUrl();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAdminRoute =
    pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`);

  if (isAdminRoute) {
    return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <Header locale={locale as Locale} />
      <main>{children}</main>
      <Footer locale={locale as Locale} />
      <JsonLd data={buildWebsiteSchema(baseUrl, locale as Locale)} />
      <JsonLd data={siteConfig.organizationSchema(baseUrl)} />
    </NextIntlClientProvider>
  );
}
