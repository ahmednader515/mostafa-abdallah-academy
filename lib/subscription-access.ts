/**
 * صلاحيات الاشتراك حسب تغطية التصنيفات / صفحات التدريب الخارجي.
 * توافق قديم: covers_*=true بدون صفوف تغطية لذلك النوع ⇒ وصول لكل محتوى النوع.
 */

export type SubscriptionCoverageKind = "courses" | "library" | "external";

export type PlanCoverageTargets = {
  courseCategoryIds: string[];
  libraryCategoryIds: string[];
  externalTrainingIds: string[];
};

export type ActiveSubscriptionAccess = {
  active: boolean;
  planId: string | null;
  planName: string | null;
  expiresAt: Date | null;
  coversCourses: boolean;
  coversLibrary: boolean;
  coversExternal: boolean;
  courseCategoryIds: string[];
  libraryCategoryIds: string[];
  externalTrainingIds: string[];
  /** covers_courses بدون صفوف courses ⇒ كل تصنيفات الكورسات */
  legacyAllCourses: boolean;
  legacyAllLibrary: boolean;
  legacyAllExternal: boolean;
};

const EMPTY_ACCESS: ActiveSubscriptionAccess = {
  active: false,
  planId: null,
  planName: null,
  expiresAt: null,
  coversCourses: false,
  coversLibrary: false,
  coversExternal: false,
  courseCategoryIds: [],
  libraryCategoryIds: [],
  externalTrainingIds: [],
  legacyAllCourses: false,
  legacyAllLibrary: false,
  legacyAllExternal: false,
};

function uniqIds(ids: string[]): string[] {
  return [...new Set(ids.map((x) => String(x).trim()).filter(Boolean))];
}

export function canAccessCourseCategory(
  access: ActiveSubscriptionAccess,
  categoryId: string | null | undefined,
): boolean {
  if (!access.active || !access.coversCourses) return false;
  if (access.legacyAllCourses) return true;
  const id = categoryId?.trim();
  if (!id) return false;
  return access.courseCategoryIds.includes(id);
}

export function canAccessLibraryCategory(
  access: ActiveSubscriptionAccess,
  categoryId: string | null | undefined,
): boolean {
  if (!access.active || !access.coversLibrary) return false;
  if (access.legacyAllLibrary) return true;
  const id = categoryId?.trim();
  if (!id) return false;
  return access.libraryCategoryIds.includes(id);
}

export function canAccessExternalPage(
  access: ActiveSubscriptionAccess,
  pageId: string | null | undefined,
): boolean {
  if (!access.active || !access.coversExternal) return false;
  if (access.legacyAllExternal) return true;
  const id = pageId?.trim();
  if (!id) return false;
  return access.externalTrainingIds.includes(id);
}

export async function getActiveSubscriptionAccess(
  userId: string,
): Promise<ActiveSubscriptionAccess> {
  const uid = userId.trim();
  if (!uid) return EMPTY_ACCESS;
  try {
    const { sql } = await import("@/lib/db");
    const { ensurePlatformSubscriptionSchemaExported } = await import("@/lib/db");
    await ensurePlatformSubscriptionSchemaExported();

    const subRows = await sql`
      SELECT ups.plan_id, ups.expires_at, sp.name,
             sp.covers_courses, sp.covers_library, sp.covers_external_training
      FROM "UserPlatformSubscription" ups
      LEFT JOIN "SubscriptionPlan" sp ON sp.id = ups.plan_id
      WHERE ups.user_id = ${uid} AND ups.expires_at > NOW()
      ORDER BY ups.expires_at DESC
      LIMIT 1
    `;
    const row = (subRows as Record<string, unknown>[])[0];
    if (!row) return EMPTY_ACCESS;

    const planId = row.plan_id ? String(row.plan_id) : null;
    const coversCourses = row.covers_courses !== false && row.covers_courses !== "f";
    const coversLibrary = row.covers_library !== false && row.covers_library !== "f";
    const coversExternal =
      row.covers_external_training === true || row.covers_external_training === "t";

    let courseCategoryIds: string[] = [];
    let libraryCategoryIds: string[] = [];
    let externalTrainingIds: string[] = [];

    if (planId) {
      try {
        const covRows = await sql`
          SELECT content_kind, target_id
          FROM "SubscriptionPlanCoverage"
          WHERE plan_id = ${planId}
        `;
        for (const c of covRows as Record<string, unknown>[]) {
          const kind = String(c.content_kind ?? "");
          const tid = String(c.target_id ?? "").trim();
          if (!tid) continue;
          if (kind === "courses") courseCategoryIds.push(tid);
          else if (kind === "library") libraryCategoryIds.push(tid);
          else if (kind === "external") externalTrainingIds.push(tid);
        }
      } catch {
        /* table may lag */
      }
    }

    courseCategoryIds = uniqIds(courseCategoryIds);
    libraryCategoryIds = uniqIds(libraryCategoryIds);
    externalTrainingIds = uniqIds(externalTrainingIds);

    return {
      active: true,
      planId,
      planName: row.name != null ? String(row.name) : null,
      expiresAt: row.expires_at ? new Date(String(row.expires_at)) : null,
      coversCourses,
      coversLibrary,
      coversExternal,
      courseCategoryIds,
      libraryCategoryIds,
      externalTrainingIds,
      legacyAllCourses: coversCourses && courseCategoryIds.length === 0,
      legacyAllLibrary: coversLibrary && libraryCategoryIds.length === 0,
      legacyAllExternal: coversExternal && externalTrainingIds.length === 0,
    };
  } catch {
    return EMPTY_ACCESS;
  }
}

export async function userCanAccessCourseViaSubscription(
  userId: string,
  courseId: string,
): Promise<boolean> {
  try {
    const { getCourseById } = await import("@/lib/db");
    const access = await getActiveSubscriptionAccess(userId);
    if (!access.active || !access.coversCourses) return false;
    const course = await getCourseById(courseId);
    if (!course) return false;
    const pub =
      (course as { isPublished?: boolean }).isPublished ??
      (course as { is_published?: boolean }).is_published;
    if (!pub) return false;
    const price = Number((course as { price?: unknown }).price) || 0;
    const accessType = String(
      (course as { accessType?: string; access_type?: string }).accessType ??
        (course as { access_type?: string }).access_type ??
        "lifetime",
    );
    if (accessType !== "subscription_only" && price <= 0) return false;
    const categoryId =
      (course as { categoryId?: string | null }).categoryId ??
      (course as { category_id?: string | null }).category_id ??
      null;
    return canAccessCourseCategory(access, categoryId);
  } catch {
    return false;
  }
}

export async function userCanAccessLibraryProductViaSubscription(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    const { sql } = await import("@/lib/db");
    const access = await getActiveSubscriptionAccess(userId);
    if (!access.active || !access.coversLibrary) return false;
    const rows = await sql`
      SELECT category_id, is_active FROM "StoreProduct" WHERE id = ${productId.trim()} LIMIT 1
    `;
    const p = (rows as Record<string, unknown>[])[0];
    if (!p || !p.is_active) return false;
    return canAccessLibraryCategory(access, p.category_id ? String(p.category_id) : null);
  } catch {
    return false;
  }
}

export async function userCanAccessExternalViaSubscription(
  userId: string,
  pageId: string,
): Promise<boolean> {
  const access = await getActiveSubscriptionAccess(userId);
  return canAccessExternalPage(access, pageId);
}
