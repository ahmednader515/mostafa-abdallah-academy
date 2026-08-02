export type SubscriptionFeatureItem = {
  text: string;
  included: boolean;
};

/** سطر لكل ميزة. ابدأ بـ `-` أو `x` للميزة غير المتضمنة، و`+` أو اتركه للمضمنة. */
export function parseSubscriptionFeatures(raw: string | null | undefined): SubscriptionFeatureItem[] {
  if (!raw?.trim()) return [];
  // JSON array support
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === "string") {
              return { text: item.trim(), included: true };
            }
            if (item && typeof item === "object") {
              const o = item as { text?: unknown; included?: unknown; label?: unknown };
              const text = String(o.text ?? o.label ?? "").trim();
              if (!text) return null;
              return { text, included: o.included !== false };
            }
            return null;
          })
          .filter((x): x is SubscriptionFeatureItem => Boolean(x));
      }
    } catch {
      /* fall through to line parse */
    }
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^[-xX×✗✘]\s+/.test(line) || /\|?\s*(no|0|false)\s*$/i.test(line)) {
        const text = line
          .replace(/^[-xX×✗✘]\s+/, "")
          .replace(/\s*\|\s*(no|0|false)\s*$/i, "")
          .trim();
        return { text, included: false };
      }
      const text = line.replace(/^[+✓✔]\s+/, "").replace(/\s*\|\s*(yes|1|true)\s*$/i, "").trim();
      return { text, included: true };
    })
    .filter((f) => f.text.length > 0);
}

export function serializeSubscriptionFeatures(features: SubscriptionFeatureItem[]): string {
  return features
    .map((f) => (f.included ? `+ ${f.text}` : `- ${f.text}`))
    .join("\n");
}

export function featuresToJson(features: SubscriptionFeatureItem[]): string {
  return JSON.stringify(features);
}
