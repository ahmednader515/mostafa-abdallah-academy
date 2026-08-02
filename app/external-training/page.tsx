import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listPublishedExternalTrainings } from "@/lib/lms-features-db";
import {
  canAccessExternalPage,
  getActiveSubscriptionAccess,
} from "@/lib/subscription-access";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export const dynamic = "force-dynamic";

export default async function ExternalTrainingPage() {
  const [session, locale, t, allPublished] = await Promise.all([
    getServerSession(authOptions),
    getLocaleFromCookie(),
    getServerTranslator(),
    listPublishedExternalTrainings().catch(() => []),
  ]);

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN";

  let pages = allPublished;
  if (!session?.user?.id) {
    pages = [];
  } else if (!isStaff) {
    const access = await getActiveSubscriptionAccess(session.user.id);
    pages = allPublished.filter((page) => canAccessExternalPage(access, page.id));
  }

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
          {t("externalTrainingPage.title", "External training")}
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          {t(
            "externalTrainingPage.subtitle",
            "Open the training portals included in your subscription with one click.",
          )}
        </p>

        {!session?.user?.id ? (
          <div className="mt-10 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-[var(--color-foreground)]">
              {t("externalTrainingPage.loginRequired", "Please log in to view your training sites.")}
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent("/external-training")}`}
              className="mt-5 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-3 font-semibold text-white"
            >
              {t("header.login", "Log in")}
            </Link>
          </div>
        ) : pages.length === 0 ? (
          <div className="mt-10 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-[var(--color-foreground)]">
              {t(
                "externalTrainingPage.empty",
                "No external training sites are available on your current subscription.",
              )}
            </p>
            <Link
              href="/#subscriptions"
              className="mt-5 inline-flex text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              {t("externalTrainingPage.browsePlans", "Browse subscription plans")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => {
              const title = pickLocalizedText(locale, page.titleAr, page.title) || page.title;
              const description =
                pickLocalizedText(locale, page.descriptionAr, page.description) || "";
              return (
                <article
                  key={page.id}
                  className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-3">
                    {page.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={page.imageUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--color-background)] text-sm font-bold text-[var(--color-muted)]">
                        {title.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                        {title}
                      </h2>
                    </div>
                  </div>
                  {description ? (
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-[var(--color-muted)]">
                      {description}
                    </p>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <form
                    action={`/api/external-training/${page.id}/launch`}
                    method="post"
                    target="_blank"
                    className="mt-5"
                  >
                    <button
                      type="submit"
                      className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      {t("externalTrainingPage.startTraining", "Start training")}
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
