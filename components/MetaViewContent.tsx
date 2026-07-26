"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/analytics-events";

/** Fires Meta ViewContent once per mount (course / product detail pages). */
export function MetaViewContent({
  contentId,
  contentName,
  contentType = "product",
  contentCategory,
  value,
  currency = "EGP",
}: {
  contentId: string;
  contentName: string;
  contentType?: string;
  contentCategory?: string;
  value?: number;
  currency?: string;
}) {
  useEffect(() => {
    const id = contentId.trim();
    if (!id) return;
    trackMetaEvent("ViewContent", {
      content_ids: [id],
      content_name: contentName,
      content_type: contentType,
      content_category: contentCategory,
      value: value != null && Number.isFinite(value) ? value : undefined,
      currency,
    });
  }, [contentId, contentName, contentType, contentCategory, value, currency]);

  return null;
}
