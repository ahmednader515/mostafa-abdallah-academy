"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type HomeHeroSlide = { desktop: string; tablet: string; mobile: string; href: string | null };

export function HomeHeroImageSlider({
  slides,
  intervalMs = 5000,
}: {
  slides: HomeHeroSlide[];
  intervalMs?: number;
}) {
  const safeSlides = useMemo(
    () =>
      slides
        .map((s) => ({
          desktop: String(s.desktop).trim(),
          tablet: String(s.tablet).trim(),
          mobile: String(s.mobile).trim(),
          href: s.href && String(s.href).trim() ? String(s.href).trim() : null,
        }))
        .filter((s) => Boolean(s.desktop || s.tablet || s.mobile))
        .map((s) => {
          const fallback = s.desktop || s.tablet || s.mobile;
          return {
            desktop: s.desktop || fallback,
            tablet: s.tablet || fallback,
            mobile: s.mobile || fallback,
            href: s.href,
          };
        }),
    [slides],
  );
  const [active, setActive] = useState(0);
  const canSlide = safeSlides.length > 1;
  const safeInterval = Number.isFinite(intervalMs) && intervalMs >= 1500 && intervalMs <= 20000
    ? Math.round(intervalMs)
    : 5000;

  useEffect(() => {
    if (!canSlide) return;
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % safeSlides.length);
    }, safeInterval);
    return () => window.clearInterval(timer);
  }, [canSlide, safeSlides.length, safeInterval]);

  if (safeSlides.length === 0) {
    return (
      <div className="relative w-full">
        <div className="flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center border-y border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-muted)]">
          لا توجد صور مضافة للقالب الثاني حتى الآن.
        </div>
      </div>
    );
  }

  const activeHref = safeSlides[active]?.href ?? null;

  return (
    <div className="relative w-full">
      <div className="relative w-full overflow-hidden border-y border-[var(--color-border)] bg-black/10 shadow-[var(--shadow-card)]">
        <div className="relative h-[calc(100vh-3.5rem)] w-full">
          {safeSlides.map((slide, idx) => {
            const isLcpCandidate = idx === 0;
            const visibility = `absolute inset-0 z-0 object-cover transition-opacity duration-700 ease-in-out ${
              idx === active ? "opacity-100" : "opacity-0"
            }`;
            return (
              <div key={`${slide.desktop}|${slide.tablet}|${slide.mobile}|${idx}`} aria-hidden={idx !== active}>
                {/* Mobile */}
                <Image
                  src={slide.mobile}
                  alt={`صورة الهيرو ${idx + 1}`}
                  fill
                  sizes="100vw"
                  priority={isLcpCandidate}
                  fetchPriority={isLcpCandidate ? "high" : "low"}
                  {...(!isLcpCandidate ? { loading: "lazy" as const } : {})}
                  quality={isLcpCandidate ? 72 : 65}
                  className={`${visibility} block sm:hidden`}
                />
                {/* Tablet */}
                <Image
                  src={slide.tablet}
                  alt={`صورة الهيرو ${idx + 1}`}
                  fill
                  sizes="100vw"
                  priority={isLcpCandidate}
                  fetchPriority={isLcpCandidate ? "high" : "low"}
                  {...(!isLcpCandidate ? { loading: "lazy" as const } : {})}
                  quality={isLcpCandidate ? 72 : 65}
                  className={`${visibility} hidden sm:block lg:hidden`}
                />
                {/* Desktop */}
                <Image
                  src={slide.desktop}
                  alt={`صورة الهيرو ${idx + 1}`}
                  fill
                  sizes="100vw"
                  priority={isLcpCandidate}
                  fetchPriority={isLcpCandidate ? "high" : "low"}
                  {...(!isLcpCandidate ? { loading: "lazy" as const } : {})}
                  quality={isLcpCandidate ? 72 : 65}
                  className={`${visibility} hidden lg:block`}
                />
              </div>
            );
          })}
          {activeHref ? (
            <Link
              href={activeHref}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label="الانتقال إلى صفحة الكورس المرتبطة بهذه الشريحة"
            />
          ) : null}
        </div>

        {canSlide ? (
          <>
            <button
              type="button"
              aria-label="الصورة السابقة"
              onClick={() => setActive((prev) => (prev - 1 + safeSlides.length) % safeSlides.length)}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 px-3 py-2 text-white transition hover:bg-black/55"
            >
              &#10095;
            </button>
            <button
              type="button"
              aria-label="الصورة التالية"
              onClick={() => setActive((prev) => (prev + 1) % safeSlides.length)}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 px-3 py-2 text-white transition hover:bg-black/55"
            >
              &#10094;
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
