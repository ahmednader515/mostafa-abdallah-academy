/**
 * Landing Pages CMS — schema + CRUD + events.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { buildTemplateContent } from "@/lib/landing-page-templates";
import {
  DEFAULT_LANDING_THEME,
  type LandingCtaTargetType,
  type LandingPageEventType,
  type LandingPageStats,
  type LandingSection,
  type LandingTemplateId,
  type LandingTheme,
} from "@/lib/landing-page-types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL غير معرّف");

const sql = neon(connectionString);

const ensureOnceMap = new Map<string, Promise<void>>();
function ensureOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const existing = ensureOnceMap.get(key);
  if (existing) return existing;
  const p = (async () => {
    await fn();
  })();
  ensureOnceMap.set(key, p);
  return p;
}

function generateId(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return "lp" + part() + part() + Date.now().toString(36).slice(-6);
}

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || `page-${Date.now().toString(36)}`;
}

function parseSections(raw: unknown): LandingSection[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LandingSection[]) : [];
  } catch {
    return [];
  }
}

function parseTheme(raw: unknown): LandingTheme {
  if (typeof raw !== "string" || !raw.trim()) return { ...DEFAULT_LANDING_THEME };
  try {
    const parsed = JSON.parse(raw) as Partial<LandingTheme>;
    return { ...DEFAULT_LANDING_THEME, ...parsed };
  } catch {
    return { ...DEFAULT_LANDING_THEME };
  }
}

export type LandingPageRow = {
  id: string;
  internalName: string;
  slug: string;
  templateId: LandingTemplateId;
  isPublished: boolean;
  isVisible: boolean;
  sortOrder: number;
  sections: LandingSection[];
  theme: LandingTheme;
  ctaTargetType: LandingCtaTargetType;
  ctaTargetId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LandingPageListItem = LandingPageRow & { stats: LandingPageStats };

function mapPage(r: Record<string, unknown>): LandingPageRow {
  const templateId = String(r.template_id ?? "course") as LandingTemplateId;
  const ctaTargetType = String(r.cta_target_type ?? "none") as LandingCtaTargetType;
  return {
    id: String(r.id),
    internalName: String(r.internal_name ?? ""),
    slug: String(r.slug ?? ""),
    templateId: (["course", "subscription", "consultation", "product"] as LandingTemplateId[]).includes(
      templateId,
    )
      ? templateId
      : "course",
    isPublished: Boolean(r.is_published),
    isVisible: r.is_visible == null ? true : Boolean(r.is_visible),
    sortOrder: Number(r.sort_order ?? 0),
    sections: parseSections(r.sections_json),
    theme: parseTheme(r.theme_json),
    ctaTargetType: (
      ["course", "subscription", "library_plan", "consultation", "store_product", "none"] as LandingCtaTargetType[]
    ).includes(ctaTargetType)
      ? ctaTargetType
      : "none",
    ctaTargetId: r.cta_target_id ? String(r.cta_target_id) : null,
    metaTitle: r.meta_title ? String(r.meta_title) : null,
    metaDescription: r.meta_description ? String(r.meta_description) : null,
    metaKeywords: r.meta_keywords ? String(r.meta_keywords) : null,
    ogImageUrl: r.og_image_url ? String(r.og_image_url) : null,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at ?? new Date().toISOString()),
    updatedAt:
      r.updated_at instanceof Date
        ? r.updated_at.toISOString()
        : String(r.updated_at ?? new Date().toISOString()),
  };
}

export async function ensureLandingPagesSchema(): Promise<void> {
  return ensureOnce("ensureLandingPagesSchema", async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS "LandingPage" (
        id TEXT PRIMARY KEY,
        internal_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        template_id TEXT NOT NULL DEFAULT 'course',
        is_published BOOLEAN NOT NULL DEFAULT false,
        is_visible BOOLEAN NOT NULL DEFAULT true,
        sort_order INT NOT NULL DEFAULT 0,
        sections_json TEXT NOT NULL DEFAULT '[]',
        theme_json TEXT NOT NULL DEFAULT '{}',
        cta_target_type TEXT NOT NULL DEFAULT 'none',
        cta_target_id TEXT,
        meta_title TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        og_image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "LandingPageEvent" (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL REFERENCES "LandingPage"(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        meta_json TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS "LandingPage_published_order_idx" ON "LandingPage"(is_published, sort_order)`;
    await sql`CREATE INDEX IF NOT EXISTS "LandingPageEvent_page_type_idx" ON "LandingPageEvent"(page_id, event_type, created_at)`;
  });
}

async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  let candidate = slugify(desired);
  for (let i = 0; i < 50; i++) {
    const rows = excludeId
      ? await sql`SELECT id FROM "LandingPage" WHERE slug = ${candidate} AND id <> ${excludeId} LIMIT 1`
      : await sql`SELECT id FROM "LandingPage" WHERE slug = ${candidate} LIMIT 1`;
    if (!rows[0]) return candidate;
    candidate = `${slugify(desired).slice(0, 60)}-${i + 2}`;
  }
  return `${slugify(desired)}-${Date.now().toString(36)}`;
}

export async function getLandingPageStatsMap(pageIds: string[]): Promise<Map<string, LandingPageStats>> {
  const map = new Map<string, LandingPageStats>();
  for (const id of pageIds) {
    map.set(id, { visits: 0, ctaClicks: 0, checkoutStarts: 0, purchases: 0 });
  }
  if (pageIds.length === 0) return map;
  await ensureLandingPagesSchema();
  const rows = await sql`
    SELECT page_id, event_type, COUNT(*)::int AS c
    FROM "LandingPageEvent"
    WHERE page_id = ANY(${pageIds})
    GROUP BY page_id, event_type
  `;
  for (const row of rows as { page_id: string; event_type: string; c: number }[]) {
    const stats = map.get(row.page_id);
    if (!stats) continue;
    const c = Number(row.c ?? 0);
    if (row.event_type === "visit") stats.visits = c;
    else if (row.event_type === "cta_click") stats.ctaClicks = c;
    else if (row.event_type === "checkout_start") stats.checkoutStarts = c;
    else if (row.event_type === "purchase") stats.purchases = c;
  }
  return map;
}

export async function listLandingPagesAdmin(): Promise<LandingPageListItem[]> {
  await ensureLandingPagesSchema();
  const rows = await sql`SELECT * FROM "LandingPage" ORDER BY sort_order ASC, created_at DESC`;
  const pages = (rows as Record<string, unknown>[]).map(mapPage);
  const statsMap = await getLandingPageStatsMap(pages.map((p) => p.id));
  return pages.map((p) => ({ ...p, stats: statsMap.get(p.id)! }));
}

export async function listPublishedLandingPagesForSitemap(): Promise<
  { slug: string; updatedAt: string }[]
> {
  await ensureLandingPagesSchema();
  const rows = await sql`
    SELECT slug, updated_at FROM "LandingPage"
    WHERE is_published = true AND is_visible = true
    ORDER BY sort_order ASC
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    slug: String(r.slug),
    updatedAt:
      r.updated_at instanceof Date
        ? r.updated_at.toISOString()
        : String(r.updated_at ?? new Date().toISOString()),
  }));
}

export async function getLandingPageById(id: string): Promise<LandingPageRow | null> {
  await ensureLandingPagesSchema();
  const rows = await sql`SELECT * FROM "LandingPage" WHERE id = ${id} LIMIT 1`;
  const r = rows[0] as Record<string, unknown> | undefined;
  return r ? mapPage(r) : null;
}

export async function getLandingPageBySlug(
  slug: string,
  opts?: { allowUnpublished?: boolean },
): Promise<LandingPageRow | null> {
  await ensureLandingPagesSchema();
  const s = slug.trim();
  if (!s) return null;
  const rows = opts?.allowUnpublished
    ? await sql`SELECT * FROM "LandingPage" WHERE slug = ${s} LIMIT 1`
    : await sql`
        SELECT * FROM "LandingPage"
        WHERE slug = ${s} AND is_published = true AND is_visible = true
        LIMIT 1
      `;
  const r = rows[0] as Record<string, unknown> | undefined;
  return r ? mapPage(r) : null;
}

export async function createLandingPage(data: {
  internalName: string;
  slug?: string;
  templateId?: LandingTemplateId;
  ctaTargetType?: LandingCtaTargetType;
  ctaTargetId?: string | null;
}): Promise<LandingPageRow> {
  await ensureLandingPagesSchema();
  const id = generateId();
  const templateId = data.templateId ?? "course";
  const { sections, theme } = buildTemplateContent(templateId);
  const internalName = data.internalName.trim() || "صفحة هبوط جديدة";
  const slug = await uniqueSlug(data.slug?.trim() || internalName);
  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), -1)::int AS m FROM "LandingPage"`;
  const sortOrder = Number((maxRows[0] as { m?: number })?.m ?? -1) + 1;
  const ctaTargetType = data.ctaTargetType ?? "none";
  const ctaTargetId = data.ctaTargetId?.trim() || null;

  await sql`
    INSERT INTO "LandingPage" (
      id, internal_name, slug, template_id, is_published, is_visible, sort_order,
      sections_json, theme_json, cta_target_type, cta_target_id,
      meta_title, meta_description
    ) VALUES (
      ${id},
      ${internalName},
      ${slug},
      ${templateId},
      false,
      true,
      ${sortOrder},
      ${JSON.stringify(sections)},
      ${JSON.stringify(theme)},
      ${ctaTargetType},
      ${ctaTargetId},
      ${internalName},
      ${""}
    )
  `;
  const created = await getLandingPageById(id);
  if (!created) throw new Error("Failed to create landing page");
  return created;
}

export async function updateLandingPage(
  id: string,
  data: Partial<{
    internalName: string;
    slug: string;
    templateId: LandingTemplateId;
    isPublished: boolean;
    isVisible: boolean;
    sortOrder: number;
    sections: LandingSection[];
    theme: LandingTheme;
    ctaTargetType: LandingCtaTargetType;
    ctaTargetId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    ogImageUrl: string | null;
  }>,
): Promise<LandingPageRow | null> {
  await ensureLandingPagesSchema();
  const existing = await getLandingPageById(id);
  if (!existing) return null;

  if (data.internalName !== undefined) {
    await sql`UPDATE "LandingPage" SET internal_name = ${data.internalName.trim()}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.slug !== undefined) {
    const slug = await uniqueSlug(data.slug, id);
    await sql`UPDATE "LandingPage" SET slug = ${slug}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.templateId !== undefined) {
    await sql`UPDATE "LandingPage" SET template_id = ${data.templateId}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.isPublished !== undefined) {
    await sql`UPDATE "LandingPage" SET is_published = ${data.isPublished}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.isVisible !== undefined) {
    await sql`UPDATE "LandingPage" SET is_visible = ${data.isVisible}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.sortOrder !== undefined) {
    await sql`UPDATE "LandingPage" SET sort_order = ${data.sortOrder}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.sections !== undefined) {
    await sql`UPDATE "LandingPage" SET sections_json = ${JSON.stringify(data.sections)}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.theme !== undefined) {
    await sql`UPDATE "LandingPage" SET theme_json = ${JSON.stringify(data.theme)}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.ctaTargetType !== undefined) {
    await sql`UPDATE "LandingPage" SET cta_target_type = ${data.ctaTargetType}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.ctaTargetId !== undefined) {
    await sql`UPDATE "LandingPage" SET cta_target_id = ${data.ctaTargetId}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.metaTitle !== undefined) {
    await sql`UPDATE "LandingPage" SET meta_title = ${data.metaTitle}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.metaDescription !== undefined) {
    await sql`UPDATE "LandingPage" SET meta_description = ${data.metaDescription}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.metaKeywords !== undefined) {
    await sql`UPDATE "LandingPage" SET meta_keywords = ${data.metaKeywords}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.ogImageUrl !== undefined) {
    await sql`UPDATE "LandingPage" SET og_image_url = ${data.ogImageUrl}, updated_at = NOW() WHERE id = ${id}`;
  }

  return getLandingPageById(id);
}

export async function deleteLandingPage(id: string): Promise<void> {
  await ensureLandingPagesSchema();
  await sql`DELETE FROM "LandingPage" WHERE id = ${id}`;
}

export async function duplicateLandingPage(id: string): Promise<LandingPageRow> {
  await ensureLandingPagesSchema();
  const source = await getLandingPageById(id);
  if (!source) throw new Error("Landing page not found");
  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), -1)::int AS m FROM "LandingPage"`;
  const sortOrder = Number((maxRows[0] as { m?: number })?.m ?? -1) + 1;
  const newId = generateId();
  const slug = await uniqueSlug(`${source.slug}-copy`);
  const internalName = `${source.internalName} (نسخة)`;

  await sql`
    INSERT INTO "LandingPage" (
      id, internal_name, slug, template_id, is_published, is_visible, sort_order,
      sections_json, theme_json, cta_target_type, cta_target_id,
      meta_title, meta_description, meta_keywords, og_image_url
    ) VALUES (
      ${newId},
      ${internalName},
      ${slug},
      ${source.templateId},
      false,
      ${source.isVisible},
      ${sortOrder},
      ${JSON.stringify(source.sections)},
      ${JSON.stringify(source.theme)},
      ${source.ctaTargetType},
      ${source.ctaTargetId},
      ${source.metaTitle},
      ${source.metaDescription},
      ${source.metaKeywords},
      ${source.ogImageUrl}
    )
  `;
  const created = await getLandingPageById(newId);
  if (!created) throw new Error("Failed to duplicate landing page");
  return created;
}

export async function reorderLandingPages(orderedIds: string[]): Promise<void> {
  await ensureLandingPagesSchema();
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    if (!id) continue;
    await sql`UPDATE "LandingPage" SET sort_order = ${i}, updated_at = NOW() WHERE id = ${id}`;
  }
}

export async function recordLandingPageEvent(
  pageId: string,
  eventType: LandingPageEventType,
  meta?: Record<string, unknown>,
): Promise<void> {
  await ensureLandingPagesSchema();
  const id = generateId();
  const metaJson = meta ? JSON.stringify(meta) : null;
  await sql`
    INSERT INTO "LandingPageEvent" (id, page_id, event_type, meta_json)
    VALUES (${id}, ${pageId}, ${eventType}, ${metaJson})
  `;
}

export async function recordLandingPageEventBySlug(
  slug: string,
  eventType: LandingPageEventType,
  meta?: Record<string, unknown>,
): Promise<{ pageId: string } | null> {
  const page = await getLandingPageBySlug(slug, { allowUnpublished: true });
  if (!page) return null;
  await recordLandingPageEvent(page.id, eventType, meta);
  return { pageId: page.id };
}

export async function getLandingPageStats(pageId: string): Promise<LandingPageStats> {
  const map = await getLandingPageStatsMap([pageId]);
  return map.get(pageId) ?? { visits: 0, ctaClicks: 0, checkoutStarts: 0, purchases: 0 };
}
