"use client";

import { useState } from "react";
import { countryFlagUrl } from "@/lib/phone/flag-url";

type CountryFlagProps = {
  iso2: string;
  className?: string;
  title?: string;
};

export function CountryFlag({ iso2, className = "h-4 w-6 shrink-0 rounded-[3px] object-cover shadow-sm", title }: CountryFlagProps) {
  const [failed, setFailed] = useState(false);
  const code = iso2.toUpperCase();

  if (failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-[3px] bg-[var(--color-border)] text-[9px] font-bold text-[var(--color-muted)] ${className}`}
        title={title ?? code}
        aria-hidden
      >
        {code}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={countryFlagUrl(code)}
      srcSet={`${countryFlagUrl(code, 80)} 2x`}
      alt=""
      width={24}
      height={16}
      className={className}
      title={title}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
