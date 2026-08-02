"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useLocale, useT } from "@/components/LocaleProvider";
import { useLabel } from "@/components/LabelsProvider";
import { DEFAULT_NAV_TABS, visibleNavTabs, type NavTab } from "@/lib/nav-tabs";
import type { PolicyNavLink } from "@/lib/policy-cards";

export type SidebarSocialNetwork =
  | "whatsapp"
  | "facebook"
  | "telegram"
  | "youtube"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "x";

export type SidebarSocialLink = {
  href: string;
  network: SidebarSocialNetwork;
  label: string;
};

const SOCIAL_COLORS: Record<SidebarSocialNetwork, string> = {
  whatsapp: "#25D366",
  facebook: "#1877F2",
  telegram: "#229ED9",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  instagram: "#E4405F",
  tiktok: "#010101",
  x: "#111111",
};

function SocialIcon({ network }: { network: SidebarSocialNetwork }) {
  switch (network) {
    case "whatsapp":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "telegram":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M9.78 15.87 9.4 21c.54 0 .78-.23 1.06-.5l2.55-2.44 5.28 3.87c.97.53 1.65.25 1.91-.9L23.65 4.8c.34-1.4-.5-1.95-1.44-1.6L1.85 11.09c-1.39.54-1.37 1.32-.24 1.67l5.2 1.62L18.9 6.7c.57-.35 1.1-.16.67.22" />
        </svg>
      );
    case "youtube":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8M9.6 15.8V8.2L16.2 12z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12M7.12 20.45H3.56V9h3.56z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.3.4.6.2 1 .5 1.5 1 .4.4.7.9 1 1.5.2.4.4 1.1.4 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.3-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5 1-.4.2-1.1.4-2.3.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-1-1.5-.2-.4-.4-1.1-.4-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.3.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-1 .4-.2 1.1-.4 2.3-.4C8.4 2.2 8.8 2.2 12 2.2m0 1.8c-3.2 0-3.5 0-4.8.1-.9 0-1.5.2-1.8.3-.4.2-.7.3-1 .7-.3.3-.5.6-.7 1-.1.3-.3.9-.3 1.8-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c0 .9.2 1.5.3 1.8.2.4.3.7.7 1 .3.3.6.5 1 .7.3.1.9.3 1.8.3 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c.9 0 1.5-.2 1.8-.3.4-.2.7-.3 1-.7.3-.3.5-.6.7-1 .1-.3.3-.9.3-1.8.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c0-.9-.2-1.5-.3-1.8-.2-.4-.3-.7-.7-1-.3-.3-.6-.5-1-.7-.3-.1-.9-.3-1.8-.3-1.3-.1-1.6-.1-4.8-.1zm0 3.1a5 5 0 1 1 0 9.9 5 5 0 0 1 0-9.9zm0 1.8a3.2 3.2 0 1 0 0 6.3 3.2 3.2 0 0 0 0-6.3zm5.2-2.1a1.2 1.2 0 1 1 0 2.3 1.2 1.2 0 0 1 0-2.3z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M19.6 7.2a6.4 6.4 0 0 1-3.8-1.2v7.1a5.4 5.4 0 1 1-4.7-5.3v2.4a3 3 0 1 0 2.2 2.9V2.5h2.5a3.9 3.9 0 0 0 3.8 3.8z" />
        </svg>
      );
    case "x":
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.9-6.4L5.4 22H2.6l7-8L2 2h6.4l4.4 5.8L18.2 2zm-1.1 18h1.7L7 3.9H5.2L17.1 20z" />
        </svg>
      );
  }
}

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const stroke = active ? "#2563EB" : "#93A4BD";
  const common = {
    fill: "none" as const,
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const key = icon;
  switch (key) {
    case "home":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" />
        </svg>
      );
    case "courses":
    case "myCourses":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M4 5h7v14H4zM13 5h7v14h-7z" />
          <path {...common} d="M11 5c1.2 1.2 1.2 12.8 0 14M13 5c-1.2 1.2-1.2 12.8 0 14" />
        </svg>
      );
    case "teachers":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="9" cy="8" r="3" />
          <circle {...common} cx="17" cy="9" r="2.5" />
          <path {...common} d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" />
          <path {...common} d="M14 15.2c1.1-.7 2.4-1 3.7-1 1.6 0 3 .5 4 1.6" />
        </svg>
      );
    case "exams":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <rect {...common} x="5" y="3" width="14" height="18" rx="2" />
          <path {...common} d="M8 8h8M8 12h8M8 16h4" />
          <path {...common} d="m15 15 1.5 1.5L20 13" />
        </svg>
      );
    case "library":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14.5A2.5 2.5 0 0 1 17.5 21H6.5A2.5 2.5 0 0 1 4 18.5v-12z" />
          <path {...common} d="M10 10.5 16 13l-6 2.5v-5z" />
        </svg>
      );
    case "forum":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "jobs":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <rect {...common} x="3" y="7" width="18" height="13" rx="2" />
          <path {...common} d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "live":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="12" r="3" />
          <path {...common} d="M5 12a7 7 0 0 1 7-7M19 12a7 7 0 0 0-7-7M5 12a7 7 0 0 0 7 7M19 12a7 7 0 0 1-7 7" />
        </svg>
      );
    case "consultations":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M4 5h16v10H8l-4 4V5z" />
          <path {...common} d="M8 9h8M8 12h5" />
        </svg>
      );
    case "subscriptions":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <rect {...common} x="3" y="6" width="18" height="12" rx="2" />
          <path {...common} d="M3 10h18" />
          <path {...common} d="M7 14h4" />
        </svg>
      );
    case "certs":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M8 4h8l1 3H7l1-3z" />
          <path {...common} d="M7 7h10v4a5 5 0 0 1-10 0V7z" />
          <path {...common} d="M10 16v4l2-1 2 1v-4" />
        </svg>
      );
    case "account":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="8" r="3.5" />
          <path {...common} d="M5 19.5c1.2-3.2 3.6-5 7-5s5.8 1.8 7 5" />
        </svg>
      );
    case "settings":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path
            {...common}
            d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"
          />
          <path
            {...common}
            d="M19.4 13a7.6 7.6 0 0 0 .1-2l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1l-.4-2.6H9l-.4 2.6a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 .1 2l-2 1.6 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1l.4 2.6h6l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6z"
          />
        </svg>
      );
    case "docs":
    case "doc":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path {...common} d="M14 3v5h5M9 13h6M9 17h6" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M12 8v4l2.5 2.5" />
        </svg>
      );
  }
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // "/dashboard" is the student/admin home tab ("دوراتي") — do not treat every
  // /dashboard/* page as active for that item.
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  open,
  desktopHidden = false,
  onClose,
  socialLinks = [],
  navTabs,
  policyLinks = [],
}: {
  open: boolean;
  desktopHidden?: boolean;
  onClose: () => void;
  socialLinks?: SidebarSocialLink[];
  navTabs?: NavTab[];
  /** صفحات السياسات المنشورة بمكان Header / Both */
  policyLinks?: PolicyNavLink[];
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const t = useT();
  const locale = useLocale();
  const accountHref = status === "authenticated" ? "/dashboard/profile" : "/login";
  const settingsHref =
    status !== "authenticated"
      ? "/login"
      : session?.user?.role === "STUDENT"
        ? "/dashboard/account-settings"
        : "/dashboard/profile";

  const coursesLabel = useLabel("courses", t("common.courses", "Courses"));
  const teachersLabel = useLabel("teachers", t("nav.teachers", "Trainers"));
  const examsLabel = useLabel("exams", t("nav.exams", "Exams"));
  const libraryLabel = useLabel("library", t("nav.library", "Library"));
  const labelOverrideByKey: Record<string, string> = {
    courses: coursesLabel,
    teachers: teachersLabel,
    exams: examsLabel,
    library: libraryLabel,
  };

  const tabs = visibleNavTabs(navTabs?.length ? navTabs : DEFAULT_NAV_TABS);
  const hasAccountTab = tabs.some((tab) => tab.key === "account" || tab.icon === "account");

  useEffect(() => {
    // Close mobile drawer only — desktop visibility is toggled by the menu button.
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close drawer on navigation only
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        data-open={open ? "true" : "false"}
        data-desktop-hidden={desktopHidden ? "true" : "false"}
        className="app-sidebar z-50 flex w-full flex-col border-white/5 lg:w-auto"
        aria-label={t("nav.sidebar", "Main navigation")}
        aria-hidden={desktopHidden ? true : undefined}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold text-white">{t("nav.menu", "القائمة")}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:bg-white/10"
            aria-label={t("nav.closeMenu", "Close menu")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="app-sidebar-nav flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-2 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((item) => {
            const active = isActivePath(pathname, item.href);
            const label =
              labelOverrideByKey[item.key] ??
              ((locale === "ar" ? item.labelAr : item.labelEn) || item.labelEn);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                title={label}
                className={`app-sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  active ? "bg-[#2563EB]/20 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-[#2563EB]/25" : ""
                  }`}
                >
                  <NavIcon icon={item.icon} active={active} />
                </span>
                <span className="app-sidebar-label font-medium leading-tight">{label}</span>
              </Link>
            );
          })}
          {policyLinks.length > 0 ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="app-sidebar-label mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t("nav.pagesPolicies", "Pages")}
              </p>
              {policyLinks.map((link) => {
                const label =
                  (locale === "ar" ? link.titleAr : link.titleEn) ||
                  link.titleEn ||
                  link.titleAr ||
                  link.slug;
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={onClose}
                    title={label}
                    className={`app-sidebar-link flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                      active
                        ? "bg-[#2563EB]/20 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                      <NavIcon icon="docs" active={active} />
                    </span>
                    <span className="app-sidebar-label text-sm font-medium leading-tight">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </nav>

        <div className="mt-auto shrink-0 overflow-x-hidden border-t border-white/10 px-2 py-3">
          {!hasAccountTab ? (
            <Link
              href={accountHref}
              onClick={onClose}
              title={t("nav.myAccount", "My account")}
              className={`app-sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                isActivePath(pathname, "/dashboard/profile")
                  ? "bg-[#2563EB]/20 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <NavIcon icon="account" active={isActivePath(pathname, "/dashboard/profile")} />
              </span>
              <span className="app-sidebar-label font-medium">
                {t("nav.myAccount", "My account")}
              </span>
            </Link>
          ) : null}

          <Link
            href={settingsHref}
            onClick={onClose}
            title={t("nav.settings", "Settings")}
            className={`app-sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
              isActivePath(pathname, settingsHref)
                ? "bg-[#2563EB]/20 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <NavIcon icon="settings" active={isActivePath(pathname, settingsHref)} />
            </span>
            <span className="app-sidebar-label font-medium">{t("nav.settings", "Settings")}</span>
          </Link>

          {socialLinks.length > 0 ? (
            <div className="app-sidebar-social mt-3 flex items-center gap-2 border-t border-white/10 px-1 pt-3">
              {socialLinks.map((link) => (
                <a
                  key={`${link.network}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  aria-label={link.label}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:scale-105 hover:opacity-90"
                  style={{ backgroundColor: SOCIAL_COLORS[link.network] ?? "#64748b" }}
                >
                  <SocialIcon network={link.network} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
