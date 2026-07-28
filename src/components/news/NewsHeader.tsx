import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";

type NewsHeaderProps = {
  locale: Locale;
};

export async function NewsHeader({ locale }: NewsHeaderProps) {
  const t = await getTranslations({ locale, namespace: "newsPage.header" });

  return (
    <header className="page-header-magazine">
      <div className="header-inner">
        <div className="header-left">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
        </div>
        <div className="header-right" aria-label={`${t("issueLabel")} ${t("issueNumber")}`}>
          <span className="issue-label">{t("issueLabel")}</span>
          <span className="issue-number">{t("issueNumber")}</span>
        </div>
      </div>
    </header>
  );
}
