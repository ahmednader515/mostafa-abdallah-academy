import { formatPhoneForDisplay } from "@/lib/phone/format-display";

export function DisplayPhoneNumber({
  value,
  fallback = "—",
  className = "tabular-nums whitespace-nowrap",
}: {
  value?: string | null;
  fallback?: string;
  className?: string;
}) {
  const formatted = value?.trim() ? formatPhoneForDisplay(value) : "";
  if (!formatted) {
    return <span className={className}>{fallback}</span>;
  }
  return (
    <span className={className} dir="ltr">
      {formatted}
    </span>
  );
}
