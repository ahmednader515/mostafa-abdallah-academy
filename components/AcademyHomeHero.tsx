"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useT } from "@/components/LocaleProvider";
import {
  ACADEMY_HOME_HERO_SLIDES,
  type AcademyHeroSlide,
} from "@/lib/academy-home-hero-slides";

function FeatureIcon({ kind }: { kind: "courses" | "trainers" | "certs" | "train" | "practice" | "succeed" }) {
  const common = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "courses" || kind === "train") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
        {kind === "train" ? (
          <path {...common} d="M4 14 12 9l8 5-8 5-8-5zM12 9v10" />
        ) : (
          <>
            <rect {...common} x="4" y="5" width="16" height="14" rx="2" />
            <path {...common} d="M10 9.5 15 12l-5 2.5v-5z" />
          </>
        )}
      </svg>
    );
  }
  if (kind === "trainers" || kind === "practice") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
        {kind === "practice" ? (
          <>
            <circle {...common} cx="12" cy="12" r="3" />
            <path {...common} d="M12 5v2M12 17v2M5 12h2M17 12h2" />
            <path {...common} d="m8 8 1.5 1.5M14.5 14.5 16 16M8 16l1.5-1.5M14.5 9.5 16 8" />
          </>
        ) : (
          <>
            <circle {...common} cx="9" cy="8" r="3" />
            <circle {...common} cx="17" cy="9" r="2.5" />
            <path {...common} d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" />
          </>
        )}
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      {kind === "succeed" ? (
        <path
          {...common}
          d="M10 2.5 12.2 7l4.8.4-3.7 3.2 1.1 4.7L10 12.8 5.6 15.3l1.1-4.7L3 7.4 7.8 7 10 2.5z"
        />
      ) : (
        <>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="m9 12 2 2 4-4" />
        </>
      )}
    </svg>
  );
}

export function AcademyHomeHero({
  subscribeHref = "/register",
  slides,
}: {
  subscribeHref?: string;
  slides?: AcademyHeroSlide[] | null;
}) {
  const t = useT();
  const locale = useLocale();
  const slideList =
    slides && slides.length > 0
      ? slides
      : ACADEMY_HOME_HERO_SLIDES;
  const [slide, setSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const totalSlides = slideList.length;
  const current = slideList[slide] ?? slideList[0];
  const isAr = locale === "ar";

  useEffect(() => {
    setSlide(0);
  }, [slideList.length, slideList[0]?.image]);

  function goTo(index: number) {
    setSlide(((index % totalSlides) + totalSlides) % totalSlides);
    setAnimKey((k) => k + 1);
  }

  function prev() {
    goTo(slide - 1);
  }
  function next() {
    goTo(slide + 1);
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % totalSlides);
      setAnimKey((k) => k + 1);
    }, 7000);
    return () => window.clearInterval(id);
  }, [totalSlides]);

  return (
    <section
      className="relative bg-[var(--color-sections)] px-3 py-6 sm:px-5 sm:py-8 lg:px-8"
      aria-label={t("home.heroAria", "Hero")}
    >
      <button
        type="button"
        onClick={prev}
        className="absolute start-1 top-[38%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] shadow-md transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] sm:start-2 sm:h-11 sm:w-11 lg:top-1/2"
        aria-label={t("home.prevSlide", "Previous")}
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute end-1 top-[38%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] shadow-md transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] sm:end-2 sm:h-11 sm:w-11 lg:top-1/2"
        aria-label={t("home.nextSlide", "Next")}
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] sm:rounded-3xl">
        <div
          key={animKey}
          className="academy-hero-animate grid items-center gap-4 p-4 sm:gap-6 sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-10 xl:p-12"
        >
          <div className={`order-2 lg:order-1 ${isAr ? "text-right" : "text-left"}`}>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/15 px-3 py-1.5 text-[11px] font-semibold text-[var(--color-accent)] sm:text-xs">
              <svg className="h-3.5 w-3.5 text-[var(--color-accent)]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M10 2.5 12.2 7l4.8.4-3.7 3.2 1.1 4.7L10 12.8 5.6 15.3l1.1-4.7L3 7.4 7.8 7 10 2.5z" />
              </svg>
              {isAr ? current.badgeAr : current.badgeEn}
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-[1.3] tracking-tight text-[var(--color-foreground)] sm:mt-4 sm:text-4xl lg:text-[2.6rem]">
              {isAr ? current.titleLine1Ar : current.titleLine1En}
              <br />
              <span className="text-[var(--color-primary)]">
                {isAr ? current.titleLine2Ar : current.titleLine2En}
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-muted)] sm:mt-4 sm:text-base">
              {isAr ? current.subtitleAr : current.subtitleEn}
            </p>

            <div className="academy-hero-animate-delay mt-5 flex flex-wrap gap-3 sm:mt-6 sm:gap-6">
              {current.features.map((f) => (
                <div key={f.kind} className="flex items-center gap-2 text-xs font-medium text-[var(--color-foreground)] sm:text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] text-[var(--color-primary)] sm:h-9 sm:w-9">
                    <FeatureIcon kind={f.kind} />
                  </span>
                  {isAr ? f.labelAr : f.labelEn}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[var(--color-primary-hover)] hover:shadow-lg"
              >
                {t("home.exploreCourses", "استكشاف الكورسات")}
                <svg className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href={subscribeHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[var(--color-accent-hover)] hover:shadow-lg"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M5 16 3 7l5.5 3L12 4l3.5 6L21 7l-2 9H5zm0 2h14v2H5v-2z" />
                </svg>
                {t("home.subscribeNow", "اشترك الآن")}
              </Link>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-sm sm:max-w-lg lg:max-w-none">
              <Image
                src={current.image}
                alt={isAr ? current.titleLine1Ar : current.titleLine1En}
                fill
                priority={slide === 0}
                sizes="(max-width: 1024px) 90vw, 520px"
                className="object-contain object-center"
              />
              <div className="absolute bottom-2 start-2 flex items-center gap-2 rounded-xl bg-[var(--color-navy)] px-2.5 py-1.5 shadow-lg sm:bottom-6 sm:start-6 sm:px-3 sm:py-2">
                <span className="text-[var(--color-accent)]" aria-hidden>
                  ★
                </span>
                <span className="text-sm font-bold text-white">{current.chipValue}</span>
                <span className="text-[10px] text-slate-300 sm:text-xs">
                  {isAr ? current.chipLabelAr : current.chipLabelEn}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pb-5">
          {slideList.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition ${
                i === slide
                  ? "w-7 bg-[var(--color-primary)]"
                  : "w-2.5 bg-[var(--color-border)] hover:bg-[var(--color-muted)]"
              }`}
              aria-label={`${t("home.slide", "Slide")} ${i + 1}`}
              aria-current={i === slide ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
