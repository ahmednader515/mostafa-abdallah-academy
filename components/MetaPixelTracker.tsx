"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/analytics-events";

/**
 * Manual PageView + Search tracking for Meta Pixel/CAPI.
 * Pixel autoConfig is disabled — do not rely on automatic event tracking.
 */
function MetaPixelTrackerInner({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPageKey = useRef<string>("");
  const lastSearchKey = useRef<string>("");

  useEffect(() => {
    if (!enabled || !pathname) return;
    const qs = searchParams?.toString() ?? "";
    const pageKey = `${pathname}?${qs}`;
    if (pageKey === lastPageKey.current) return;
    lastPageKey.current = pageKey;
    trackMetaEvent("PageView");
  }, [enabled, pathname, searchParams]);

  useEffect(() => {
    if (!enabled || pathname !== "/search") return;
    const q = (searchParams?.get("q") ?? "").trim();
    if (!q) return;
    const key = q.toLowerCase();
    if (key === lastSearchKey.current) return;
    lastSearchKey.current = key;
    trackMetaEvent("Search", { search_string: q, content_category: "site_search" });
  }, [enabled, pathname, searchParams]);

  return null;
}

export function MetaPixelTracker({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <Suspense fallback={null}>
      <MetaPixelTrackerInner enabled={enabled} />
    </Suspense>
  );
}
