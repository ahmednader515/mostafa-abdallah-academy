/**
 * Unified analytics queries for the Analytics Dashboard.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL غير معرّف");

const sql = neon(connectionString);

export type AnalyticsPreset = "today" | "week" | "month" | "year" | "custom";
export type AnalyticsSource = "course" | "subscription" | "store" | "all";
export type AnalyticsStatus = "paid" | "free" | "active" | "expired" | "all";

export type AnalyticsFilters = {
  from: Date;
  to: Date;
  preset: AnalyticsPreset;
  planId?: string;
  courseId?: string;
  categoryId?: string;
  teacherId?: string;
  userId?: string;
  source?: AnalyticsSource;
  status?: AnalyticsStatus;
  country?: string;
};

export type AnalyticsKpis = {
  totalUsers: number;
  newStudents: number;
  coursesSold: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalSales: number;
  totalProfit: number;
  purchaseCount: number;
  freeEnrollments: number;
  activeUsers: number;
};

export type AnalyticsRatios = {
  userGrowth: number;
  courseCompletion: number;
  newSubscriptionShare: number;
  salesCourseShare: number;
  salesSubscriptionShare: number;
  salesStoreShare: number;
  traineeEngagement: number;
  topCourseDemandShare: number;
};

export type AnalyticsSubscriptionRow = {
  planId: string;
  planName: string;
  subscribers: number;
  newInPeriod: number;
  renewals: number;
  expired: number;
  revenue: number;
};

export type AnalyticsSalesBreakdown = {
  coursesRevenue: number;
  coursesProfit: number;
  coursesCount: number;
  subscriptionsRevenue: number;
  subscriptionsProfit: number;
  subscriptionsCount: number;
  storeRevenue: number;
  storeProfit: number;
  storeCount: number;
  avgOrderValue: number;
};

export type AnalyticsSeriesPoint = {
  label: string;
  sales: number;
  profit: number;
  students: number;
  subscriptions: number;
};

export type AnalyticsRankingItem = {
  id: string;
  name: string;
  value: number;
  extra?: number;
};

export type AnalyticsPayload = {
  kpis: AnalyticsKpis;
  ratios: AnalyticsRatios;
  subscriptions: {
    byPlan: AnalyticsSubscriptionRow[];
    newInPeriod: number;
    renewals: number;
    expiredInPeriod: number;
    topPlanId: string | null;
    topPlanName: string | null;
  };
  sales: AnalyticsSalesBreakdown;
  series: AnalyticsSeriesPoint[];
  rankings: {
    topCourses: AnalyticsRankingItem[];
    topWatched: AnalyticsRankingItem[];
    courseProfits: AnalyticsRankingItem[];
  };
  meta: {
    from: string;
    to: string;
    preset: AnalyticsPreset;
    previousFrom: string;
    previousTo: string;
  };
};

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export function resolveAnalyticsRange(params: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
}): { from: Date; to: Date; preset: AnalyticsPreset } {
  const now = new Date();
  const to = params.to ? endOfDay(new Date(params.to)) : endOfDay(now);
  const presetRaw = (params.preset || "month") as AnalyticsPreset;

  if (params.from && params.to) {
    return {
      from: startOfDay(new Date(params.from)),
      to: endOfDay(new Date(params.to)),
      preset: "custom",
    };
  }

  let from: Date;
  switch (presetRaw) {
    case "today":
      from = startOfDay(now);
      break;
    case "week":
      from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
      break;
    case "year":
      from = startOfDay(new Date(Date.UTC(now.getUTCFullYear(), 0, 1)));
      break;
    case "month":
    default:
      from = startOfDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
      break;
  }
  return { from, to, preset: presetRaw === "custom" ? "month" : presetRaw };
}

function previousPeriod(from: Date, to: Date): { from: Date; to: Date } {
  const ms = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - ms);
  return { from: prevFrom, to: prevTo };
}

function num(rows: unknown, key: string): number {
  return Number(((rows as Record<string, unknown>[])?.[0] ?? {})[key] ?? 0);
}

function parseFilters(input: Partial<AnalyticsFilters> & { from: Date; to: Date; preset: AnalyticsPreset }): AnalyticsFilters {
  return {
    from: input.from,
    to: input.to,
    preset: input.preset,
    planId: input.planId?.trim() || undefined,
    courseId: input.courseId?.trim() || undefined,
    categoryId: input.categoryId?.trim() || undefined,
    teacherId: input.teacherId?.trim() || undefined,
    userId: input.userId?.trim() || undefined,
    source: input.source && input.source !== "all" ? input.source : undefined,
    status: input.status && input.status !== "all" ? input.status : undefined,
    country: input.country?.trim() || undefined,
  };
}

export async function getAnalyticsDashboard(
  raw: Partial<AnalyticsFilters> & { from: Date; to: Date; preset: AnalyticsPreset },
): Promise<AnalyticsPayload> {
  const f = parseFilters(raw);
  const prev = previousPeriod(f.from, f.to);
  const fromIso = f.from.toISOString();
  const toIso = f.to.toISOString();
  const prevFromIso = prev.from.toISOString();
  const prevToIso = prev.to.toISOString();

  // Ensure watch progress table exists
  await sql`
    CREATE TABLE IF NOT EXISTS "LessonWatchProgress" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
      percent DOUBLE PRECISION NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, lesson_id)
    )
  `.catch(() => undefined);

  const source = f.source;

  const [
    totalUsersRows,
    newStudentsRows,
    prevNewStudentsRows,
    coursesSoldRows,
    activeSubsRows,
    expiredSubsRows,
    courseSalesRows,
    subSalesRows,
    storeSalesRows,
    freeEnrollRows,
    activeUsersRows,
    completionRows,
    enrollCountRows,
    engagementRows,
    subByPlanRows,
    renewalsRows,
    expiredInPeriodRows,
    seriesSalesCourse,
    seriesSalesSub,
    seriesSalesStore,
    seriesStudents,
    seriesSubs,
    topCoursesRows,
    topWatchedRows,
    courseProfitRows,
    newSubsInPeriodRows,
  ] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM "User"`.catch(() => [{ c: 0 }]),
    sql`
      SELECT COUNT(*)::int AS c FROM "User"
      WHERE role = 'STUDENT' AND created_at >= ${fromIso} AND created_at <= ${toIso}
    `.catch(() => [{ c: 0 }]),
    sql`
      SELECT COUNT(*)::int AS c FROM "User"
      WHERE role = 'STUDENT' AND created_at >= ${prevFromIso} AND created_at <= ${prevToIso}
    `.catch(() => [{ c: 0 }]),
    // courses sold
    (async () => {
      if (source && source !== "course") return [{ c: 0 }];
      try {
        if (f.courseId) {
          return await sql`
            SELECT COUNT(*)::int AS c FROM "Payment"
            WHERE created_at >= ${fromIso} AND created_at <= ${toIso}
              AND course_id = ${f.courseId}
              AND (${f.userId ?? null}::text IS NULL OR user_id = ${f.userId ?? null})
          `;
        }
        if (f.teacherId || f.categoryId || f.country) {
          return await sql`
            SELECT COUNT(*)::int AS c FROM "Payment" p
            INNER JOIN "Course" c ON c.id = p.course_id
            WHERE p.created_at >= ${fromIso} AND p.created_at <= ${toIso}
              AND (${f.teacherId ?? null}::text IS NULL OR c.created_by_id = ${f.teacherId ?? null})
              AND (${f.categoryId ?? null}::text IS NULL OR c.category_id = ${f.categoryId ?? null})
              AND (${f.country ?? null}::text IS NULL OR c.country = ${f.country ?? null})
              AND (${f.userId ?? null}::text IS NULL OR p.user_id = ${f.userId ?? null})
          `;
        }
        return await sql`
          SELECT COUNT(*)::int AS c FROM "Payment"
          WHERE created_at >= ${fromIso} AND created_at <= ${toIso}
            AND (${f.userId ?? null}::text IS NULL OR user_id = ${f.userId ?? null})
        `;
      } catch {
        return [{ c: 0 }];
      }
    })(),
    sql`SELECT COUNT(DISTINCT user_id)::int AS c FROM "UserPlatformSubscription" WHERE expires_at > NOW()`.catch(
      () => [{ c: 0 }],
    ),
    sql`SELECT COUNT(*)::int AS c FROM "UserPlatformSubscription" WHERE expires_at <= NOW()`.catch(() => [{ c: 0 }]),
    // course revenue
    (async () => {
      if (source && source !== "course") return [{ revenue: 0, cnt: 0 }];
      try {
        return await sql`
          SELECT COALESCE(SUM(p.amount), 0)::float AS revenue, COUNT(*)::int AS cnt
          FROM "Payment" p
          LEFT JOIN "Course" c ON c.id = p.course_id
          WHERE p.created_at >= ${fromIso} AND p.created_at <= ${toIso}
            AND (${f.courseId ?? null}::text IS NULL OR p.course_id = ${f.courseId ?? null})
            AND (${f.teacherId ?? null}::text IS NULL OR c.created_by_id = ${f.teacherId ?? null})
            AND (${f.categoryId ?? null}::text IS NULL OR c.category_id = ${f.categoryId ?? null})
            AND (${f.country ?? null}::text IS NULL OR c.country = ${f.country ?? null})
            AND (${f.userId ?? null}::text IS NULL OR p.user_id = ${f.userId ?? null})
        `;
      } catch {
        return [{ revenue: 0, cnt: 0 }];
      }
    })(),
    // subscription revenue
    (async () => {
      if (source && source !== "subscription") return [{ revenue: 0, cnt: 0 }];
      try {
        return await sql`
          SELECT COALESCE(SUM(price_paid), 0)::float AS revenue, COUNT(*)::int AS cnt
          FROM "UserPlatformSubscription"
          WHERE created_at >= ${fromIso} AND created_at <= ${toIso}
            AND (${f.planId ?? null}::text IS NULL OR plan_id = ${f.planId ?? null})
            AND (${f.userId ?? null}::text IS NULL OR user_id = ${f.userId ?? null})
        `;
      } catch {
        return [{ revenue: 0, cnt: 0 }];
      }
    })(),
    // store revenue + profit
    (async () => {
      if (source && source !== "store") return [{ revenue: 0, profit: 0, cnt: 0 }];
      try {
        return await sql`
          SELECT
            COALESCE(SUM(usp.price_paid), 0)::float AS revenue,
            COALESCE(SUM(usp.price_paid - COALESCE(sp.cost_price, 0)), 0)::float AS profit,
            COUNT(*)::int AS cnt
          FROM "UserStorePurchase" usp
          INNER JOIN "StoreProduct" sp ON sp.id = usp.product_id
          WHERE usp.created_at >= ${fromIso} AND usp.created_at <= ${toIso}
            AND (${f.userId ?? null}::text IS NULL OR usp.user_id = ${f.userId ?? null})
        `;
      } catch {
        return [{ revenue: 0, profit: 0, cnt: 0 }];
      }
    })(),
    // free enrollments
    (async () => {
      if (source && source !== "course") return [{ c: 0 }];
      if (f.status === "paid") return [{ c: 0 }];
      try {
        return await sql`
          SELECT COUNT(*)::int AS c
          FROM "Enrollment" e
          INNER JOIN "Course" c ON c.id = e.course_id
          WHERE e.enrolled_at >= ${fromIso} AND e.enrolled_at <= ${toIso}
            AND COALESCE(c.price, 0) = 0
            AND (${f.courseId ?? null}::text IS NULL OR e.course_id = ${f.courseId ?? null})
            AND (${f.teacherId ?? null}::text IS NULL OR c.created_by_id = ${f.teacherId ?? null})
            AND (${f.userId ?? null}::text IS NULL OR e.user_id = ${f.userId ?? null})
        `;
      } catch {
        return [{ c: 0 }];
      }
    })(),
    sql`
      SELECT COUNT(*)::int AS c FROM "User"
      WHERE last_login_at IS NOT NULL AND last_login_at >= ${fromIso} AND last_login_at <= ${toIso}
    `.catch(() => [{ c: 0 }]),
    sql`
      SELECT COUNT(DISTINCT user_id || ':' || lesson_id)::int AS c
      FROM "LessonWatchProgress" WHERE percent >= 90
    `.catch(() => [{ c: 0 }]),
    sql`SELECT COUNT(*)::int AS c FROM "Enrollment"`.catch(() => [{ c: 0 }]),
    sql`SELECT COALESCE(AVG(percent), 0)::float AS avg FROM "LessonWatchProgress"`.catch(() => [{ avg: 0 }]),
    // subscriptions by plan
    sql`
      SELECT
        sp.id AS plan_id,
        sp.name AS plan_name,
        COUNT(*) FILTER (WHERE ups.expires_at > NOW())::int AS subscribers,
        COUNT(*) FILTER (WHERE ups.created_at >= ${fromIso} AND ups.created_at <= ${toIso})::int AS new_in_period,
        COUNT(*) FILTER (WHERE ups.expires_at <= NOW())::int AS expired,
        COALESCE(SUM(ups.price_paid) FILTER (WHERE ups.created_at >= ${fromIso} AND ups.created_at <= ${toIso}), 0)::float AS revenue
      FROM "SubscriptionPlan" sp
      LEFT JOIN "UserPlatformSubscription" ups ON ups.plan_id = sp.id
      WHERE (${f.planId ?? null}::text IS NULL OR sp.id = ${f.planId ?? null})
      GROUP BY sp.id, sp.name
      ORDER BY revenue DESC
    `.catch(() => []),
    // renewals: users with >1 subscription row for same plan, and a row created in period
    sql`
      SELECT COUNT(*)::int AS c FROM (
        SELECT ups.user_id, ups.plan_id
        FROM "UserPlatformSubscription" ups
        WHERE ups.created_at >= ${fromIso} AND ups.created_at <= ${toIso}
          AND (${f.planId ?? null}::text IS NULL OR ups.plan_id = ${f.planId ?? null})
        GROUP BY ups.user_id, ups.plan_id
        HAVING (
          SELECT COUNT(*) FROM "UserPlatformSubscription" u2
          WHERE u2.user_id = ups.user_id AND u2.plan_id = ups.plan_id
        ) > 1
      ) t
    `.catch(() => [{ c: 0 }]),
    sql`
      SELECT COUNT(*)::int AS c FROM "UserPlatformSubscription"
      WHERE expires_at >= ${fromIso} AND expires_at <= ${toIso} AND expires_at <= NOW()
        AND (${f.planId ?? null}::text IS NULL OR plan_id = ${f.planId ?? null})
    `.catch(() => [{ c: 0 }]),
    // time series — daily buckets for short ranges, monthly for longer
    sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS label,
             COALESCE(SUM(amount), 0)::float AS sales
      FROM "Payment"
      WHERE created_at >= ${fromIso} AND created_at <= ${toIso}
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
    sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS label,
             COALESCE(SUM(price_paid), 0)::float AS sales
      FROM "UserPlatformSubscription"
      WHERE created_at >= ${fromIso} AND created_at <= ${toIso}
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
    sql`
      SELECT to_char(date_trunc('day', usp.created_at), 'YYYY-MM-DD') AS label,
             COALESCE(SUM(usp.price_paid), 0)::float AS sales,
             COALESCE(SUM(usp.price_paid - COALESCE(sp.cost_price, 0)), 0)::float AS profit
      FROM "UserStorePurchase" usp
      INNER JOIN "StoreProduct" sp ON sp.id = usp.product_id
      WHERE usp.created_at >= ${fromIso} AND usp.created_at <= ${toIso}
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
    sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS label, COUNT(*)::int AS c
      FROM "User" WHERE role = 'STUDENT' AND created_at >= ${fromIso} AND created_at <= ${toIso}
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
    sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS label, COUNT(*)::int AS c
      FROM "UserPlatformSubscription"
      WHERE created_at >= ${fromIso} AND created_at <= ${toIso}
      GROUP BY 1 ORDER BY 1
    `.catch(() => []),
    sql`
      SELECT c.id, COALESCE(c.title_ar, c.title) AS name, COUNT(p.id)::int AS value,
             COALESCE(SUM(p.amount), 0)::float AS extra
      FROM "Payment" p
      INNER JOIN "Course" c ON c.id = p.course_id
      WHERE p.created_at >= ${fromIso} AND p.created_at <= ${toIso}
      GROUP BY c.id, name
      ORDER BY value DESC
      LIMIT 8
    `.catch(() => []),
    sql`
      SELECT l.id, COALESCE(l.title, l.id) AS name, COALESCE(AVG(w.percent), 0)::float AS value,
             COUNT(*)::int AS extra
      FROM "LessonWatchProgress" w
      INNER JOIN "Lesson" l ON l.id = w.lesson_id
      WHERE w.updated_at >= ${fromIso} AND w.updated_at <= ${toIso}
      GROUP BY l.id, name
      ORDER BY extra DESC, value DESC
      LIMIT 8
    `.catch(() => []),
    sql`
      SELECT c.id, COALESCE(c.title_ar, c.title) AS name,
             COALESCE(SUM(p.amount), 0)::float AS value
      FROM "Payment" p
      INNER JOIN "Course" c ON c.id = p.course_id
      WHERE p.created_at >= ${fromIso} AND p.created_at <= ${toIso}
      GROUP BY c.id, name
      ORDER BY value DESC
      LIMIT 10
    `.catch(() => []),
    sql`
      SELECT COUNT(*)::int AS c FROM "UserPlatformSubscription"
      WHERE created_at >= ${fromIso} AND created_at <= ${toIso}
    `.catch(() => [{ c: 0 }]),
  ]);

  const coursesRevenue = num(courseSalesRows, "revenue");
  const coursesCount = num(courseSalesRows, "cnt");
  const subsRevenue = num(subSalesRows, "revenue");
  const subsCount = num(subSalesRows, "cnt");
  const storeRevenue = num(storeSalesRows, "revenue");
  const storeProfit = num(storeSalesRows, "profit");
  const storeCount = num(storeSalesRows, "cnt");

  const totalSales = coursesRevenue + subsRevenue + storeRevenue;
  const totalProfit = coursesRevenue + subsRevenue + storeProfit; // courses/subs have no cost
  const purchaseCount = coursesCount + subsCount + storeCount;

  const newStudents = num(newStudentsRows, "c");
  const prevNewStudents = num(prevNewStudentsRows, "c");
  const userGrowth =
    prevNewStudents > 0
      ? Math.min(200, ((newStudents - prevNewStudents) / prevNewStudents) * 100)
      : newStudents > 0
        ? 100
        : 0;

  const enrollments = num(enrollCountRows, "c");
  const completed = num(completionRows, "c");
  const courseCompletion =
    enrollments > 0 ? Math.min(100, (completed / Math.max(enrollments, 1)) * 10) : 0;

  const newSubs = num(newSubsInPeriodRows, "c");
  const newSubscriptionShare =
    purchaseCount > 0 ? Math.min(100, (subsCount / purchaseCount) * 100) : 0;

  const salesCourseShare = totalSales > 0 ? (coursesRevenue / totalSales) * 100 : 0;
  const salesSubscriptionShare = totalSales > 0 ? (subsRevenue / totalSales) * 100 : 0;
  const salesStoreShare = totalSales > 0 ? (storeRevenue / totalSales) * 100 : 0;

  const topCourses = (topCoursesRows as { id: string; name: string; value: number; extra: number }[]).map(
    (r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
      value: Number(r.value ?? 0),
      extra: Number(r.extra ?? 0),
    }),
  );
  const topCourseDemandShare =
    coursesCount > 0 && topCourses[0]
      ? Math.min(100, (topCourses[0].value / coursesCount) * 100)
      : 0;

  // Merge series
  const labelSet = new Set<string>();
  for (const rows of [seriesSalesCourse, seriesSalesSub, seriesSalesStore, seriesStudents, seriesSubs]) {
    for (const r of rows as { label: string }[]) labelSet.add(String(r.label));
  }
  const labels = [...labelSet].sort();
  const mapSum = (rows: unknown, key: string) => {
    const m = new Map<string, number>();
    for (const r of rows as Record<string, unknown>[]) {
      m.set(String(r.label), Number(r[key] ?? 0));
    }
    return m;
  };
  const courseMap = mapSum(seriesSalesCourse, "sales");
  const subMap = mapSum(seriesSalesSub, "sales");
  const storeMap = mapSum(seriesSalesStore, "sales");
  const storeProfitMap = mapSum(seriesSalesStore, "profit");
  const studentsMap = mapSum(seriesStudents, "c");
  const subsMap = mapSum(seriesSubs, "c");

  const series: AnalyticsSeriesPoint[] = labels.map((label) => {
    const sales =
      (courseMap.get(label) ?? 0) + (subMap.get(label) ?? 0) + (storeMap.get(label) ?? 0);
    const profit =
      (courseMap.get(label) ?? 0) + (subMap.get(label) ?? 0) + (storeProfitMap.get(label) ?? 0);
    return {
      label,
      sales,
      profit,
      students: studentsMap.get(label) ?? 0,
      subscriptions: subsMap.get(label) ?? 0,
    };
  });

  const byPlan: AnalyticsSubscriptionRow[] = (
    subByPlanRows as {
      plan_id: string;
      plan_name: string;
      subscribers: number;
      new_in_period: number;
      expired: number;
      revenue: number;
    }[]
  ).map((r) => ({
    planId: String(r.plan_id),
    planName: String(r.plan_name ?? ""),
    subscribers: Number(r.subscribers ?? 0),
    newInPeriod: Number(r.new_in_period ?? 0),
    renewals: 0,
    expired: Number(r.expired ?? 0),
    revenue: Number(r.revenue ?? 0),
  }));

  const renewals = num(renewalsRows, "c");
  // distribute renewals onto top plan for display simplicity if single aggregate
  if (byPlan.length && renewals > 0) {
    byPlan[0].renewals = renewals;
  }

  const topPlan = byPlan.reduce<(typeof byPlan)[0] | null>((best, row) => {
    if (!best || row.revenue > best.revenue) return row;
    return best;
  }, null);

  return {
    kpis: {
      totalUsers: num(totalUsersRows, "c"),
      newStudents,
      coursesSold: num(coursesSoldRows, "c"),
      activeSubscriptions: num(activeSubsRows, "c"),
      expiredSubscriptions: num(expiredSubsRows, "c"),
      totalSales,
      totalProfit,
      purchaseCount,
      freeEnrollments: num(freeEnrollRows, "c"),
      activeUsers: num(activeUsersRows, "c"),
    },
    ratios: {
      userGrowth: Math.round(userGrowth * 10) / 10,
      courseCompletion: Math.round(courseCompletion * 10) / 10,
      newSubscriptionShare: Math.round(newSubscriptionShare * 10) / 10,
      salesCourseShare: Math.round(salesCourseShare * 10) / 10,
      salesSubscriptionShare: Math.round(salesSubscriptionShare * 10) / 10,
      salesStoreShare: Math.round(salesStoreShare * 10) / 10,
      traineeEngagement: Math.round(num(engagementRows, "avg") * 10) / 10,
      topCourseDemandShare: Math.round(topCourseDemandShare * 10) / 10,
    },
    subscriptions: {
      byPlan,
      newInPeriod: newSubs,
      renewals,
      expiredInPeriod: num(expiredInPeriodRows, "c"),
      topPlanId: topPlan?.planId ?? null,
      topPlanName: topPlan?.planName ?? null,
    },
    sales: {
      coursesRevenue,
      coursesProfit: coursesRevenue,
      coursesCount,
      subscriptionsRevenue: subsRevenue,
      subscriptionsProfit: subsRevenue,
      subscriptionsCount: subsCount,
      storeRevenue,
      storeProfit,
      storeCount,
      avgOrderValue: purchaseCount > 0 ? Math.round((totalSales / purchaseCount) * 100) / 100 : 0,
    },
    series,
    rankings: {
      topCourses,
      topWatched: (topWatchedRows as { id: string; name: string; value: number; extra: number }[]).map(
        (r) => ({
          id: String(r.id),
          name: String(r.name ?? ""),
          value: Math.round(Number(r.value ?? 0) * 10) / 10,
          extra: Number(r.extra ?? 0),
        }),
      ),
      courseProfits: (courseProfitRows as { id: string; name: string; value: number }[]).map((r) => ({
        id: String(r.id),
        name: String(r.name ?? ""),
        value: Number(r.value ?? 0),
      })),
    },
    meta: {
      from: fromIso,
      to: toIso,
      preset: f.preset,
      previousFrom: prevFromIso,
      previousTo: prevToIso,
    },
  };
}

export async function getAnalyticsFilterOptions(): Promise<{
  plans: { id: string; name: string }[];
  courses: { id: string; title: string }[];
  categories: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  countries: string[];
}> {
  const [plans, courses, categories, teachers, countries] = await Promise.all([
    sql`SELECT id, name FROM "SubscriptionPlan" ORDER BY sort_order ASC, name ASC`.catch(() => []),
    sql`SELECT id, COALESCE(title_ar, title) AS title FROM "Course" ORDER BY title ASC LIMIT 200`.catch(
      () => [],
    ),
    sql`SELECT id, COALESCE(name_ar, name) AS name FROM "Category" ORDER BY name ASC`.catch(() => []),
    sql`SELECT id, name FROM "User" WHERE role = 'TEACHER' ORDER BY name ASC`.catch(() => []),
    sql`
      SELECT DISTINCT country FROM "Course"
      WHERE country IS NOT NULL AND country <> ''
      ORDER BY country ASC
    `.catch(() => []),
  ]);

  return {
    plans: (plans as { id: string; name: string }[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
    })),
    courses: (courses as { id: string; title: string }[]).map((r) => ({
      id: String(r.id),
      title: String(r.title),
    })),
    categories: (categories as { id: string; name: string }[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
    })),
    teachers: (teachers as { id: string; name: string }[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
    })),
    countries: (countries as { country: string }[])
      .map((r) => String(r.country))
      .filter(Boolean),
  };
}

export type AnalyticsExportReport = "summary" | "sales" | "subscriptions" | "courses";

export async function buildAnalyticsExportRows(
  report: AnalyticsExportReport,
  filters: Partial<AnalyticsFilters> & { from: Date; to: Date; preset: AnalyticsPreset },
): Promise<{ headers: string[]; rows: (string | number)[][] }> {
  const data = await getAnalyticsDashboard(filters);
  if (report === "subscriptions") {
    return {
      headers: ["Plan", "Active subscribers", "New", "Renewals", "Expired", "Revenue"],
      rows: data.subscriptions.byPlan.map((p) => [
        p.planName,
        p.subscribers,
        p.newInPeriod,
        p.renewals,
        p.expired,
        p.revenue,
      ]),
    };
  }
  if (report === "courses") {
    return {
      headers: ["Course", "Sales count", "Revenue"],
      rows: data.rankings.topCourses.map((c) => [c.name, c.value, c.extra ?? 0]),
    };
  }
  if (report === "sales") {
    return {
      headers: ["Date", "Sales", "Profit", "New students", "Subscriptions"],
      rows: data.series.map((s) => [s.label, s.sales, s.profit, s.students, s.subscriptions]),
    };
  }
  // summary
  return {
    headers: ["Metric", "Value"],
    rows: [
      ["Total users", data.kpis.totalUsers],
      ["New students", data.kpis.newStudents],
      ["Courses sold", data.kpis.coursesSold],
      ["Active subscriptions", data.kpis.activeSubscriptions],
      ["Expired subscriptions", data.kpis.expiredSubscriptions],
      ["Total sales", data.kpis.totalSales],
      ["Total profit", data.kpis.totalProfit],
      ["Purchases", data.kpis.purchaseCount],
      ["Free enrollments", data.kpis.freeEnrollments],
      ["Active users", data.kpis.activeUsers],
      ["Courses revenue", data.sales.coursesRevenue],
      ["Subscriptions revenue", data.sales.subscriptionsRevenue],
      ["Store revenue", data.sales.storeRevenue],
      ["Avg order value", data.sales.avgOrderValue],
    ],
  };
}
