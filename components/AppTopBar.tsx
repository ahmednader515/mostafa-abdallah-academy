"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { UserRole } from "@/lib/types";
import { AcademyLogo } from "@/components/AcademyLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useT } from "@/components/LocaleProvider";

const BRAND_NAME = "Mostafa Abdullah academy";

function TopBarUser() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  /** Must run unconditionally (Rules of Hooks) — never after early returns */
  const roleLabel: Record<UserRole, string> = {
    ADMIN: t("header.role.ADMIN", "Admin"),
    ASSISTANT_ADMIN: t("header.role.ASSISTANT_ADMIN", "Assistant admin"),
    STUDENT: t("header.role.STUDENT", "Student"),
    TEACHER: t("header.role.TEACHER", "Teacher"),
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <span className="text-xs text-slate-400">...</span>;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10"
        >
          {t("header.login", "Log in")}
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1d4ed8]"
        >
          {t("header.register", "Create account")}
        </Link>
      </div>
    );
  }

  const initial = (session.user.name?.trim()?.[0] || "U").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition hover:bg-white/5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
          {initial}
        </span>
        <span className="hidden text-start sm:block">
          <span className="block max-w-[120px] truncate text-sm font-semibold text-white">
            {session.user.name}
          </span>
          <span className="block text-[11px] text-slate-400">
            {roleLabel[session.user.role]}
          </span>
        </span>
      </button>
      {open ? (
        <div className="absolute end-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0F172A] py-1 shadow-xl">
          <Link
            href="/dashboard"
            className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            {t("header.dashboard", "Dashboard")}
          </Link>
          <Link
            href="/dashboard/profile"
            className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            {t("header.editAccount", "Edit account")}
          </Link>
          <button
            type="button"
            className="w-full px-3 py-2 text-start text-sm text-red-400 hover:bg-white/10"
            onClick={async () => {
              setOpen(false);
              try {
                await fetch("/api/auth/clear-session", { method: "POST", credentials: "include" });
              } catch {
                /* ignore */
              }
              signOut({ callbackUrl: "/" });
            }}
          >
            {t("header.logout", "Log out")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AppTopBar({
  platformName,
  headerLogoUrl,
  platformSubscriptionExpiryLabel,
  onMenuClick,
}: {
  platformName?: string | null;
  headerLogoUrl?: string | null;
  platformSubscriptionExpiryLabel?: string | null;
  onMenuClick: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { status } = useSession();
  const [query, setQuery] = useState("");
  const displayName = platformName?.trim() || BRAND_NAME;

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header className="app-topbar sticky top-0 z-30 border-b border-white/5">
      <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10 lg:hidden"
          aria-label={t("nav.openMenu", "Open menu")}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <Link href="/" className="flex min-w-0 shrink items-center gap-2.5">
          {headerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headerLogoUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full border border-[#F59E0B]/40 object-cover"
            />
          ) : (
            <AcademyLogo className="h-10 w-10 shrink-0" title={displayName} />
          )}
          <span className="hidden min-w-0 truncate text-sm font-semibold tracking-tight text-white sm:block md:text-base">
            <span className="text-white">Mostafa Abdullah</span>{" "}
            <span className="text-[#F59E0B]">academy</span>
          </span>
        </Link>

        <form onSubmit={onSearch} className="mx-auto hidden min-w-0 flex-1 max-w-xl md:block">
          <label className="relative block">
            <span className="sr-only">{t("nav.search", "Search")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder", "ابحث عن كورس أو موضوع")}
              className="w-full rounded-full border border-white/10 bg-[#1e293b] py-2.5 pe-4 ps-11 text-sm text-white placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
              </svg>
            </span>
          </label>
        </form>

        <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href={status === "authenticated" ? "/dashboard/messages" : "/login"}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label={t("nav.messages", "Messages")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16v12H4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m4 7 8 6 8-6" />
            </svg>
          </Link>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label={t("nav.notifications", "Notifications")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 18.5a2 2 0 0 0 4 0" />
            </svg>
            <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <TopBarUser />
        </div>
      </div>

      <form onSubmit={onSearch} className="border-t border-white/5 px-3 pb-3 md:hidden">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("nav.searchPlaceholder", "ابحث عن كورس أو موضوع")}
          className="w-full rounded-full border border-white/10 bg-[#1e293b] py-2.5 px-4 text-sm text-white placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
        />
      </form>

      {platformSubscriptionExpiryLabel ? (
        <div className="border-t border-[#2563EB]/35 bg-[#1e3a8a]/40 py-2 text-center text-xs text-blue-50 sm:text-sm">
          <span className="font-semibold text-blue-200">
            {t("header.platformSubscriptionActive", "You are subscribed to the platform subscription")}
          </span>
          {" — "}
          <span>
            {t("header.endsAt", "Expires at:")}{" "}
            <time className="font-medium text-white">{platformSubscriptionExpiryLabel}</time>
          </span>
        </div>
      ) : null}
    </header>
  );
}
