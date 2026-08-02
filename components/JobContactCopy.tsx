"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function JobContactCopy({
  phones,
  email,
  showPhone,
  showEmail,
  contactOrder,
}: {
  phones: string[];
  email: string | null;
  showPhone: boolean;
  showEmail: boolean;
  contactOrder: "phone_first" | "email_first";
}) {
  const t = useT();
  const [toast, setToast] = useState("");

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(t("jobs.copied", "Copied successfully."));
      window.setTimeout(() => setToast(""), 2000);
    } catch {
      setToast(t("jobs.copyFailed", "Could not copy"));
      window.setTimeout(() => setToast(""), 2000);
    }
  }

  const showPhones = showPhone && phones.length > 0;
  const showMail = showEmail && Boolean(email);

  if (!showPhones && !showMail) return null;

  const phoneBlock = showPhones ? (
    <div key="phones" className="space-y-2">
      {phones.map((phone, index) => (
        <div
          key={`${phone}-${index}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <a href={`tel:${phone}`} className="text-sm font-semibold text-[#001a3d]" dir="ltr">
            📞 {phone}
          </a>
          <button
            type="button"
            onClick={() => void copy(phone)}
            className="rounded-lg bg-[#001a3d] px-3 py-1.5 text-xs font-semibold text-white"
          >
            {t("jobs.copyPhone", "Copy number")}
          </button>
        </div>
      ))}
    </div>
  ) : null;

  const emailBlock = showMail && email ? (
    <div
      key="email"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
    >
      <a href={`mailto:${email}`} className="text-sm font-semibold text-[#001a3d]" dir="ltr">
        ✉️ {email}
      </a>
      <button
        type="button"
        onClick={() => void copy(email)}
        className="rounded-lg bg-[#001a3d] px-3 py-1.5 text-xs font-semibold text-white"
      >
        {t("jobs.copyEmail", "Copy email")}
      </button>
    </div>
  ) : null;

  const blocks =
    contactOrder === "email_first" ? [emailBlock, phoneBlock] : [phoneBlock, emailBlock];

  return (
    <div className="mt-8 space-y-3">
      <h2 className="text-lg font-bold text-[#001a3d]">{t("jobs.contactTitle", "Contact details")}</h2>
      {blocks}
      {toast ? (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-700">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
