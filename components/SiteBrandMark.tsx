"use client";

import Link from "next/link";
import { AcademyLogo } from "@/components/AcademyLogo";
import { useSiteBrand } from "@/components/SiteBrandProvider";
import { BRAND_NAME_EN } from "@/lib/brand";

/** Renders logo + platform name with optional dual-color name and show/hide toggles. */
export function SiteBrandMark({
  href = "/",
  size = "md",
  className = "",
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const {
    platformName,
    headerLogoUrl,
    platformNameColor,
    platformNameColor2,
    showPlatformName,
    showPlatformLogo,
  } = useSiteBrand();

  const displayName = platformName?.trim() || BRAND_NAME_EN;
  const color1 = platformNameColor?.trim() || "#FFFFFF";
  const color2 = platformNameColor2?.trim() || null;
  const showName = showPlatformName !== false;
  const showLogo = showPlatformLogo !== false;

  const logoClass =
    size === "lg"
      ? "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32"
      : size === "sm"
        ? "h-8 w-8"
        : "h-9 w-9 sm:h-10 sm:w-10";

  const nameClass =
    size === "lg"
      ? "text-base font-semibold tracking-tight sm:text-lg"
      : size === "sm"
        ? "text-xs font-semibold tracking-tight"
        : "min-w-0 truncate text-xs font-semibold tracking-tight sm:text-sm md:text-base";

  function renderName() {
    if (!showName) return null;
    if (color2) {
      const mid = Math.ceil(displayName.length / 2);
      const a = displayName.slice(0, mid);
      const b = displayName.slice(mid);
      return (
        <span className={nameClass}>
          <span style={{ color: color1 }}>{a}</span>
          <span style={{ color: color2 }}>{b}</span>
        </span>
      );
    }
    return (
      <span className={nameClass} style={{ color: color1 }}>
        {displayName}
      </span>
    );
  }

  if (!showLogo && !showName) {
    return (
      <Link href={href} dir="ltr" className={`inline-flex items-center ${className}`}>
        <span className="sr-only">{displayName}</span>
        <AcademyLogo className={logoClass} title={displayName} />
      </Link>
    );
  }

  // Always logo on the left, site name on its right — same in Arabic (RTL) and English (LTR).
  return (
    <Link href={href} dir="ltr" className={`flex min-w-0 shrink items-center gap-2 ${className}`}>
      {showLogo ? (
        headerLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headerLogoUrl}
            alt=""
            className={`${logoClass} shrink-0 rounded-full border border-[#F59E0B]/40 object-cover`}
          />
        ) : (
          <AcademyLogo className={`${logoClass} shrink-0`} title={displayName} />
        )
      ) : null}
      {renderName()}
    </Link>
  );
}
