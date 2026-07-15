import {
  ACADEMY_HOME_HERO_SLIDES,
  type AcademyHeroSlide,
  type AcademyHeroSlideFeature,
} from "@/lib/academy-home-hero-slides";

export type { AcademyHeroSlide, AcademyHeroSlideFeature };
export { ACADEMY_HOME_HERO_SLIDES };

export type HomepageStatKind = "students" | "courses" | "trainers" | "satisfaction";

export type HomepageStatItem = {
  kind: HomepageStatKind;
  value: string;
  labelAr: string;
  labelEn: string;
};

export type HomepageMainNavFlags = {
  jobs: boolean;
  courses: boolean;
  library: boolean;
  social: boolean;
};

export const DEFAULT_HOMEPAGE_STATS: HomepageStatItem[] = [
  { kind: "students", value: "15,000+", labelAr: "متدرب", labelEn: "Trainees" },
  { kind: "courses", value: "120+", labelAr: "كورس", labelEn: "Courses" },
  { kind: "trainers", value: "50+", labelAr: "مدرب", labelEn: "Trainers" },
  { kind: "satisfaction", value: "98%", labelAr: "نسبة رضا المتدربين", labelEn: "Trainee satisfaction" },
];

export const DEFAULT_MAIN_NAV_FLAGS: HomepageMainNavFlags = {
  jobs: true,
  courses: true,
  library: true,
  social: true,
};

export const HERO_FEATURE_KINDS: AcademyHeroSlideFeature["kind"][] = [
  "courses",
  "trainers",
  "certs",
  "train",
  "practice",
  "succeed",
];

const FEATURE_KINDS = new Set<string>(HERO_FEATURE_KINDS);

export const HOMEPAGE_STAT_KINDS: HomepageStatKind[] = [
  "students",
  "courses",
  "trainers",
  "satisfaction",
];

const STAT_KINDS = new Set<HomepageStatKind>(HOMEPAGE_STAT_KINDS);

function asString(v: unknown, max: number): string {
  if (v == null) return "";
  return String(v).trim().slice(0, max);
}

export function parseHeroSlideFeature(raw: unknown): AcademyHeroSlideFeature | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const kind = asString(o.kind, 32);
  if (!FEATURE_KINDS.has(kind)) return null;
  return {
    kind: kind as AcademyHeroSlideFeature["kind"],
    labelAr: asString(o.labelAr, 80) || "ميزة",
    labelEn: asString(o.labelEn, 80) || "Feature",
  };
}

/** Parse and validate a single hero slide; returns null when the required image is missing. */
export function parseHeroSlide(raw: unknown): AcademyHeroSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const image = asString(o.image, 4000);
  if (!image) return null;
  const featuresRaw = Array.isArray(o.features) ? o.features : [];
  const features = featuresRaw
    .map(parseHeroSlideFeature)
    .filter((f): f is AcademyHeroSlideFeature => f != null)
    .slice(0, 6);
  return {
    image,
    badgeAr: asString(o.badgeAr, 120),
    badgeEn: asString(o.badgeEn, 120),
    titleLine1Ar: asString(o.titleLine1Ar, 120),
    titleLine1En: asString(o.titleLine1En, 120),
    titleLine2Ar: asString(o.titleLine2Ar, 120),
    titleLine2En: asString(o.titleLine2En, 120),
    subtitleAr: asString(o.subtitleAr, 600),
    subtitleEn: asString(o.subtitleEn, 600),
    features:
      features.length > 0
        ? features
        : [{ kind: "courses", labelAr: "كورسات تفاعلية", labelEn: "Interactive courses" }],
    chipValue: asString(o.chipValue, 40) || "—",
    chipLabelAr: asString(o.chipLabelAr, 80),
    chipLabelEn: asString(o.chipLabelEn, 80),
  };
}

/** Parse hero slides JSON; empty/invalid → defaults from code. Max 8 slides. */
export function parseHeroSlidesJson(raw: string | null | undefined): AcademyHeroSlide[] {
  if (!raw || !String(raw).trim()) return ACADEMY_HOME_HERO_SLIDES.map((s) => ({ ...s, features: [...s.features] }));
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return ACADEMY_HOME_HERO_SLIDES.map((s) => ({ ...s, features: [...s.features] }));
    const slides = parsed
      .map(parseHeroSlide)
      .filter((s): s is AcademyHeroSlide => s != null)
      .slice(0, 8);
    return slides.length > 0
      ? slides
      : ACADEMY_HOME_HERO_SLIDES.map((s) => ({ ...s, features: [...s.features] }));
  } catch {
    return ACADEMY_HOME_HERO_SLIDES.map((s) => ({ ...s, features: [...s.features] }));
  }
}

export function serializeHeroSlides(slides: AcademyHeroSlide[]): string {
  return JSON.stringify(slides.slice(0, 8));
}

export function parseHomepageStatItem(raw: unknown): HomepageStatItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const kind = asString(o.kind, 32) as HomepageStatKind;
  if (!STAT_KINDS.has(kind)) return null;
  return {
    kind,
    value: asString(o.value, 40) || "—",
    labelAr: asString(o.labelAr, 80) || kind,
    labelEn: asString(o.labelEn, 80) || kind,
  };
}

export function parseStatsRibbonJson(raw: string | null | undefined): HomepageStatItem[] {
  if (!raw || !String(raw).trim()) {
    return DEFAULT_HOMEPAGE_STATS.map((s) => ({ ...s }));
  }
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return DEFAULT_HOMEPAGE_STATS.map((s) => ({ ...s }));
    const items = parsed
      .slice(0, 4)
      .map(parseHomepageStatItem)
      .filter((i): i is HomepageStatItem => i != null);
    if (items.length === 0) return DEFAULT_HOMEPAGE_STATS.map((s) => ({ ...s }));
    // Fill missing kinds from defaults to keep 4 cards
    const byKind = new Map(items.map((i) => [i.kind, i]));
    return DEFAULT_HOMEPAGE_STATS.map((d) => byKind.get(d.kind) ?? { ...d });
  } catch {
    return DEFAULT_HOMEPAGE_STATS.map((s) => ({ ...s }));
  }
}

export function serializeStatsRibbon(items: HomepageStatItem[]): string {
  return JSON.stringify(items.slice(0, 4));
}

export function parseMainNavFlagsJson(raw: string | null | undefined): HomepageMainNavFlags {
  if (!raw || !String(raw).trim()) return { ...DEFAULT_MAIN_NAV_FLAGS };
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_MAIN_NAV_FLAGS };
    const o = parsed as Record<string, unknown>;
    return {
      jobs: o.jobs === undefined ? true : Boolean(o.jobs),
      courses: o.courses === undefined ? true : Boolean(o.courses),
      library: o.library === undefined ? true : Boolean(o.library),
      social: o.social === undefined ? true : Boolean(o.social),
    };
  } catch {
    return { ...DEFAULT_MAIN_NAV_FLAGS };
  }
}

export function serializeMainNavFlags(flags: HomepageMainNavFlags): string {
  return JSON.stringify(flags);
}

export function emptyHeroSlide(): AcademyHeroSlide {
  return {
    image: "/background.png",
    badgeAr: "",
    badgeEn: "",
    titleLine1Ar: "",
    titleLine1En: "",
    titleLine2Ar: "",
    titleLine2En: "",
    subtitleAr: "",
    subtitleEn: "",
    features: [{ kind: "courses", labelAr: "كورسات تفاعلية", labelEn: "Interactive courses" }],
    chipValue: "",
    chipLabelAr: "",
    chipLabelEn: "",
  };
}
