"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import {
  STUDENT_DASHBOARD_SECTION_META,
  type StudentDashboardFlags,
  type StudentDashboardSectionKey,
} from "@/lib/student-dashboard-flags";

const baseClass =
  "rounded-[var(--radius-btn)] border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm";
const inactiveClass =
  "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50";
const activeClass =
  "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]";

export function StudentDashboardNav({ flags }: { flags: StudentDashboardFlags }) {
  const t = useT();
  const pathname = usePathname();

  const items = STUDENT_DASHBOARD_SECTION_META.filter((item) => flags[item.key]);

  return (
    <nav className="flex w-full flex-wrap items-center gap-2" aria-label="Student dashboard">
      {items.map((item) => {
        const exact = item.key === "home";
        const isActive = exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const label = t(`studentDash.nav.${item.key}`, item.labelEn);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function isStudentSectionVisible(
  flags: StudentDashboardFlags,
  key: StudentDashboardSectionKey,
): boolean {
  return flags[key] !== false;
}
