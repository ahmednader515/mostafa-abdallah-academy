"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function CertificateVerifyForm({ initialId = "" }: { initialId?: string }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(initialId);
  const C = "certificates";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = value.trim();
    if (!id) return;
    router.push(`/certificates/verify/${encodeURIComponent(id)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
    >
      <h2 className="text-lg font-bold text-[var(--color-foreground)]">{t(`${C}.verifyTitle`)}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{t(`${C}.verifySubtitle`)}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t(`${C}.verifyPlaceholder`)}
          className="w-full flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 font-mono text-sm"
        />
        <button
          type="submit"
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          {t(`${C}.verifyButton`)}
        </button>
      </div>
    </form>
  );
}
