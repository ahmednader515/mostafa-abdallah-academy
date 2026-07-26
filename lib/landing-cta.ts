import type {
  LandingCtaActionType,
  LandingCtaTargetType,
} from "@/lib/landing-page-types";

export type ResolvedCtaAction = {
  kind: LandingCtaActionType | LandingCtaTargetType;
  targetId: string | null;
  customUrl?: string;
};

export function resolveCtaAction(
  buttonAction: LandingCtaActionType,
  buttonTargetId: string | undefined,
  buttonCustomUrl: string | undefined,
  pageTargetType: LandingCtaTargetType,
  pageTargetId: string | null,
): ResolvedCtaAction {
  if (buttonAction === "target_default") {
    return {
      kind: pageTargetType === "none" ? "login" : pageTargetType,
      targetId: pageTargetId,
    };
  }
  if (buttonAction === "custom_url") {
    return { kind: "custom_url", targetId: null, customUrl: buttonCustomUrl };
  }
  if (buttonAction === "login") {
    return { kind: "login", targetId: null };
  }
  return {
    kind: buttonAction,
    targetId: buttonTargetId?.trim() || pageTargetId,
  };
}

/** Destination URL after auth (or for guests as callbackUrl). */
export function buildCtaDestination(
  action: ResolvedCtaAction,
  landingSlug: string,
  courseSlugById?: Map<string, string>,
): string {
  const lp = encodeURIComponent(landingSlug);
  switch (action.kind) {
    case "custom_url":
      return action.customUrl?.trim() || `/l/${landingSlug}`;
    case "login":
      return `/dashboard?lp=${lp}`;
    case "course": {
      const id = action.targetId || "";
      const slug = courseSlugById?.get(id);
      if (slug) return `/courses/${encodeURIComponent(slug)}?lp=${lp}`;
      if (id) return `/courses/${encodeURIComponent(id)}?lp=${lp}`;
      return `/courses?lp=${lp}`;
    }
    case "subscription":
    case "library_plan":
      return `/l/${landingSlug}/checkout?type=${action.kind}&id=${encodeURIComponent(action.targetId || "")}`;
    case "store_product":
      return `/l/${landingSlug}/checkout?type=store_product&id=${encodeURIComponent(action.targetId || "")}`;
    case "consultation":
      if (action.targetId) return `/consultations/${encodeURIComponent(action.targetId)}?lp=${lp}`;
      return `/consultations?lp=${lp}`;
    default:
      return `/l/${landingSlug}`;
  }
}
