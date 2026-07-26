import Link from "next/link";
import { BRAND_NAME_EN } from "@/lib/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold tracking-wide text-[var(--color-primary)]">404</p>
      <h1 className="mt-3 text-3xl font-extrabold text-[var(--color-foreground)] sm:text-4xl">
        الصفحة غير موجودة
      </h1>
      <p className="mt-3 max-w-md text-sm text-[var(--color-muted)] sm:text-base">
        الرابط الذي حاولت فتحه غير متاح أو تم نقله. عد إلى {BRAND_NAME_EN} وواصل التعلم.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          الصفحة الرئيسية
        </Link>
        <Link
          href="/courses"
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface)]"
        >
          الكورسات
        </Link>
      </div>
    </div>
  );
}
