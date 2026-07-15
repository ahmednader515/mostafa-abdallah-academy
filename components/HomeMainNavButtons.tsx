import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";
import {
  DEFAULT_MAIN_NAV_FLAGS,
  type HomepageMainNavFlags,
} from "@/lib/homepage-hero-stats";

export async function HomeMainNavButtons({
  flags,
}: {
  flags?: HomepageMainNavFlags | null;
}) {
  const t = await getServerTranslator();
  const nav = flags ?? DEFAULT_MAIN_NAV_FLAGS;

  const buttons = [
    nav.jobs ? { href: "/jobs", label: t("home.mainNav.jobs", "الوظائف") } : null,
    nav.courses ? { href: "/courses", label: t("home.mainNav.courses", "الكورسات") } : null,
    nav.library ? { href: "/library", label: t("home.mainNav.library", "المكتبة") } : null,
    nav.social ? { href: "/#home-social", label: t("home.mainNav.social", "وسائل التواصل") } : null,
  ].filter((b): b is { href: string; label: string } => b != null);

  if (buttons.length === 0) return null;

  return (
    <section
      className="bg-[var(--color-sections)] px-3 pb-2 pt-2 sm:px-5 lg:px-8"
      aria-label={t("home.mainNav.aria", "Quick navigation")}
    >
      <div className="mx-auto max-w-6xl">
        <div
          className={`grid gap-3 ${
            buttons.length === 1
              ? "grid-cols-1 sm:grid-cols-1"
              : buttons.length === 2
                ? "grid-cols-2"
                : buttons.length === 3
                  ? "grid-cols-2 sm:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-4"
          }`}
        >
          {buttons.map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-btn)] border border-[var(--color-primary)]/25 bg-white px-4 py-3 text-center text-sm font-bold text-[var(--color-primary)] shadow-sm transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white dark:bg-[var(--color-surface)]"
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
