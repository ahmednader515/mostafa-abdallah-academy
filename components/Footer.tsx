import Link from "next/link";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { PolicyNavLink } from "@/lib/policy-cards";

export async function Footer({
  footerTitle,
  footerTagline,
  footerCopyright,
  policyLinks = [],
}: {
  footerTitle?: string;
  footerTagline?: string;
  footerCopyright?: string;
  policyLinks?: PolicyNavLink[];
}) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const defaultTitle = t("footer.defaultTitle", "WorldWay");
  const defaultTagline = t("footer.defaultTagline", "تعلم بأسلوب حديث ومنهجية واضحة");
  const defaultCopyright = t("footer.defaultCopyright", "WorldWay. جميع الحقوق محفوظة.");
  const year = new Date().getFullYear();
  const copyrightText = footerCopyright?.trim() || defaultCopyright;
  return (
    <footer className="mt-auto border-t border-white/10 bg-[var(--color-navy)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">
              {footerTitle?.trim() || defaultTitle}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {footerTagline?.trim() || defaultTagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
              {t("common.home", "Home")}
            </Link>
            <Link href="/courses" className="text-sm text-slate-400 transition hover:text-white">
              {t("common.courses", "Courses")}
            </Link>
            {policyLinks.map((link) => {
              const label =
                pickLocalizedText(locale, link.titleAr, link.titleEn) || link.slug;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-sm text-slate-400 transition hover:text-white"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        <p className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          © {year} {copyrightText}
        </p>
      </div>
    </footer>
  );
}
