import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import {
  getCoursesAll,
  getCoursesWithCountsForCreator,
  listSubscriptionPlansAll,
} from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CodesManage } from "./CodesManage";

export default async function DashboardCodesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const isStaff =
    session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN";
  const isTeacher = session.user.role === "TEACHER";
  if (!isStaff && !isTeacher) redirect("/dashboard");
  const t = await getServerTranslator();

  const courses = isTeacher
    ? await getCoursesWithCountsForCreator(session.user.id).catch(() => [])
    : await getCoursesAll();
  const courseOptions = courses
    .map((c) => ({
      id: String((c as { id?: unknown }).id ?? ""),
      title:
        (c as { title_ar?: string; title: string }).title_ar ??
        (c as { title: string }).title,
    }))
    .filter((o) => o.id);

  const planOptions = isStaff
    ? (await listSubscriptionPlansAll().catch(() => []))
        .map((p) => ({
          id: String(p.id),
          name: p.name,
        }))
        .filter((o) => o.id)
    : [];

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t(
          "dashboard.codesRoutePage.title",
          "Activation codes (free access)",
        )}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {isTeacher
          ? t(
              "dashboard.codesRoutePage.descTeacher",
              "Create free activation codes for your courses. Codes grant access at no charge — they are not discounts.",
            )
          : t(
              "dashboard.codesRoutePage.descStaff",
              "Create free activation codes for courses or subscription plans. Codes grant access at no charge — they are not discounts.",
            )}
      </p>

      {isStaff ? (
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-3 text-sm text-[var(--color-foreground)]">
          <p>
            {t(
              "dashboard.codesRoutePage.activationBanner",
              "Activation codes grant free access to courses or subscriptions. For percentage or fixed discounts at checkout, use discount coupons instead.",
            )}
          </p>
          <p className="mt-2">
            <Link
              href="/dashboard/coupons"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              {t(
                "dashboard.codesRoutePage.couponsLink",
                "Manage discount coupons →",
              )}
            </Link>
          </p>
        </div>
      ) : null}

      <CodesManage
        courseOptions={courseOptions}
        planOptions={planOptions}
        allowSubscriptionCodes={isStaff}
      />
    </div>
  );
}
