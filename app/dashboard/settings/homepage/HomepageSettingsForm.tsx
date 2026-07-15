"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  HomepageSetting,
  PlatformDetailsItem,
  PlatformDetailsPresetIcon,
  PlatformNewsItem,
} from "@/lib/types";
import { normalizeHeroHex } from "@/lib/hero-bg";
import {
  DEFAULT_PLATFORM_DETAILS_ITEMS,
  PLATFORM_DETAILS_PRESET_ICON_OPTIONS,
  parsePlatformDetailsItems,
} from "@/lib/platform-details";
import { parsePlatformNewsItems, PLATFORM_NEWS_MAX_ITEMS } from "@/lib/platform-news";
import { useT } from "@/components/LocaleProvider";
import { fillMessage } from "@/lib/i18n/interpolate";
import { ACADEMY_HOME_HERO_SLIDES } from "@/lib/academy-home-hero-slides";
import type { AcademyHeroSlide, AcademyHeroSlideFeature } from "@/lib/academy-home-hero-slides";
import {
  HERO_FEATURE_KINDS,
  emptyHeroSlide,
  parseHeroSlidesJson,
  parseMainNavFlagsJson,
  parseStatsRibbonJson,
  type HomepageMainNavFlags,
  type HomepageStatItem,
} from "@/lib/homepage-hero-stats";

type PublishedCourseOption = {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
};

