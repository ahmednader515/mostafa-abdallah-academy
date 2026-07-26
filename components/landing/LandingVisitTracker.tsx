"use client";

import { useEffect, useRef } from "react";
import { postLandingPageEvent } from "@/lib/analytics-events";

export function LandingVisitTracker({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void postLandingPageEvent(slug, "visit");
  }, [slug]);
  return null;
}
