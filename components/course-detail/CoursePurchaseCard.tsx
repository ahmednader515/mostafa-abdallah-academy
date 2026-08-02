import type { ReactNode } from "react";
import Link from "next/link";
import { FormattedPrice } from "@/components/FormattedPrice";
import { EnrollButton } from "@/app/courses/[slug]/EnrollButton";
import { SubscriptionAccessDenied } from "@/components/SubscriptionAccessDenied";

type Feature = { label: string };

type Props = {
  courseId: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number | null;
  discountBadgeLabel: string | null;
  features: Feature[];
  canEnroll: boolean;
  userBalance: number;
  landingSlug: string;
  isEnrolled: boolean;
  enrolledMessage: ReactNode;
  subscriptionBlocked: boolean;
  guestPrompt?: ReactNode;
  enrolledCtaHref?: string;
  enrolledCtaLabel?: string;
  freeLabel: string;
};

export function CoursePurchaseCard({
  courseId,
  price,
  compareAtPrice,
  discountPercent,
  discountBadgeLabel,
  features,
  canEnroll,
  userBalance,
  landingSlug,
  isEnrolled,
  enrolledMessage,
  subscriptionBlocked,
  guestPrompt,
  enrolledCtaHref,
  enrolledCtaLabel,
  freeLabel,
}: Props) {
  const showCompare = compareAtPrice != null && compareAtPrice > price && price >= 0;

  return (
    <aside
      id="course-purchase"
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-24 lg:self-start"
    >
      <div className="flex flex-wrap items-end gap-2">
        <span className="text-3xl font-bold text-[var(--color-foreground)]">
          {price <= 0 ? (
            <span className="text-[var(--color-primary)]">{freeLabel}</span>
          ) : (
            <FormattedPrice amountEgp={price} />
          )}
        </span>
        {showCompare ? (
          <span className="pb-1 text-base text-[var(--color-muted)] line-through">
            <FormattedPrice amountEgp={compareAtPrice} />
          </span>
        ) : null}
        {discountBadgeLabel && discountPercent != null && discountPercent > 0 ? (
          <span className="mb-1 rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {discountBadgeLabel}
          </span>
        ) : null}
      </div>

      {features.length > 0 ? (
        <ul className="mt-5 space-y-2.5 border-b border-[var(--color-border)] pb-5">
          {features.map((f) => (
            <li key={f.label} className="flex items-start gap-2 text-sm text-[var(--color-foreground)]">
              <span className="mt-0.5 text-[var(--color-primary)]" aria-hidden>
                ✓
              </span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        {guestPrompt}
        {subscriptionBlocked ? (
          <div className="mb-3">
            <SubscriptionAccessDenied />
          </div>
        ) : null}
        {canEnroll ? (
          <EnrollButton
            courseId={courseId}
            coursePrice={price}
            userBalance={userBalance}
            landingSlug={landingSlug}
            hidePriceSummary
          />
        ) : null}
        {isEnrolled ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-btn)] bg-[var(--color-primary-light)]/50 px-4 py-2 text-sm text-[var(--color-primary)]">
              {enrolledMessage}
            </div>
            {enrolledCtaHref && enrolledCtaLabel ? (
              <Link
                href={enrolledCtaHref}
                className="inline-flex w-full items-center justify-center rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
              >
                {enrolledCtaLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
