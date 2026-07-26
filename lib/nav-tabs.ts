export type NavTabIcon =
  | "home"
  | "courses"
  | "myCourses"
  | "teachers"
  | "library"
  | "jobs"
  | "forum"
  | "live"
  | "consultations"
  | "exams"
  | "account"
  | "certs"
  | "settings";

export type NavTab = {
  key: string;
  href: string;
  labelAr: string;
  labelEn: string;
  icon: NavTabIcon;
  order: number;
  isVisible: boolean;
};

export const DEFAULT_NAV_TABS: NavTab[] = [
  { key: "home", href: "/", labelAr: "الرئيسية", labelEn: "Home", icon: "home", order: 0, isVisible: true },
  { key: "courses", href: "/courses", labelAr: "الكورسات", labelEn: "Courses", icon: "courses", order: 1, isVisible: true },
  { key: "myCourses", href: "/dashboard", labelAr: "دوراتي", labelEn: "My courses", icon: "myCourses", order: 2, isVisible: true },
  { key: "teachers", href: "/teachers", labelAr: "المدربين", labelEn: "Trainers", icon: "teachers", order: 3, isVisible: true },
  { key: "library", href: "/library", labelAr: "المكتبة", labelEn: "Library", icon: "library", order: 4, isVisible: true },
  { key: "jobs", href: "/jobs", labelAr: "الوظائف", labelEn: "Jobs", icon: "jobs", order: 5, isVisible: true },
  { key: "forum", href: "/forum", labelAr: "المجتمع", labelEn: "Community", icon: "forum", order: 6, isVisible: true },
  { key: "live", href: "/live", labelAr: "البث المباشر", labelEn: "Live", icon: "live", order: 7, isVisible: true },
  { key: "consultations", href: "/consultations", labelAr: "حجز استشارة", labelEn: "Consultations", icon: "consultations", order: 8, isVisible: true },
  { key: "exams", href: "/exams", labelAr: "الاختبارات", labelEn: "Exams", icon: "exams", order: 9, isVisible: true },
  { key: "account", href: "/dashboard/profile", labelAr: "حسابي", labelEn: "My account", icon: "account", order: 10, isVisible: true },
];

export function parseNavTabs(raw: string | null | undefined): NavTab[] {
  if (!raw?.trim()) return DEFAULT_NAV_TABS.map((t) => ({ ...t }));
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_NAV_TABS.map((t) => ({ ...t }));
    return parsed
      .map((item, index) => {
        const o = item as Record<string, unknown>;
        const key = String(o.key ?? `tab-${index}`);
        const fallback = DEFAULT_NAV_TABS.find((t) => t.key === key);
        return {
          key,
          href: String(o.href ?? fallback?.href ?? "/"),
          labelAr: String(o.labelAr ?? fallback?.labelAr ?? key),
          labelEn: String(o.labelEn ?? fallback?.labelEn ?? key),
          icon: (String(o.icon ?? fallback?.icon ?? "home") as NavTabIcon),
          order: typeof o.order === "number" ? o.order : index,
          isVisible: o.isVisible !== false,
        } satisfies NavTab;
      })
      .sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_NAV_TABS.map((t) => ({ ...t }));
  }
}

export function serializeNavTabs(tabs: NavTab[]): string {
  return JSON.stringify(tabs);
}

export function visibleNavTabs(tabs?: NavTab[] | null): NavTab[] {
  return (tabs && tabs.length > 0 ? tabs : DEFAULT_NAV_TABS).filter((tab) => tab.isVisible);
}
