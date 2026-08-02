type Props = {
  title: string;
  iconsJson: string | null | undefined;
};

function parseIcons(iconsJson: string | null | undefined): Array<{ label: string; imageUrl?: string }> {
  if (!iconsJson?.trim()) return [];
  try {
    const parsed = JSON.parse(iconsJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") {
          const s = item.trim();
          if (!s) return null;
          if (/^https?:\/\//i.test(s) || s.startsWith("/")) {
            return { label: "", imageUrl: s };
          }
          return { label: s };
        }
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const label = String(o.label ?? o.text ?? o.title ?? o.name ?? "").trim();
          const imageUrl = String(o.imageUrl ?? o.url ?? o.icon ?? "").trim() || undefined;
          if (!label && !imageUrl) return null;
          return { label, imageUrl };
        }
        return null;
      })
      .filter((x): x is { label: string; imageUrl?: string } => Boolean(x));
  } catch {
    return iconsJson
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) =>
        /^https?:\/\//i.test(s) || s.startsWith("/")
          ? { label: "", imageUrl: s }
          : { label: s }
      );
  }
}

export function CourseLearningOutcomes({ title, iconsJson }: Props) {
  const items = parseIcons(iconsJson);
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <li
            key={`${item.label}-${item.imageUrl ?? i}`}
            className="flex items-start gap-3 text-[var(--color-foreground)]"
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="mt-0.5 h-7 w-7 shrink-0 object-contain" />
            ) : (
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs text-[var(--color-primary)]"
                aria-hidden
              >
                ✓
              </span>
            )}
            {item.label ? (
              <span className="text-sm leading-relaxed sm:text-base">{item.label}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
