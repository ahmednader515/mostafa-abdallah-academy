"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type LabelEntry = { ar: string; en: string };
type LabelsMap = Record<string, LabelEntry>;

type LabelsContextValue = {
  labels: LabelsMap;
};

const LabelsContext = createContext<LabelsContextValue | null>(null);

export function LabelsProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<LabelsMap>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/labels")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.labels) setLabels(data.labels);
      })
      .catch(() => {
        /* استخدم القيم الافتراضية للترجمة عند فشل الجلب */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<LabelsContextValue>(() => ({ labels }), [labels]);

  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}

/** يعيد المسمى المخصص من إدارة "مسميات المنصة" بلغة الواجهة الحالية، مع fallback عند عدم التعريف */
export function useLabel(key: string, fallback?: string): string {
  const ctx = useContext(LabelsContext);
  const locale = useLocale();
  if (!ctx) throw new Error("useLabel must be used within LabelsProvider");
  const entry = ctx.labels[key];
  if (!entry) return fallback ?? key;
  const value = locale === "en" ? entry.en : entry.ar;
  return value?.trim() ? value : fallback ?? key;
}