function renderPresetIcon(icon: PlatformDetailsPresetIcon, className: string) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  switch (icon) {
    case "book":
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5.5V21" /></svg>;
    case "pencil":
      return <svg viewBox="0 0 24 24" {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z" /></svg>;
    case "bulb":
      return <svg viewBox="0 0 24 24" {...common}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5C9.5 16 9 15 8 14z" /></svg>;
    case "users":
      return <svg viewBox="0 0 24 24" {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="3.5" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a3.5 3.5 0 0 1 0 6.75" /></svg>;
    case "rocket":
      return <svg viewBox="0 0 24 24" {...common}><path d="M5 15c-1 0-2.5 0-3 1.5S1 20 1 20s2-.5 3.5-1S6 17 6 16" /><path d="M14 10 4 20" /><path d="M12 2s5 0 8 3 3 8 3 8-4 1-8-3-3-8-3-8z" /></svg>;
    case "target":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1.5" /></svg>;
    case "certificate":
      return <svg viewBox="0 0 24 24" {...common}><path d="M7 4h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4l-3 3v-3H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><circle cx="12" cy="9" r="2.5" /></svg>;
    case "chat":
    default:
      return <svg viewBox="0 0 24 24" {...common}><path d="M21 12a8 8 0 0 1-8 8H6l-3 3v-8a8 8 0 1 1 18-3z" /></svg>;
  }
}

export function HomepageSettingsForm({
  initialSettings,
}: {
  initialSettings: HomepageSetting;
  publishedCourses?: PublishedCourseOption[];
}) {
  const router = useRouter();
  const t = useT();
  const Hp = "dashboard.homepageSettingsForm";
  const fh = (key: string) => t(`${Hp}.${key}`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    platformName: initialSettings.platformName ?? "",
    platformNameEn: initialSettings.platformNameEn ?? "",
    headerLogoUrl: initialSettings.headerLogoUrl ?? "",
    youtubeUrl: initialSettings.youtubeUrl ?? "",
    linkedinUrl: initialSettings.linkedinUrl ?? "",
    pageTitle: initialSettings.pageTitle ?? "",
    pageTitleEn: initialSettings.pageTitleEn ?? "",
    whatsappUrl: initialSettings.whatsappUrl ?? "",
    facebookUrl: initialSettings.facebookUrl ?? "",
    telegramUrl: initialSettings.telegramUrl ?? "",
    teamYoutubeUrl: initialSettings.teamYoutubeUrl ?? "",
    teamLinkedinUrl: initialSettings.teamLinkedinUrl ?? "",
    teamWhatsappUrl: initialSettings.teamWhatsappUrl ?? "",
    teamFacebookUrl: initialSettings.teamFacebookUrl ?? "",
    teamTelegramUrl: initialSettings.teamTelegramUrl ?? "",
    socialRightLabel: initialSettings.socialRightLabel ?? "",
    socialRightLabelEn: initialSettings.socialRightLabelEn ?? "",
    socialLeftLabel: initialSettings.socialLeftLabel ?? "",
    socialLeftLabelEn: initialSettings.socialLeftLabelEn ?? "",
    socialLeftEnabled: initialSettings.socialLeftEnabled ?? true,
    footerTitle: initialSettings.footerTitle ?? "",
    footerTitleEn: initialSettings.footerTitleEn ?? "",
    footerTagline: initialSettings.footerTagline ?? "",
    footerTaglineEn: initialSettings.footerTaglineEn ?? "",
    footerCopyright: initialSettings.footerCopyright ?? "",
    footerCopyrightEn: initialSettings.footerCopyrightEn ?? "",
    reviewsSectionTitle: initialSettings.reviewsSectionTitle ?? "",
    reviewsSectionTitleEn: initialSettings.reviewsSectionTitleEn ?? "",
    reviewsSectionSubtitle: initialSettings.reviewsSectionSubtitle ?? "",
    reviewsSectionSubtitleEn: initialSettings.reviewsSectionSubtitleEn ?? "",
    ctaBadgeText: initialSettings.ctaBadgeText ?? "",
    ctaBadgeTextEn: initialSettings.ctaBadgeTextEn ?? "",
    ctaTitle: initialSettings.ctaTitle ?? "",
    ctaTitleEn: initialSettings.ctaTitleEn ?? "",
    ctaDescription: initialSettings.ctaDescription ?? "",
    ctaDescriptionEn: initialSettings.ctaDescriptionEn ?? "",
    ctaButtonText: initialSettings.ctaButtonText ?? "",
    ctaButtonTextEn: initialSettings.ctaButtonTextEn ?? "",
    platformDetailsEnabled: Boolean(initialSettings.platformDetailsEnabled ?? false),
    platformDetailsTitle: initialSettings.platformDetailsTitle ?? "",
    platformDetailsTitleEn: initialSettings.platformDetailsTitleEn ?? "",
    platformDetailsSubtitle: initialSettings.platformDetailsSubtitle ?? "",
    platformDetailsSubtitleEn: initialSettings.platformDetailsSubtitleEn ?? "",
    platformDetailsBackgroundColor: initialSettings.platformDetailsBackgroundColor ?? "",
    platformNewsEnabled: Boolean(initialSettings.platformNewsEnabled ?? false),
    platformNewsSectionTitle: initialSettings.platformNewsSectionTitle ?? "",
    platformNewsSectionTitleEn: initialSettings.platformNewsSectionTitleEn ?? "",
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");
  const [platformItemUploading, setPlatformItemUploading] = useState<string | null>(null);
  const [platformDetailsItems, setPlatformDetailsItems] = useState<PlatformDetailsItem[]>(
    parsePlatformDetailsItems(initialSettings.platformDetailsItems),
  );
  const [platformNewsItems, setPlatformNewsItems] = useState<PlatformNewsItem[]>(
    parsePlatformNewsItems(initialSettings.platformNewsItems),
  );
  const [platformNewsUploading, setPlatformNewsUploading] = useState<string | null>(null);

  const [heroSlides, setHeroSlides] = useState<AcademyHeroSlide[]>(() =>
    parseHeroSlidesJson(initialSettings.heroSlidesJson),
  );
  const [heroSlideImageUploading, setHeroSlideImageUploading] = useState<number | null>(null);
  const [statsRibbon, setStatsRibbon] = useState<HomepageStatItem[]>(() =>
    parseStatsRibbonJson(initialSettings.statsRibbonJson),
  );
  const [mainNavFlags, setMainNavFlags] = useState<HomepageMainNavFlags>(() =>
    parseMainNavFlagsJson(initialSettings.mainNavFlagsJson),
  );

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  function normalizeTelegramInput(value: string): string {
    const raw = value.trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^t\.me\//i.test(raw) || /^telegram\.me\//i.test(raw)) return `https://${raw}`;
    return raw;
  }

  useEffect(() => {
    setPlatformDetailsItems(parsePlatformDetailsItems(initialSettings.platformDetailsItems));
  }, [initialSettings.platformDetailsItems]);

  useEffect(() => {
    setPlatformNewsItems(parsePlatformNewsItems(initialSettings.platformNewsItems));
  }, [initialSettings.platformNewsItems]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      platformNewsSectionTitle: initialSettings.platformNewsSectionTitle ?? "",
    }));
  }, [initialSettings.platformNewsSectionTitle]);

  useEffect(() => {
    setHeroSlides(parseHeroSlidesJson(initialSettings.heroSlidesJson));
  }, [initialSettings.heroSlidesJson]);

  useEffect(() => {
    setStatsRibbon(parseStatsRibbonJson(initialSettings.statsRibbonJson));
  }, [initialSettings.statsRibbonJson]);

  useEffect(() => {
    setMainNavFlags(parseMainNavFlagsJson(initialSettings.mainNavFlagsJson));
  }, [initialSettings.mainNavFlagsJson]);

  const canAddHeroSlide = heroSlides.length < 8;

  function addHeroSlide() {
    if (!canAddHeroSlide) return;
    setHeroSlides((prev) => [...prev, emptyHeroSlide()]);
  }

  function removeHeroSlide(idx: number) {
    setHeroSlides((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveHeroSlide(idx: number, dir: -1 | 1) {
    setHeroSlides((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function updateHeroSlide(idx: number, patch: Partial<AcademyHeroSlide>) {
    setHeroSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function addHeroSlideFeature(idx: number) {
    setHeroSlides((prev) =>
      prev.map((s, i) =>
        i === idx && s.features.length < 6
          ? { ...s, features: [...s.features, { kind: "courses", labelAr: "", labelEn: "" }] }
          : s,
      ),
    );
  }

  function removeHeroSlideFeature(idx: number, featureIdx: number) {
    setHeroSlides((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, features: s.features.filter((_, fi) => fi !== featureIdx) } : s,
      ),
    );
  }

  function updateHeroSlideFeature(
    idx: number,
    featureIdx: number,
    patch: Partial<AcademyHeroSlideFeature>,
  ) {
    setHeroSlides((prev) =>
      prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              features: s.features.map((f, fi) => (fi === featureIdx ? { ...f, ...patch } : f)),
            }
          : s,
      ),
    );
  }

  function restoreDefaultHeroSlides() {
    setHeroSlides(
      ACADEMY_HOME_HERO_SLIDES.map((s) => ({ ...s, features: s.features.map((f) => ({ ...f })) })),
    );
  }

  async function uploadHeroSlideImage(idx: number, file: File) {
    setHeroSlideImageUploading(idx);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        updateHeroSlide(idx, { image: data.url });
      }
    } finally {
      setHeroSlideImageUploading(null);
    }
  }

  function updateStatItem(idx: number, patch: Partial<HomepageStatItem>) {
    setStatsRibbon((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function heroFeatureKindLabel(kind: AcademyHeroSlideFeature["kind"]): string {
    switch (kind) {
      case "courses":
        return fh("heroFeatureKindCourses");
      case "trainers":
        return fh("heroFeatureKindTrainers");
      case "certs":
        return fh("heroFeatureKindCerts");
      case "train":
        return fh("heroFeatureKindTrain");
      case "practice":
        return fh("heroFeatureKindPractice");
      case "succeed":
      default:
        return fh("heroFeatureKindSucceed");
    }
  }

  function statKindLabel(kind: HomepageStatItem["kind"]): string {
    switch (kind) {
      case "students":
        return fh("statKindStudents");
      case "courses":
        return fh("statKindCourses");
      case "trainers":
        return fh("statKindTrainers");
      case "satisfaction":
      default:
        return fh("statKindSatisfaction");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      if (platformDetailsItems.length > 4) {
        throw new Error(t(`${Hp}.validation.platformDetailsCardsMax`));
      }
      if (
        platformDetailsItems.some(
          (item) =>
            !item.title.trim() ||
            !item.description.trim() ||
            (item.iconType === "upload" && !item.customIconUrl?.trim()),
        )
      ) {
        throw new Error(t(`${Hp}.validation.platformDetailsCardsComplete`));
      }
      const platformDetailsBgNorm = form.platformDetailsBackgroundColor.trim()
        ? normalizeHeroHex(form.platformDetailsBackgroundColor.trim())
        : null;
      if (form.platformDetailsBackgroundColor.trim() && !platformDetailsBgNorm) {
        throw new Error(t(`${Hp}.validation.platformDetailsBgHex`));
      }
      if (platformNewsItems.length > PLATFORM_NEWS_MAX_ITEMS) {
        throw new Error(
          fillMessage(t(`${Hp}.validation.platformNewsMax`), { max: PLATFORM_NEWS_MAX_ITEMS }),
        );
      }
      if (
        platformNewsItems.some(
          (item) =>
            (item.imageUrl.trim() && !item.description.trim()) ||
            (!item.imageUrl.trim() && item.description.trim()),
        )
      ) {
        throw new Error(t(`${Hp}.validation.platformNewsPairs`));
      }
      if (heroSlides.length > 8) {
        throw new Error(t(`${Hp}.validation.heroSlidesMax`));
      }
      if (heroSlides.some((s) => !s.image.trim())) {
        throw new Error(t(`${Hp}.validation.heroSlideImageRequired`));
      }
      const res = await fetch("/api/dashboard/settings/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: form.platformName.trim() || null,
          platformNameEn: form.platformNameEn.trim() || null,
          headerLogoUrl: form.headerLogoUrl.trim() || null,
          youtubeUrl: form.youtubeUrl.trim() || null,
          linkedinUrl: form.linkedinUrl.trim() || null,
          pageTitle: form.pageTitle.trim() || null,
          pageTitleEn: form.pageTitleEn.trim() || null,
          whatsappUrl: form.whatsappUrl.trim() || null,
          facebookUrl: form.facebookUrl.trim() || null,
          telegramUrl: normalizeTelegramInput(form.telegramUrl) || null,
          teamYoutubeUrl: form.teamYoutubeUrl.trim() || null,
          teamLinkedinUrl: form.teamLinkedinUrl.trim() || null,
          teamWhatsappUrl: form.teamWhatsappUrl.trim() || null,
          teamFacebookUrl: form.teamFacebookUrl.trim() || null,
          teamTelegramUrl: normalizeTelegramInput(form.teamTelegramUrl) || null,
          socialRightLabel: form.socialRightLabel.trim() || null,
          socialRightLabelEn: form.socialRightLabelEn.trim() || null,
          socialLeftLabel: form.socialLeftLabel.trim() || null,
          socialLeftLabelEn: form.socialLeftLabelEn.trim() || null,
          socialLeftEnabled: form.socialLeftEnabled,
          footerTitle: form.footerTitle.trim() || null,
          footerTitleEn: form.footerTitleEn.trim() || null,
          footerTagline: form.footerTagline.trim() || null,
          footerTaglineEn: form.footerTaglineEn.trim() || null,
          footerCopyright: form.footerCopyright.trim() || null,
          footerCopyrightEn: form.footerCopyrightEn.trim() || null,
          reviewsSectionTitle: form.reviewsSectionTitle.trim() || null,
          reviewsSectionTitleEn: form.reviewsSectionTitleEn.trim() || null,
          reviewsSectionSubtitle: form.reviewsSectionSubtitle.trim() || null,
          reviewsSectionSubtitleEn: form.reviewsSectionSubtitleEn.trim() || null,
          ctaBadgeText: form.ctaBadgeText.trim() || null,
          ctaBadgeTextEn: form.ctaBadgeTextEn.trim() || null,
          ctaTitle: form.ctaTitle.trim() || null,
          ctaTitleEn: form.ctaTitleEn.trim() || null,
          ctaDescription: form.ctaDescription.trim() || null,
          ctaDescriptionEn: form.ctaDescriptionEn.trim() || null,
          ctaButtonText: form.ctaButtonText.trim() || null,
          ctaButtonTextEn: form.ctaButtonTextEn.trim() || null,
          platformDetailsEnabled: form.platformDetailsEnabled,
          platformDetailsTitle: form.platformDetailsTitle.trim() || null,
          platformDetailsTitleEn: form.platformDetailsTitleEn.trim() || null,
          platformDetailsSubtitle: form.platformDetailsSubtitle.trim() || null,
          platformDetailsSubtitleEn: form.platformDetailsSubtitleEn.trim() || null,
          platformDetailsBackgroundColor: platformDetailsBgNorm,
          platformDetailsItems,
          platformNewsEnabled: form.platformNewsEnabled,
          platformNewsSectionTitle: form.platformNewsSectionTitle.trim() || null,
          platformNewsSectionTitleEn: form.platformNewsSectionTitleEn.trim() || null,
          platformNewsItems: platformNewsItems.filter(
            (item) => item.imageUrl.trim() && item.description.trim(),
          ),
          heroSlides,
          statsRibbon,
          mainNavFlags,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t(`${Hp}.saveFailed`));
      setSuccess(t(`${Hp}.saveSuccess`));
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : t(`${Hp}.saveSettingsGeneric`));
    } finally {
      setSaving(false);
    }
  }

  const canAddPlatformDetailItem = platformDetailsItems.length < 4;
  const canAddPlatformNewsItem = platformNewsItems.length < PLATFORM_NEWS_MAX_ITEMS;

  function addPlatformNewsItem() {
    if (!canAddPlatformNewsItem) return;
    setPlatformNewsItems((prev) => [
      ...prev,
      { id: `platform-news-${Date.now()}`, imageUrl: "", description: "" },
    ]);
  }

  function addPlatformDetailsItem() {
    if (!canAddPlatformDetailItem) return;
    setPlatformDetailsItems((prev) => [
      ...prev,
      {
        id: `platform-detail-${Date.now()}`,
        title: "",
        description: "",
        iconType: "preset",
        presetIcon: "chat",
        customIconUrl: null,
      },
    ]);
  }

  return (
    <>
      <form
        id="homepage-settings-form"
        onSubmit={handleSubmit}
        className="mt-6 max-w-2xl space-y-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
      >
      {saving ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
          <div className="w-[min(92vw,22rem)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-[var(--shadow-hover)]">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{t(`${Hp}.savingOverlayTitle`)}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{t(`${Hp}.savingOverlaySubtitle`)}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="loading-dot h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] [animation-delay:-0.32s]" />
              <span className="loading-dot h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] [animation-delay:-0.16s]" />
              <span className="loading-dot h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
            </div>
          </div>
        </div>
      ) : null}
      {error && (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/15 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">{fh("heroSlidesTitle")}</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">{fh("heroSlidesIntro")}</p>
        <div className="space-y-6">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                  {fillMessage(fh("heroSlideN"), { n: String(idx + 1) })}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveHeroSlide(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-[var(--color-foreground)] disabled:opacity-40"
                    aria-label={fh("moveSlideUp")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveHeroSlide(idx, 1)}
                    disabled={idx === heroSlides.length - 1}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-[var(--color-foreground)] disabled:opacity-40"
                    aria-label={fh("moveSlideDown")}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHeroSlide(idx)}
                    className="rounded-[var(--radius-btn)] border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
                  >
                    {fh("delete")}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,180px)_1fr] sm:items-start">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted)]">{fh("heroSlideImageLabel")}</label>
                  {slide.image ? (
                    <img
                      src={slide.image}
                      alt=""
                      className="mt-1 aspect-[4/3] w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] object-contain bg-white"
                    />
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={slide.image}
                      onChange={(e) => updateHeroSlide(idx, { image: e.target.value })}
                      placeholder={fh("heroSlideImageUrlPh")}
                      className="min-w-[140px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    />
                    <label className="shrink-0 cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 disabled:opacity-50">
                      {heroSlideImageUploading === idx ? fh("uploading") : fh("upload")}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={heroSlideImageUploading !== null}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          await uploadHeroSlideImage(idx, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-muted)]">{fh("heroSlideBadgeLabel")}</label>
                    <input
                      type="text"
                      value={slide.badgeAr}
                      onChange={(e) => updateHeroSlide(idx, { badgeAr: e.target.value })}
                      maxLength={120}
                      placeholder={fh("heroSlideBadgeArPh")}
                      className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={slide.badgeEn}
                      onChange={(e) => updateHeroSlide(idx, { badgeEn: e.target.value })}
                      maxLength={120}
                      dir="ltr"
                      placeholder={fh("heroSlideBadgeEnPh")}
                      className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)]">{fh("heroSlideTitleLine1Label")}</label>
                      <input
                        type="text"
                        value={slide.titleLine1Ar}
                        onChange={(e) => updateHeroSlide(idx, { titleLine1Ar: e.target.value })}
                        maxLength={120}
                        className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={slide.titleLine1En}
                        onChange={(e) => updateHeroSlide(idx, { titleLine1En: e.target.value })}
                        maxLength={120}
                        dir="ltr"
                        className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)]">{fh("heroSlideTitleLine2Label")}</label>
                      <input
                        type="text"
                        value={slide.titleLine2Ar}
                        onChange={(e) => updateHeroSlide(idx, { titleLine2Ar: e.target.value })}
                        maxLength={120}
                        className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={slide.titleLine2En}
                        onChange={(e) => updateHeroSlide(idx, { titleLine2En: e.target.value })}
                        maxLength={120}
                        dir="ltr"
                        className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-muted)]">{fh("heroSlideSubtitleLabel")}</label>
                    <textarea
                      value={slide.subtitleAr}
                      onChange={(e) => updateHeroSlide(idx, { subtitleAr: e.target.value })}
                      maxLength={600}
                      rows={2}
                      className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    />
                    <textarea
                      value={slide.subtitleEn}
                      onChange={(e) => updateHeroSlide(idx, { subtitleEn: e.target.value })}
                      maxLength={600}
                      rows={2}
                      dir="ltr"
                      className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)]">{fh("heroSlideChipValueLabel")}</label>
                      <input
                        type="text"
                        value={slide.chipValue}
                        onChange={(e) => updateHeroSlide(idx, { chipValue: e.target.value })}
                        maxLength={40}
                        className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-muted)]">{fh("heroSlideChipLabelLabel")}</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={slide.chipLabelAr}
                          onChange={(e) => updateHeroSlide(idx, { chipLabelAr: e.target.value })}
                          maxLength={80}
                          className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={slide.chipLabelEn}
                          onChange={(e) => updateHeroSlide(idx, { chipLabelEn: e.target.value })}
                          maxLength={80}
                          dir="ltr"
                          className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium text-[var(--color-muted)]">{fh("heroSlideFeaturesTitle")}</label>
                      <button
                        type="button"
                        onClick={() => addHeroSlideFeature(idx)}
                        disabled={slide.features.length >= 6}
                        className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-50"
                      >
                        {fh("addHeroSlideFeature")}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {slide.features.map((feature, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex flex-wrap items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
                        >
                          <select
                            value={feature.kind}
                            onChange={(e) =>
                              updateHeroSlideFeature(idx, fIdx, {
                                kind: e.target.value as AcademyHeroSlideFeature["kind"],
                              })
                            }
                            className="shrink-0 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs"
                          >
                            {HERO_FEATURE_KINDS.map((kind) => (
                              <option key={kind} value={kind}>
                                {heroFeatureKindLabel(kind)}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={feature.labelAr}
                            onChange={(e) => updateHeroSlideFeature(idx, fIdx, { labelAr: e.target.value })}
                            maxLength={80}
                            placeholder={fh("heroSlideFeatureLabelArPh")}
                            className="min-w-[100px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs"
                          />
                          <input
                            type="text"
                            value={feature.labelEn}
                            onChange={(e) => updateHeroSlideFeature(idx, fIdx, { labelEn: e.target.value })}
                            maxLength={80}
                            dir="ltr"
                            placeholder={fh("heroSlideFeatureLabelEnPh")}
                            className="min-w-[100px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeHeroSlideFeature(idx, fIdx)}
                            className="shrink-0 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                          >
                            {fh("removeFeature")}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addHeroSlide}
            disabled={!canAddHeroSlide}
            className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-50"
          >
            {fillMessage(fh("addHeroSlideWithCount"), { current: heroSlides.length, max: 8 })}
          </button>
          <button
            type="button"
            onClick={restoreDefaultHeroSlides}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-foreground)]"
          >
            {fh("restoreDefaultHeroSlides")}
          </button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">{fh("statsRibbonTitle")}</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">{fh("statsRibbonIntro")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {statsRibbon.map((stat, idx) => (
            <div
              key={stat.kind}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
            >
              <p className="mb-2 text-xs font-semibold text-[var(--color-primary)]">{statKindLabel(stat.kind)}</p>
              <label className="block text-xs font-medium text-[var(--color-muted)]">{fh("statValueLabel")}</label>
              <input
                type="text"
                value={stat.value}
                onChange={(e) => updateStatItem(idx, { value: e.target.value })}
                maxLength={40}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
              <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("statLabelArLabel")}</label>
              <input
                type="text"
                value={stat.labelAr}
                onChange={(e) => updateStatItem(idx, { labelAr: e.target.value })}
                maxLength={80}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
              <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("statLabelEnLabel")}</label>
              <input
                type="text"
                value={stat.labelEn}
                onChange={(e) => updateStatItem(idx, { labelEn: e.target.value })}
                maxLength={80}
                dir="ltr"
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">{fh("mainNavTitle")}</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">{fh("mainNavIntro")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm font-medium text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="accent-[var(--color-primary)]"
              checked={mainNavFlags.jobs}
              onChange={(e) => setMainNavFlags((f) => ({ ...f, jobs: e.target.checked }))}
            />
            {fh("mainNavJobs")}
          </label>
          <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm font-medium text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="accent-[var(--color-primary)]"
              checked={mainNavFlags.courses}
              onChange={(e) => setMainNavFlags((f) => ({ ...f, courses: e.target.checked }))}
            />
            {fh("mainNavCourses")}
          </label>
          <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm font-medium text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="accent-[var(--color-primary)]"
              checked={mainNavFlags.library}
              onChange={(e) => setMainNavFlags((f) => ({ ...f, library: e.target.checked }))}
            />
            {fh("mainNavLibrary")}
          </label>
          <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm font-medium text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="accent-[var(--color-primary)]"
              checked={mainNavFlags.social}
              onChange={(e) => setMainNavFlags((f) => ({ ...f, social: e.target.checked }))}
            />
            {fh("mainNavSocial")}
          </label>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-3 text-lg font-semibold text-[var(--color-foreground)]">{fh("headerLogoTitle")}</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">{fh("headerLogoIntro")}</p>
        {form.headerLogoUrl ? (
          <div className="mb-3 flex items-center gap-3">
            <img
              src={form.headerLogoUrl}
              alt={fh("logoPreviewAlt")}
              className="h-10 w-10 rounded-[10px] border border-[var(--color-border)] object-contain bg-[var(--color-background)] p-1"
            />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, headerLogoUrl: "" }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/50"
            >
              {fh("deleteLogo")}
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
            {logoUploading ? fh("uploading") : fh("uploadLogo")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={logoUploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setLogoUploadError("");
                setLogoUploading(true);
                try {
                  const fd = new FormData();
                  fd.set("file", f);
                  const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data.url) {
                    setForm((prev) => ({ ...prev, headerLogoUrl: data.url }));
                  } else {
                    setLogoUploadError(data.error ?? fh("uploadFailed"));
                  }
                } catch {
                  setLogoUploadError(fh("connectionFailed"));
                } finally {
                  setLogoUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
        {logoUploadError ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{logoUploadError}</p>
        ) : null}
        <input
          type="text"
          value={form.headerLogoUrl}
          onChange={(e) => {
            setForm((f) => ({ ...f, headerLogoUrl: e.target.value }));
            setLogoUploadError("");
          }}
          placeholder={fh("logoUrlPh")}
          className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{fh("homeTextsTitle")}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("platformNameLabel")}</label>
            <input
              type="text"
              value={form.platformName}
              onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phPlatformNameAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelFieldEn")}</label>
            <input
              type="text"
              value={form.platformNameEn}
              onChange={(e) => setForm((f) => ({ ...f, platformNameEn: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phPlatformNameEn")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("browserTabTitleLabel")}</label>
            <input
              type="text"
              value={form.pageTitle}
              onChange={(e) => setForm((f) => ({ ...f, pageTitle: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phPageTitleAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelPageTitleEn")}</label>
            <input
              type="text"
              value={form.pageTitleEn}
              onChange={(e) => setForm((f) => ({ ...f, pageTitleEn: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phPageTitleEn")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("footerTitleLabel")}</label>
            <input
              type="text"
              value={form.footerTitle}
              onChange={(e) => setForm((f) => ({ ...f, footerTitle: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phFooterTitleAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelFooterTitleEn")}</label>
            <input
              type="text"
              value={form.footerTitleEn}
              onChange={(e) => setForm((f) => ({ ...f, footerTitleEn: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phFooterTitleEn")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("footerTaglineLabel")}</label>
            <input
              type="text"
              value={form.footerTagline}
              onChange={(e) => setForm((f) => ({ ...f, footerTagline: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phFooterTaglineAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelFooterTaglineEn")}</label>
            <input
              type="text"
              value={form.footerTaglineEn}
              onChange={(e) => setForm((f) => ({ ...f, footerTaglineEn: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phFooterTaglineEn")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("copyrightLabel")}</label>
            <input
              type="text"
              value={form.footerCopyright}
              onChange={(e) => setForm((f) => ({ ...f, footerCopyright: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phCopyrightAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelCopyrightEn")}</label>
            <input
              type="text"
              value={form.footerCopyrightEn}
              onChange={(e) => setForm((f) => ({ ...f, footerCopyrightEn: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phCopyrightEn")}
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("copyrightHint")}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{fh("platformDetailsMainTitle")}</h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">{fh("platformDetailsMainIntro")}</p>
        <label className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
          <input
            type="checkbox"
            className="accent-[var(--color-primary)]"
            checked={form.platformDetailsEnabled}
            onChange={(e) => setForm((f) => ({ ...f, platformDetailsEnabled: e.target.checked }))}
          />
          {fh("enablePlatformDetails")}
        </label>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("platformDetailsHeadingLabel")}</label>
            <input
              type="text"
              value={form.platformDetailsTitle}
              onChange={(e) => setForm((f) => ({ ...f, platformDetailsTitle: e.target.value }))}
              maxLength={240}
              placeholder={fh("phPlatformDetailsTitle")}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("sectionTitleEnLabel")}</label>
            <input
              type="text"
              value={form.platformDetailsTitleEn}
              onChange={(e) => setForm((f) => ({ ...f, platformDetailsTitleEn: e.target.value }))}
              maxLength={240}
              placeholder={fh("phPlatformDetailsTitleEn")}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("platformDetailsDescLabel")}</label>
            <textarea
              value={form.platformDetailsSubtitle}
              onChange={(e) => setForm((f) => ({ ...f, platformDetailsSubtitle: e.target.value }))}
              rows={2}
              maxLength={500}
              placeholder={fh("phPlatformDetailsDesc")}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("sectionDescEnLabel")}</label>
            <textarea
              value={form.platformDetailsSubtitleEn}
              onChange={(e) => setForm((f) => ({ ...f, platformDetailsSubtitleEn: e.target.value }))}
              rows={2}
              maxLength={500}
              placeholder={fh("phPlatformDetailsDescEn")}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("platformDetailsBgLabel")}</label>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("platformDetailsBgHint")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={normalizeHeroHex(form.platformDetailsBackgroundColor) ?? "#ffffff"}
                onChange={(e) => setForm((f) => ({ ...f, platformDetailsBackgroundColor: e.target.value }))}
                className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
                aria-label={fh("ariaPlatformDetailsBg")}
              />
              <input
                type="text"
                value={form.platformDetailsBackgroundColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, platformDetailsBackgroundColor: e.target.value }))
                }
                placeholder="#F5F7FB"
                className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, platformDetailsBackgroundColor: "" }))}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-foreground)]"
              >
                {fh("useDefault")}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{fh("cardsUpTo4")}</h4>
            <button
              type="button"
              onClick={addPlatformDetailsItem}
              disabled={!canAddPlatformDetailItem}
              className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-50"
            >
              {fh("addCard")}
            </button>
          </div>
          <div className="space-y-3">
            {platformDetailsItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--color-muted)]">
                    {fillMessage(fh("cardIndex"), { n: idx + 1 })}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setPlatformDetailsItems((prev) => prev.filter((entry) => entry.id !== item.id))
                    }
                    className="rounded-[var(--radius-btn)] border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
                  >
                    {fh("delete")}
                  </button>
                </div>
                <div className="grid gap-3">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      setPlatformDetailsItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, title: e.target.value } : entry,
                        ),
                      )
                    }
                    maxLength={120}
                    placeholder={fh("cardTitlePh")}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      setPlatformDetailsItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, description: e.target.value } : entry,
                        ),
                      )
                    }
                    rows={2}
                    maxLength={400}
                    placeholder={fh("cardDescPh")}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-[var(--color-foreground)]">
                      <input
                        type="radio"
                        name={`platform-icon-type-${item.id}`}
                        checked={item.iconType === "preset"}
                        onChange={() =>
                          setPlatformDetailsItems((prev) =>
                            prev.map((entry) =>
                              entry.id === item.id ? { ...entry, iconType: "preset" } : entry,
                            ),
                          )
                        }
                      />
                      {fh("iconPreset")}
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[var(--color-foreground)]">
                      <input
                        type="radio"
                        name={`platform-icon-type-${item.id}`}
                        checked={item.iconType === "upload"}
                        onChange={() =>
                          setPlatformDetailsItems((prev) =>
                            prev.map((entry) =>
                              entry.id === item.id ? { ...entry, iconType: "upload" } : entry,
                            ),
                          )
                        }
                      />
                      {fh("iconUpload")}
                    </label>
                  </div>
                  {item.iconType === "preset" ? (
                    <div className="grid grid-cols-4 gap-2">
                      {PLATFORM_DETAILS_PRESET_ICON_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setPlatformDetailsItems((prev) =>
                              prev.map((entry) =>
                                entry.id === item.id ? { ...entry, presetIcon: opt.id } : entry,
                              ),
                            )
                          }
                          title={opt.label}
                          className={`flex h-12 items-center justify-center rounded-[var(--radius-btn)] border ${
                            item.presetIcon === opt.id
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                              : "border-[var(--color-border)] text-[var(--color-muted)]"
                          }`}
                        >
                          {renderPresetIcon(opt.id, "h-5 w-5")}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={item.customIconUrl ?? ""}
                          onChange={(e) =>
                            setPlatformDetailsItems((prev) =>
                              prev.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, customIconUrl: e.target.value || null }
                                  : entry,
                              ),
                            )
                          }
                          placeholder={fh("iconUrlPh")}
                          className="min-w-[180px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                        />
                        <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-primary)]">
                          {platformItemUploading === item.id ? fh("uploading") : fh("uploadIcon")}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                            className="hidden"
                            disabled={platformItemUploading !== null}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setPlatformItemUploading(item.id);
                              try {
                                const fd = new FormData();
                                fd.set("file", f);
                                const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                                const data = await res.json().catch(() => ({}));
                                if (res.ok && data.url) {
                                  setPlatformDetailsItems((prev) =>
                                    prev.map((entry) =>
                                      entry.id === item.id ? { ...entry, customIconUrl: data.url } : entry,
                                    ),
                                  );
                                }
                              } finally {
                                setPlatformItemUploading(null);
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>
                      </div>
                      {item.customIconUrl ? (
                        <img
                          src={item.customIconUrl}
                          alt={fh("iconPreviewAlt")}
                          className="h-10 w-10 rounded border border-[var(--color-border)] object-contain p-1"
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlatformDetailsItems([...DEFAULT_PLATFORM_DETAILS_ITEMS])}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-medium text-[var(--color-foreground)]"
          >
            {fh("restoreDefaultCards")}
          </button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{fh("reviewsBlockTitle")}</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">{fh("reviewsBlockIntro")}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("sectionTitleGeneric")}</label>
            <input
              type="text"
              value={form.reviewsSectionTitle}
              onChange={(e) => setForm((f) => ({ ...f, reviewsSectionTitle: e.target.value }))}
              maxLength={400}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phReviewsTitleAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelReviewsTitleEn")}</label>
            <input
              type="text"
              value={form.reviewsSectionTitleEn}
              onChange={(e) => setForm((f) => ({ ...f, reviewsSectionTitleEn: e.target.value }))}
              maxLength={400}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phReviewsTitleEn")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("reviewsSubtitleLabel")}</label>
            <input
              type="text"
              value={form.reviewsSectionSubtitle}
              onChange={(e) => setForm((f) => ({ ...f, reviewsSectionSubtitle: e.target.value }))}
              maxLength={400}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phReviewsSubAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelReviewsSubEn")}</label>
            <input
              type="text"
              value={form.reviewsSectionSubtitleEn}
              onChange={(e) => setForm((f) => ({ ...f, reviewsSectionSubtitleEn: e.target.value }))}
              maxLength={400}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phReviewsSubEn")}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{fh("newsBlockTitle")}</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">{fh("newsBlockIntro")}</p>
        <div className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="platformNewsEnabled"
            checked={form.platformNewsEnabled}
            onChange={(e) => setForm((f) => ({ ...f, platformNewsEnabled: e.target.checked }))}
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
          <label htmlFor="platformNewsEnabled" className="text-sm font-medium text-[var(--color-foreground)]">
            {fh("enableNews")}
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("newsSectionTitleLabel")}</label>
          <input
            type="text"
            value={form.platformNewsSectionTitle}
            onChange={(e) => setForm((f) => ({ ...f, platformNewsSectionTitle: e.target.value }))}
            maxLength={240}
            className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
            placeholder={fh("phNewsTitleAr")}
          />
          <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelNewsTitleEn")}</label>
          <input
            type="text"
            value={form.platformNewsSectionTitleEn}
            onChange={(e) => setForm((f) => ({ ...f, platformNewsSectionTitleEn: e.target.value }))}
            maxLength={240}
            className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
            placeholder={fh("phNewsTitleEn")}
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("newsTitleDefaultHint")}</p>
        </div>
        <div className="space-y-4">
          {platformNewsItems.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--color-foreground)]">
                  {fillMessage(fh("newsItemN"), { n: idx + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPlatformNewsItems((prev) => prev.filter((entry) => entry.id !== item.id))
                  }
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  {fh("delete")}
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  <label className="block text-xs text-[var(--color-muted)]">{fh("newsImageLabel")}</label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-primary)]">
                      {platformNewsUploading === item.id ? fh("uploading") : fh("uploadImage")}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={platformNewsUploading !== null}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setPlatformNewsUploading(item.id);
                          try {
                            const fd = new FormData();
                            fd.set("file", file);
                            const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok && data.url) {
                              setPlatformNewsItems((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id ? { ...entry, imageUrl: data.url } : entry,
                                ),
                              );
                            }
                          } finally {
                            setPlatformNewsUploading(null);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="mt-2 h-24 max-w-[200px] rounded border border-[var(--color-border)] object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-xs text-[var(--color-muted)]">{fh("eventDescriptionLabel")}</label>
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      setPlatformNewsItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, description: e.target.value } : entry,
                        ),
                      )
                    }
                    maxLength={1000}
                    rows={3}
                    className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                    placeholder={fh("phNewsCaption")}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPlatformNewsItem}
            disabled={!canAddPlatformNewsItem}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] disabled:opacity-50"
          >
            {canAddPlatformNewsItem
              ? fillMessage(fh("addNewsWithCount"), {
                  current: platformNewsItems.length,
                  max: PLATFORM_NEWS_MAX_ITEMS,
                })
              : fh("addNews")}
          </button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{fh("ctaBlockTitle")}</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">{fh("ctaBlockIntro")}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("ctaBadgeLabel")}</label>
            <input
              type="text"
              value={form.ctaBadgeText}
              onChange={(e) => setForm((f) => ({ ...f, ctaBadgeText: e.target.value }))}
              maxLength={120}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phCtaBadgeAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelCtaBadgeEn")}</label>
            <input
              type="text"
              value={form.ctaBadgeTextEn}
              onChange={(e) => setForm((f) => ({ ...f, ctaBadgeTextEn: e.target.value }))}
              maxLength={120}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phCtaBadgeEn")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("ctaHeadlineLabel")}</label>
            <input
              type="text"
              value={form.ctaTitle}
              onChange={(e) => setForm((f) => ({ ...f, ctaTitle: e.target.value }))}
              maxLength={300}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phCtaTitleAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelCtaTitleEn")}</label>
            <input
              type="text"
              value={form.ctaTitleEn}
              onChange={(e) => setForm((f) => ({ ...f, ctaTitleEn: e.target.value }))}
              maxLength={300}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phCtaTitleEn")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("ctaDescLabel")}</label>
            <textarea
              value={form.ctaDescription}
              onChange={(e) => setForm((f) => ({ ...f, ctaDescription: e.target.value }))}
              maxLength={2000}
              rows={4}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phCtaDescAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelCtaDescEn")}</label>
            <textarea
              value={form.ctaDescriptionEn}
              onChange={(e) => setForm((f) => ({ ...f, ctaDescriptionEn: e.target.value }))}
              maxLength={2000}
              rows={4}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phCtaDescEn")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("ctaButtonLabel")}</label>
            <input
              type="text"
              value={form.ctaButtonText}
              onChange={(e) => setForm((f) => ({ ...f, ctaButtonText: e.target.value }))}
              maxLength={120}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phCtaBtnAr")}
            />
            <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelCtaBtnEn")}</label>
            <input
              type="text"
              value={form.ctaButtonTextEn}
              onChange={(e) => setForm((f) => ({ ...f, ctaButtonTextEn: e.target.value }))}
              maxLength={120}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]"
              placeholder={fh("phCtaBtnEn")}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">{fh("socialBlockTitle")}</h3>
        <p className="mb-3 text-sm text-[var(--color-muted)]">{fh("socialBlockIntro")}</p>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("socialRightWord")}</label>
              <input
                type="text"
                value={form.socialRightLabel}
                onChange={(e) => setForm((f) => ({ ...f, socialRightLabel: e.target.value }))}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                placeholder={fh("phSocialRightAr")}
              />
              <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelSocialRightEn")}</label>
              <input
                type="text"
                value={form.socialRightLabelEn}
                onChange={(e) => setForm((f) => ({ ...f, socialRightLabelEn: e.target.value }))}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                placeholder={fh("phSocialRightEn")}
              />
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {fillMessage(t(`${Hp}.previewYoutubeRight`), {
                  label: form.socialRightLabel || t(`${Hp}.exampleSocialRight`),
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("socialLeftWord")}</label>
              <input
                type="text"
                value={form.socialLeftLabel}
                onChange={(e) => setForm((f) => ({ ...f, socialLeftLabel: e.target.value }))}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                placeholder={fh("phSocialLeftAr")}
              />
              <label className="mt-2 block text-xs font-medium text-[var(--color-muted)]">{fh("labelSocialLeftEn")}</label>
              <input
                type="text"
                value={form.socialLeftLabelEn}
                onChange={(e) => setForm((f) => ({ ...f, socialLeftLabelEn: e.target.value }))}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                placeholder={fh("phSocialLeftEn")}
              />
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {fillMessage(t(`${Hp}.previewYoutubeRight`), {
                  label: form.socialLeftLabel || t(`${Hp}.exampleSocialLeft`),
                })}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="accent-[var(--color-primary)]"
              checked={form.socialLeftEnabled}
              onChange={(e) => setForm((f) => ({ ...f, socialLeftEnabled: e.target.checked }))}
            />
            {fh("enableLeftSocial")}
          </label>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("youtubeTeacher")}</label>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="https://youtube.com/@channel"
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesYoutube")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("linkedinTeacher")}</label>
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="https://www.linkedin.com/in/..."
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesLinkedin")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("whatsappTeacher")}</label>
            <input
              type="url"
              value={form.whatsappUrl}
              onChange={(e) => setForm((f) => ({ ...f, whatsappUrl: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="https://wa.me/966553612356"
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesWhatsapp")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("facebookTeacher")}</label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder="https://www.facebook.com/..."
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesFacebook")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("telegramTeacher")}</label>
            <input
              type="text"
              value={form.telegramUrl}
              onChange={(e) => setForm((f) => ({ ...f, telegramUrl: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              placeholder={fh("phTelegram")}
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesTelegram")}</p>
          </div>
          <hr className="border-[var(--color-border)]" />
          {form.socialLeftEnabled ? (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("youtubeTeam")}</label>
                <input
                  type="url"
                  value={form.teamYoutubeUrl}
                  onChange={(e) => setForm((f) => ({ ...f, teamYoutubeUrl: e.target.value }))}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  placeholder="https://youtube.com/@team"
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesYoutubeTeam")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("linkedinTeam")}</label>
                <input
                  type="url"
                  value={form.teamLinkedinUrl}
                  onChange={(e) => setForm((f) => ({ ...f, teamLinkedinUrl: e.target.value }))}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  placeholder="https://www.linkedin.com/company/..."
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesLinkedinTeam")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("whatsappTeam")}</label>
                <input
                  type="url"
                  value={form.teamWhatsappUrl}
                  onChange={(e) => setForm((f) => ({ ...f, teamWhatsappUrl: e.target.value }))}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  placeholder="https://wa.me/966553612356"
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesWhatsappTeam")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("facebookTeam")}</label>
                <input
                  type="url"
                  value={form.teamFacebookUrl}
                  onChange={(e) => setForm((f) => ({ ...f, teamFacebookUrl: e.target.value }))}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  placeholder="https://www.facebook.com/..."
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesFacebookTeam")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">{fh("telegramTeam")}</label>
                <input
                  type="text"
                  value={form.teamTelegramUrl}
                  onChange={(e) => setForm((f) => ({ ...f, teamTelegramUrl: e.target.value }))}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                  placeholder={fh("phTelegramTeam")}
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">{fh("emptyHidesTelegramTeam")}</p>
              </div>
            </>
          ) : (
            <p className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-muted)]">
              {fh("leftSocialDisabledNote")}
            </p>
          )}
        </div>
      </div>
      </form>
      <div
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-[0_-12px_40px_rgb(0_0_0/0.06)] backdrop-blur-md supports-[padding:env(safe-area-inset-bottom)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:shadow-[0_-12px_40px_rgb(0_0_0/0.35)]"
        role="region"
        aria-label={t(`${Hp}.saveButtonIdle`)}
      >
        <div className="mx-auto flex max-w-2xl justify-stretch sm:justify-end">
          <button
            form="homepage-settings-form"
            type="submit"
            disabled={saving}
            className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {saving ? t(`${Hp}.saveButtonBusy`) : t(`${Hp}.saveButtonIdle`)}
          </button>
        </div>
      </div>
    </>
  );
}
