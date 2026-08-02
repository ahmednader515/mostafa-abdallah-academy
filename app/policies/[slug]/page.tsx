import { redirect } from "next/navigation";
import { getHomepageSettings } from "@/lib/db";
import {
  findPublishedPolicyBySlug,
  parsePolicyCards,
  policyPublicHref,
  sanitizePolicySlug,
} from "@/lib/policy-cards";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** توافق مع الروابط القديمة /policies/slug → /slug */
export default async function LegacyPolicyRedirect({ params }: Props) {
  const { slug: raw } = await params;
  const slug = sanitizePolicySlug(decodeURIComponent(raw || ""));
  if (!slug) redirect("/");
  const settings = await getHomepageSettings().catch(() => null);
  const card = findPublishedPolicyBySlug(
    parsePolicyCards(settings?.policyCardsJson ?? null),
    slug,
  );
  if (card) redirect(policyPublicHref(card));
  redirect(`/${slug}`);
}
