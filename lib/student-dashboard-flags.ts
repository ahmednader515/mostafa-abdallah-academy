/** Admin-configurable visibility of Student Dashboard Hub sections. */

export type StudentDashboardSectionKey =
  | "home"
  | "courses"
  | "progress"
  | "subscriptions"
  | "wallet"
  | "purchases"
  | "library"
  | "exams"
  | "homework"
  | "messages"
  | "notifications"
  | "live"
  | "consultations"
  | "profile"
  | "settings"
  | "search";

export type StudentDashboardFlags = Record<StudentDashboardSectionKey, boolean>;

export const STUDENT_DASHBOARD_SECTION_KEYS: StudentDashboardSectionKey[] = [
  "home",
  "courses",
  "progress",
  "subscriptions",
  "wallet",
  "purchases",
  "library",
  "exams",
  "homework",
  "messages",
  "notifications",
  "live",
  "consultations",
  "profile",
  "settings",
  "search",
];

export const DEFAULT_STUDENT_DASHBOARD_FLAGS: StudentDashboardFlags = {
  home: true,
  courses: true,
  progress: true,
  subscriptions: true,
  wallet: true,
  purchases: true,
  library: true,
  exams: true,
  homework: true,
  messages: true,
  notifications: true,
  live: true,
  consultations: true,
  profile: true,
  settings: true,
  search: true,
};

export const STUDENT_DASHBOARD_SECTION_META: {
  key: StudentDashboardSectionKey;
  href: string;
  labelAr: string;
  labelEn: string;
}[] = [
  { key: "home", href: "/dashboard", labelAr: "الرئيسية", labelEn: "Home" },
  { key: "courses", href: "/dashboard/my-courses", labelAr: "كورساتي", labelEn: "My courses" },
  { key: "progress", href: "/dashboard/progress", labelAr: "التقدم", labelEn: "Progress" },
  {
    key: "subscriptions",
    href: "/dashboard/my-subscriptions",
    labelAr: "الاشتراكات",
    labelEn: "Subscriptions",
  },
  { key: "wallet", href: "/dashboard/wallet", labelAr: "المحفظة", labelEn: "Wallet" },
  { key: "purchases", href: "/dashboard/purchases", labelAr: "المشتريات", labelEn: "Purchases" },
  { key: "library", href: "/dashboard/my-library", labelAr: "مكتبتي", labelEn: "My library" },
  { key: "exams", href: "/dashboard/my-exams", labelAr: "اختبارات وشهادات", labelEn: "Exams & certs" },
  {
    key: "homework",
    href: "/dashboard/my-homework",
    labelAr: "الاختبارات العملية",
    labelEn: "Practical exams",
  },
  { key: "messages", href: "/dashboard/messages", labelAr: "الرسائل", labelEn: "Messages" },
  {
    key: "notifications",
    href: "/dashboard/my-notifications",
    labelAr: "الإشعارات",
    labelEn: "Notifications",
  },
  { key: "live", href: "/dashboard/my-live", labelAr: "البث المباشر", labelEn: "Live" },
  {
    key: "consultations",
    href: "/dashboard/my-consultations",
    labelAr: "الاستشارات",
    labelEn: "Consultations",
  },
  { key: "profile", href: "/dashboard/profile", labelAr: "الملف الشخصي", labelEn: "Profile" },
  {
    key: "settings",
    href: "/dashboard/account-settings",
    labelAr: "الإعدادات",
    labelEn: "Settings",
  },
  { key: "search", href: "/dashboard/my-search", labelAr: "بحث", labelEn: "Search" },
];

export function parseStudentDashboardFlags(raw: string | null | undefined): StudentDashboardFlags {
  const base = { ...DEFAULT_STUDENT_DASHBOARD_FLAGS };
  if (!raw?.trim()) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const key of STUDENT_DASHBOARD_SECTION_KEYS) {
      if (typeof parsed[key] === "boolean") base[key] = parsed[key];
    }
  } catch {
    /* keep defaults */
  }
  return base;
}

export function serializeStudentDashboardFlags(flags: StudentDashboardFlags): string {
  return JSON.stringify({ ...DEFAULT_STUDENT_DASHBOARD_FLAGS, ...flags });
}
