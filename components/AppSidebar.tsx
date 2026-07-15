"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useT } from "@/components/LocaleProvider";

export type SidebarSocialLink = {
  href: string;
  network: "whatsapp" | "facebook" | "telegram" | "youtube" | "linkedin";
  label: string;
};

type NavItem = {
  href: string;
  labelKey: string;
  labelFallback: string;
  icon: "home" | "courses" | "teachers" | "exams" | "library" | "forum" | "certs" | "settings";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "common.home", labelFallback: "Home", icon: "home" },
  { href: "/courses", labelKey: "common.courses", labelFallback: "Courses", icon: "courses" },
  { href: "/teachers", labelKey: "nav.teachers", labelFallback: "Trainers", icon: "teachers" },
  { href: "/exams", labelKey: "nav.exams", labelFallback: "Exams", icon: "exams" },
  { href: "/library", labelKey: "nav.library", labelFallback: "Library", icon: "library" },
  { href: "/forum", labelKey: "nav.forum", labelFallback: "Forum", icon: "forum" },
  { href: "/certificates", labelKey: "nav.certificates", labelFallback: "Certificates", icon: "certs" },
];

const SOCIAL_COLORS: Record<SidebarSocialLink["network"], string> = {
  whatsapp: "#25D366",
  facebook: "#1877F2",
  telegram: "#229ED9",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
};

function SocialIcon({ network }: { network: SidebarSocialLink["network"] }) {
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
  }
}

function NavIcon({ icon, active }: { icon: NavItem["icon"]; active: boolean }) {
  const stroke = active ? "#2563EB" : "#93A4BD";
  const common = {
    fill: "none" as const,
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (icon) {
    case "home":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" />
        </svg>
      );
    case "courses":
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
    case "certs":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path {...common} d="M8 4h8l1 3H7l1-3z" />
          <path {...common} d="M7 7h10v4a5 5 0 0 1-10 0V7z" />
          <path {...common} d="M10 16v4l2-1 2 1v-4" />
        </svg>
      );
    case "settings":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <circle {...common} cx="12" cy="12" r="3" />
          <path
            {...common}
            d="M12 3.5v2.1M12 18.4v2.1M4.9 6.5l1.5 1.5M17.6 16l1.5 1.5M3.5 12h2.1M18.4 12h2.1M4.9 17.5l1.5-1.5M17.6 8l1.5-1.5"
          />
        </svg>
      );
  }
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  open,
  onClose,
  socialLinks = [],
}: {
  open: boolean;
  onClose: () => void;
  socialLinks?: SidebarSocialLink[];
}) {
  const pathname = usePathname();
  const { status } = useSession();
  const t = useT();
  const settingsHref = status === "authenticated" ? "/dashboard/profile" : "/login";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={[
          "app-sidebar z-50 flex w-[4.75rem] shrink-0 flex-col border-e border-white/5",
          "fixed inset-y-0 start-0 h-dvh transition-transform duration-200",
          open ? "translate-x-0" : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
        ].join(" ")}
        aria-label={t("nav.sidebar", "Main navigation")}
      >
        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-2 py-5">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex w-full flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-center transition ${
                  active ? "bg-[#2563EB]/20" : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? "bg-[#2563EB]/25" : ""
                  }`}
                >
                  <NavIcon icon={item.icon} active={active} />
                </span>
                <span
                  className={`text-[10px] font-medium leading-tight ${
                    active ? "text-white" : "text-slate-400"
                  }`}
                >
                  {t(item.labelKey, item.labelFallback)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 px-2 py-3">
          <Link
            href={settingsHref}
            onClick={onClose}
            className={`flex w-full flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-center transition ${
              isActivePath(pathname, "/dashboard/profile")
                ? "bg-[#2563EB]/20"
                : "hover:bg-white/5"
            }`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl">
              <NavIcon icon="settings" active={isActivePath(pathname, "/dashboard/profile")} />
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              {t("nav.settings", "Settings")}
            </span>
          </Link>

          {socialLinks.length > 0 ? (
            <div className="mt-3 flex flex-col items-center gap-2 border-t border-white/10 pt-3">
              {socialLinks.map((link) => (
                <a
                  key={`${link.network}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  aria-label={link.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition hover:scale-105 hover:opacity-90"
                  style={{ backgroundColor: SOCIAL_COLORS[link.network] }}
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
