import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getExternalTrainingById } from "@/lib/lms-features-db";
import { userCanAccessExternalViaSubscription } from "@/lib/subscription-access";
import { SubscriptionAccessDenied } from "@/components/SubscriptionAccessDenied";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export const dynamic = "force-dynamic";

export default async function ExternalTrainingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getExternalTrainingById(id).catch(() => null);
  if (!page || !page.isPublished) notFound();

  const [locale, t, session] = await Promise.all([
    getLocaleFromCookie(),
    getServerTranslator(),
    getServerSession(authOptions),
  ]);

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN";
  let canLaunch = isStaff;
  if (!canLaunch && session?.user?.id) {
    canLaunch = await userCanAccessExternalViaSubscription(session.user.id, page.id);
  }

  return (
    <article className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/external-training"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          ← {t("subscriptions.backToExternal", "Back to external training")}
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          {pickLocalizedText(locale, page.titleAr, page.title)}
        </h1>
        <p className="mt-6 whitespace-pre-wrap">
          {pickLocalizedText(locale, page.descriptionAr, page.description)}
        </p>
        {canLaunch ? (
          <form
            action={`/api/external-training/${page.id}/launch`}
            method="post"
            target="_blank"
            className="mt-8"
          >
            <button className="rounded bg-[var(--color-primary)] px-5 py-3 font-semibold text-white">
              {t("externalTrainingPage.startTraining", "Start training")}
            </button>
          </form>
        ) : session ? (
          <div className="mt-8">
            <SubscriptionAccessDenied />
          </div>
        ) : (
          <div className="mt-8">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/external-training/${page.id}`)}`}
              className="inline-flex rounded bg-[var(--color-primary)] px-5 py-3 font-semibold text-white"
            >
              {t("header.login", "Log in")}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
