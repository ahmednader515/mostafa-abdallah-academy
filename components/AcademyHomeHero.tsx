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
    stroke: "#2563EB",
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
        className="absolute start-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:border-[#2563EB] hover:text-[#2563EB] sm:start-2 lg:flex"
        aria-label={t("home.prevSlide", "Previous")}
      >
        <svg className="h-5 w-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute end-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:border-[#2563EB] hover:text-[#2563EB] sm:end-2 lg:flex"
        aria-label={t("home.nextSlide", "Next")}
      >
        <svg className="h-5 w-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.25)]">
        <div
          key={animKey}
          className="academy-hero-animate grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-10 xl:p-12"
        >
          <div className={`order-2 lg:order-1 ${isAr ? "text-right" : "text-left"}`}>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FEF3C7] px-3 py-1.5 text-xs font-semibold text-[#B45309]">
              <svg className="h-3.5 w-3.5 text-[#F59E0B]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M10 2.5 12.2 7l4.8.4-3.7 3.2 1.1 4.7L10 12.8 5.6 15.3l1.1-4.7L3 7.4 7.8 7 10 2.5z" />
              </svg>
              {isAr ? current.badgeAr : current.badgeEn}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-[1.25] tracking-tight text-[#0F172A] sm:text-4xl lg:text-[2.6rem]">
              {isAr ? current.titleLine1Ar : current.titleLine1En}
              <br />
              <span className="text-[#2563EB]">
                {isAr ? current.titleLine2Ar : current.titleLine2En}
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {isAr ? current.subtitleAr : current.subtitleEn}
            </p>

            <div className="academy-hero-animate-delay mt-6 flex flex-wrap gap-4 sm:gap-6">
              {current.features.map((f) => (
                <div key={f.kind} className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2563EB]/25 bg-[#EFF6FF]">
                    <FeatureIcon kind={f.kind} />
                  </span>
                  {isAr ? f.labelAr : f.labelEn}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1d4ed8] hover:shadow-lg"
              >
                {t("home.exploreCourses", "استكشاف الكورسات")}
                <svg className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href={subscribeHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#d97706] hover:shadow-lg"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M5 16 3 7l5.5 3L12 4l3.5 6L21 7l-2 9H5zm0 2h14v2H5v-2z" />
                </svg>
                {t("home.subscribeNow", "اشترك الآن")}
              </Link>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg lg:max-w-none">
              <Image
                src={current.image}
                alt={isAr ? current.titleLine1Ar : current.titleLine1En}
                fill
                priority={slide === 0}
                sizes="(max-width: 1024px) 90vw, 520px"
                className="object-contain object-center"
              />
              <div className="absolute bottom-3 start-3 flex items-center gap-2 rounded-xl bg-[#0F172A] px-3 py-2 shadow-lg sm:bottom-6 sm:start-6">
                <span className="text-[#F59E0B]" aria-hidden>
                  ★
                </span>
                <span className="text-sm font-bold text-white">{current.chipValue}</span>
                <span className="text-xs text-slate-300">
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
                i === slide ? "w-7 bg-[#2563EB]" : "w-2.5 bg-slate-300 hover:bg-slate-400"
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
