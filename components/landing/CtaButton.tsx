"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { postLandingPageEvent } from "@/lib/analytics-events";
import {
  buildCtaDestination,
  resolveCtaAction,
  type ResolvedCtaAction,
} from "@/lib/landing-cta";
import type {
  LandingCtaButton,
  LandingCtaTargetType,
} from "@/lib/landing-page-types";

export function CtaButton({
  button,
  pageSlug,
  pageTargetType,
  pageTargetId,
  courseSlugById,
  className,
  defaultColor,
  defaultTextColor,
}: {
  button: LandingCtaButton;
  pageSlug: string;
  pageTargetType: LandingCtaTargetType;
  pageTargetId: string | null;
  courseSlugById?: Record<string, string>;
  className?: string;
  defaultColor?: string;
  defaultTextColor?: string;
}) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const resolved: ResolvedCtaAction = resolveCtaAction(
    button.action,
    button.targetId,
    button.customUrl,
    pageTargetType,
    pageTargetId,
  );

  const slugMap = courseSlugById
    ? new Map(Object.entries(courseSlugById))
    : undefined;
  const destination = buildCtaDestination(resolved, pageSlug, slugMap);
  const bg = button.color || defaultColor || "var(--lp-button, #0f766e)";
  const color = defaultTextColor || "var(--lp-button-text, #fff)";

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    await postLandingPageEvent(pageSlug, "cta_click", {
      buttonId: button.id,
      action: resolved.kind,
      targetId: resolved.targetId ?? undefined,
    });

    if (resolved.kind === "custom_url" && resolved.customUrl) {
      window.location.href = resolved.customUrl;
      return;
    }

    const loggedIn = status === "authenticated" && !!session?.user;
    if (!loggedIn) {
      const callbackUrl = encodeURIComponent(destination);
      window.location.href = `/login?callbackUrl=${callbackUrl}`;
      return;
    }

    // Authenticated: checkout types go to checkout helper; others navigate.
    if (
      resolved.kind === "subscription" ||
      resolved.kind === "library_plan" ||
      resolved.kind === "store_product"
    ) {
      window.location.href = destination;
      return;
    }

    window.location.href = destination;
  }

  return (
    <Link
      href={destination}
      onClick={(e) => void onClick(e)}
      className={
        className ||
        "inline-flex items-center justify-center rounded-[var(--radius-btn)] px-6 py-3 text-sm font-semibold transition hover:opacity-90"
      }
      style={{ backgroundColor: bg, color }}
    >
      {loading ? "…" : button.label}
    </Link>
  );
}
