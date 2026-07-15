"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CountryFlag } from "@/components/CountryFlag";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  digitsOnly,
  getNationalMaxLength,
  getPhoneCountry,
  type PhoneCountry,
} from "@/lib/phone/countries";
import { useLocale } from "@/components/LocaleProvider";

type PhoneNumberInputProps = {
  id?: string;
  countryCode: string;
  nationalValue: string;
  onCountryChange: (code: string) => void;
  onNationalChange: (value: string) => void;
  required?: boolean;
  className?: string;
};

export function PhoneNumberInput({
  id = "phone",
  countryCode,
  nationalValue,
  onCountryChange,
  onNationalChange,
  required = false,
  className = "",
}: PhoneNumberInputProps) {
  const locale = useLocale();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const country = getPhoneCountry(countryCode);
  const maxLen = getNationalMaxLength(country);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectCountry(code: string) {
    onCountryChange(code);
    const next = getPhoneCountry(code);
    const trimmed = digitsOnly(nationalValue).slice(0, getNationalMaxLength(next));
    if (trimmed !== nationalValue) onNationalChange(trimmed);
    setOpen(false);
  }

  function handleNationalChange(raw: string) {
    const d = digitsOnly(raw).slice(0, maxLen);
    onNationalChange(d);
  }

  const countryLabel = (c: PhoneCountry) => (locale === "ar" ? c.nameAr : c.nameEn);
  const hintExample =
    locale === "ar"
      ? `مثال: ${country.nationalLength} أرقام`
      : `Example: ${country.nationalLength} digits`;

  return (
    <div className={className} ref={rootRef}>
      <div className="mt-1 flex flex-row" dir="ltr">
        <div className="relative shrink-0">
          <button
            type="button"
            id={`${id}-country`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            onClick={() => setOpen((o) => !o)}
            className="flex h-[42px] min-w-[5.5rem] items-center gap-2 rounded-l-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/30 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] sm:min-w-[6rem]"
          >
            <CountryFlag iso2={country.code} className="h-[18px] w-[27px] shrink-0 rounded-[3px] object-cover shadow-sm" />
            <span className="tabular-nums text-[var(--color-muted)]">+{country.dial}</span>
            <svg
              className={`h-3.5 w-3.5 shrink-0 text-[var(--color-muted)] transition ${open ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {open ? (
            <ul
              id={listId}
              role="listbox"
              aria-label={locale === "ar" ? "اختر الدولة" : "Select country"}
              className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-64 w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-hover)]"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              {PHONE_COUNTRIES.map((c) => {
                const selected = c.code === countryCode;
                return (
                  <li key={c.code} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => selectCountry(c.code)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm transition hover:bg-[var(--color-border)]/40 ${
                        selected ? "bg-[var(--color-primary)]/10" : ""
                      }`}
                    >
                      <CountryFlag iso2={c.code} className="h-4 w-6 shrink-0 rounded-[3px] object-cover" />
                      <span className="min-w-0 flex-1 font-medium text-[var(--color-foreground)]">
                        {countryLabel(c)}
                      </span>
                      <span className="shrink-0 tabular-nums text-[var(--color-muted)]">+{c.dial}</span>
                      {selected ? (
                        <svg className="h-4 w-4 shrink-0 text-[var(--color-primary)]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0l-3.25-3.25a1 1 0 111.42-1.42l2.54 2.54 6.54-6.54a1 1 0 011.42 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="w-4 shrink-0" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={nationalValue}
          onChange={(e) => handleNationalChange(e.target.value)}
          required={required}
          maxLength={maxLen}
          placeholder={country.placeholder}
          className="min-w-0 flex-1 rounded-r-[var(--radius-btn)] border border-l-0 border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>
      <p className="mt-1 text-xs text-[var(--color-muted)]" dir={locale === "ar" ? "rtl" : "ltr"}>
        {hintExample}
      </p>
    </div>
  );
}

export { DEFAULT_PHONE_COUNTRY };
