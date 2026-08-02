/**
 * قوالب الشهادات — CRUD + ترحيل من CertificateDesignSetting
 * عميل Neon مستقل لتجنّب حلقات الاستيراد مع lib/db و lms-spec-db.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL غير معرّف");
const sql = neon(connectionString);

const ensureOnceMap = new Map<string, Promise<void>>();
function ensureOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const existing = ensureOnceMap.get(key);
  if (existing) return existing;
  const p = fn().catch((err) => {
    ensureOnceMap.delete(key);
    throw err;
  });
  ensureOnceMap.set(key, p);
  return p;
}

function generateId() {
  return `ctpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export type CertificateOrientation = "landscape" | "portrait";
export type CertificateFrameStyle = "solid" | "double" | "ornate";
export type CertificateFontFamily = "Cairo" | "Tajawal" | "Georgia" | "Times New Roman";

export type CertificateSignatureSlot = {
  imageUrl: string | null;
  nameAr: string | null;
  nameEn: string | null;
  titleAr: string | null;
  titleEn: string | null;
  widthPct: number;
  xPct: number;
  yPct: number;
};

export type CertificateTemplate = {
  id: string;
  name: string;
  nameAr: string | null;
  isDefault: boolean;
  orientation: CertificateOrientation;
  primaryColor: string;
  accentColor: string;
  goldColor: string;
  bgColor: string;
  titleAr: string | null;
  titleEn: string | null;
  eyebrowAr: string | null;
  eyebrowEn: string | null;
  bodyAr: string | null;
  bodyEn: string | null;
  logoUrl: string | null;
  logoWidthPct: number;
  logoYPct: number;
  sealUrl: string | null;
  sealWidthPct: number;
  sealXPct: number;
  sealYPct: number;
  borderWidth: number;
  frameStyle: CertificateFrameStyle;
  fontFamily: CertificateFontFamily;
  showScore: boolean;
  showPattern: boolean;
  showQr: boolean;
  showSeal: boolean;
  signatures: CertificateSignatureSlot[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const DEFAULT_SIGNATURE: CertificateSignatureSlot = {
  imageUrl: null,
  nameAr: null,
  nameEn: null,
  titleAr: null,
  titleEn: null,
  widthPct: 18,
  xPct: 50,
  yPct: 82,
};

export const DEFAULT_CERTIFICATE_TEMPLATE: Omit<CertificateTemplate, "id" | "createdAt" | "updatedAt"> = {
  name: "Default",
  nameAr: "الافتراضي",
  isDefault: true,
  orientation: "portrait",
  primaryColor: "#0F172A",
  accentColor: "#2563EB",
  goldColor: "#F59E0B",
  bgColor: "#FFFFFF",
  titleAr: null,
  titleEn: null,
  eyebrowAr: null,
  eyebrowEn: null,
  bodyAr: null,
  bodyEn: null,
  logoUrl: null,
  logoWidthPct: 14,
  logoYPct: 8,
  sealUrl: null,
  sealWidthPct: 14,
  sealXPct: 85,
  sealYPct: 78,
  borderWidth: 6,
  frameStyle: "solid",
  fontFamily: "Cairo",
  showScore: true,
  showPattern: true,
  showQr: true,
  showSeal: false,
  signatures: [{ ...DEFAULT_SIGNATURE }],
};

function clampPct(n: unknown, fallback: number, min = 1, max = 100): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v * 10) / 10));
}

function clampBorder(n: unknown, fallback = 6): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(16, Math.max(2, Math.round(v)));
}

export function parseSignaturesJson(raw: unknown): CertificateSignatureSlot[] {
  if (!raw) return [{ ...DEFAULT_SIGNATURE }];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed) || parsed.length === 0) return [{ ...DEFAULT_SIGNATURE }];
    return parsed.map((item) => {
      const o = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return {
        imageUrl: o.imageUrl != null ? String(o.imageUrl).trim() || null : null,
        nameAr: o.nameAr != null ? String(o.nameAr).trim() || null : null,
        nameEn: o.nameEn != null ? String(o.nameEn).trim() || null : null,
        titleAr: o.titleAr != null ? String(o.titleAr).trim() || null : null,
        titleEn: o.titleEn != null ? String(o.titleEn).trim() || null : null,
        widthPct: clampPct(o.widthPct, 18, 5, 40),
        xPct: clampPct(o.xPct, 50, 0, 100),
        yPct: clampPct(o.yPct, 82, 0, 100),
      };
    });
  } catch {
    return [{ ...DEFAULT_SIGNATURE }];
  }
}

function parseOrientation(v: unknown): CertificateOrientation {
  return String(v) === "landscape" ? "landscape" : "portrait";
}

function parseFrameStyle(v: unknown): CertificateFrameStyle {
  const s = String(v || "solid");
  if (s === "double" || s === "ornate") return s;
  return "solid";
}

function parseFontFamily(v: unknown): CertificateFontFamily {
  const s = String(v || "Cairo");
  if (s === "Tajawal" || s === "Georgia" || s === "Times New Roman") return s;
  return "Cairo";
}

export function parseCertificateTemplateRow(r: Record<string, unknown> | undefined): CertificateTemplate | null {
  if (!r?.id) return null;
  return {
    id: String(r.id),
    name: String(r.name ?? "Template"),
    nameAr: r.name_ar != null ? String(r.name_ar) : null,
    isDefault: r.is_default === true || r.is_default === "true",
    orientation: parseOrientation(r.orientation),
    primaryColor: String(r.primary_color || DEFAULT_CERTIFICATE_TEMPLATE.primaryColor),
    accentColor: String(r.accent_color || DEFAULT_CERTIFICATE_TEMPLATE.accentColor),
    goldColor: String(r.gold_color || DEFAULT_CERTIFICATE_TEMPLATE.goldColor),
    bgColor: String(r.bg_color || DEFAULT_CERTIFICATE_TEMPLATE.bgColor),
    titleAr: (r.title_ar as string | null) ?? null,
    titleEn: (r.title_en as string | null) ?? null,
    eyebrowAr: (r.eyebrow_ar as string | null) ?? null,
    eyebrowEn: (r.eyebrow_en as string | null) ?? null,
    bodyAr: (r.body_ar as string | null) ?? null,
    bodyEn: (r.body_en as string | null) ?? null,
    logoUrl: (r.logo_url as string | null) ?? null,
    logoWidthPct: clampPct(r.logo_width_pct, 14, 5, 40),
    logoYPct: clampPct(r.logo_y_pct, 8, 0, 40),
    sealUrl: (r.seal_url as string | null) ?? null,
    sealWidthPct: clampPct(r.seal_width_pct, 14, 5, 40),
    sealXPct: clampPct(r.seal_x_pct, 85, 0, 100),
    sealYPct: clampPct(r.seal_y_pct, 78, 0, 100),
    borderWidth: clampBorder(r.border_width, 6),
    frameStyle: parseFrameStyle(r.frame_style),
    fontFamily: parseFontFamily(r.font_family),
    showScore: r.show_score === false || r.show_score === "false" ? false : true,
    showPattern: r.show_pattern === false || r.show_pattern === "false" ? false : true,
    showQr: r.show_qr === false || r.show_qr === "false" ? false : true,
    showSeal: r.show_seal === true || r.show_seal === "true",
    signatures: parseSignaturesJson(r.signatures_json),
    createdAt: r.created_at ? new Date(String(r.created_at)) : undefined,
    updatedAt: r.updated_at ? new Date(String(r.updated_at)) : undefined,
  };
}

export async function ensureCertificateTemplatesSchema(): Promise<void> {
  return ensureOnce("ensureCertificateTemplatesSchema", async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS "CertificateTemplate" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Default',
        name_ar TEXT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        orientation TEXT NOT NULL DEFAULT 'portrait',
        primary_color TEXT,
        accent_color TEXT,
        gold_color TEXT,
        bg_color TEXT,
        title_ar TEXT,
        title_en TEXT,
        eyebrow_ar TEXT,
        eyebrow_en TEXT,
        body_ar TEXT,
        body_en TEXT,
        logo_url TEXT,
        logo_width_pct NUMERIC(6,2) NOT NULL DEFAULT 14,
        logo_y_pct NUMERIC(6,2) NOT NULL DEFAULT 8,
        seal_url TEXT,
        seal_width_pct NUMERIC(6,2) NOT NULL DEFAULT 14,
        seal_x_pct NUMERIC(6,2) NOT NULL DEFAULT 85,
        seal_y_pct NUMERIC(6,2) NOT NULL DEFAULT 78,
        border_width INT NOT NULL DEFAULT 6,
        frame_style TEXT NOT NULL DEFAULT 'solid',
        font_family TEXT NOT NULL DEFAULT 'Cairo',
        show_score BOOLEAN NOT NULL DEFAULT true,
        show_pattern BOOLEAN NOT NULL DEFAULT true,
        show_qr BOOLEAN NOT NULL DEFAULT true,
        show_seal BOOLEAN NOT NULL DEFAULT false,
        signatures_json TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    try {
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS certificate_template_id TEXT`;
    } catch {
      /* noop */
    }
    try {
      await sql`ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS template_id TEXT`;
      await sql`ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS template_snapshot_json TEXT`;
    } catch {
      /* noop */
    }

    const countRows = await sql`SELECT COUNT(*)::int AS c FROM "CertificateTemplate"`;
    const count = Number((countRows[0] as { c?: number } | undefined)?.c ?? 0);
    if (count === 0) {
      let migrated: Partial<CertificateTemplate> = {};
      try {
        const legacy = await sql`SELECT * FROM "CertificateDesignSetting" WHERE id = 'default' LIMIT 1`;
        const row = legacy[0] as Record<string, unknown> | undefined;
        if (row) {
          const sigUrl = row.signature_url ? String(row.signature_url) : null;
          const labelAr = row.signature_label_ar ? String(row.signature_label_ar) : null;
          const labelEn = row.signature_label_en ? String(row.signature_label_en) : null;
          migrated = {
            primaryColor: row.primary_color ? String(row.primary_color) : undefined,
            accentColor: row.accent_color ? String(row.accent_color) : undefined,
            goldColor: row.gold_color ? String(row.gold_color) : undefined,
            titleAr: (row.title_ar as string | null) ?? null,
            titleEn: (row.title_en as string | null) ?? null,
            eyebrowAr: (row.eyebrow_ar as string | null) ?? null,
            eyebrowEn: (row.eyebrow_en as string | null) ?? null,
            logoUrl: (row.logo_url as string | null) ?? null,
            showScore: row.show_score === false || row.show_score === "false" ? false : true,
            showPattern: row.show_pattern === false || row.show_pattern === "false" ? false : true,
            borderWidth: clampBorder(row.border_width, 6),
            signatures: [
              {
                ...DEFAULT_SIGNATURE,
                imageUrl: sigUrl,
                nameAr: labelAr,
                nameEn: labelEn,
              },
            ],
          };
        }
      } catch {
        /* no legacy table */
      }
      const id = generateId();
      const base = { ...DEFAULT_CERTIFICATE_TEMPLATE, ...migrated, isDefault: true };
      const signaturesJson = JSON.stringify(
        base.signatures?.length ? base.signatures : [{ ...DEFAULT_SIGNATURE }]
      );
      await sql`
        INSERT INTO "CertificateTemplate" (
          id, name, name_ar, is_default, orientation,
          primary_color, accent_color, gold_color, bg_color,
          title_ar, title_en, eyebrow_ar, eyebrow_en, body_ar, body_en,
          logo_url, logo_width_pct, logo_y_pct,
          seal_url, seal_width_pct, seal_x_pct, seal_y_pct,
          border_width, frame_style, font_family,
          show_score, show_pattern, show_qr, show_seal, signatures_json
        ) VALUES (
          ${id}, ${base.name}, ${base.nameAr ?? null}, true, ${base.orientation},
          ${base.primaryColor}, ${base.accentColor}, ${base.goldColor}, ${base.bgColor},
          ${base.titleAr ?? null}, ${base.titleEn ?? null}, ${base.eyebrowAr ?? null}, ${base.eyebrowEn ?? null},
          ${base.bodyAr ?? null}, ${base.bodyEn ?? null},
          ${base.logoUrl ?? null}, ${base.logoWidthPct}, ${base.logoYPct},
          ${base.sealUrl ?? null}, ${base.sealWidthPct}, ${base.sealXPct}, ${base.sealYPct},
          ${base.borderWidth}, ${base.frameStyle}, ${base.fontFamily},
          ${base.showScore}, ${base.showPattern}, ${base.showQr}, ${base.showSeal}, ${signaturesJson}
        )
      `;
    }
  });
}

export function templateToSnapshot(t: CertificateTemplate): string {
  return JSON.stringify(t);
}

export function templateFromSnapshot(raw: string | null | undefined): CertificateTemplate | null {
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as CertificateTemplate;
    if (!o || typeof o !== "object" || !o.id) return null;
    return {
      ...DEFAULT_CERTIFICATE_TEMPLATE,
      ...o,
      signatures: parseSignaturesJson(o.signatures),
      orientation: parseOrientation(o.orientation),
      frameStyle: parseFrameStyle(o.frameStyle),
      fontFamily: parseFontFamily(o.fontFamily),
    };
  } catch {
    return null;
  }
}

export async function listCertificateTemplates(): Promise<CertificateTemplate[]> {
  await ensureCertificateTemplatesSchema();
  const rows = await sql`
    SELECT * FROM "CertificateTemplate"
    ORDER BY is_default DESC, updated_at DESC, name ASC
  `;
  return (rows as Record<string, unknown>[])
    .map((r) => parseCertificateTemplateRow(r))
    .filter((t): t is CertificateTemplate => Boolean(t));
}

export async function getCertificateTemplate(id: string): Promise<CertificateTemplate | null> {
  await ensureCertificateTemplatesSchema();
  const rows = await sql`SELECT * FROM "CertificateTemplate" WHERE id = ${id} LIMIT 1`;
  return parseCertificateTemplateRow(rows[0] as Record<string, unknown> | undefined);
}

export async function getDefaultCertificateTemplate(): Promise<CertificateTemplate> {
  await ensureCertificateTemplatesSchema();
  const rows = await sql`
    SELECT * FROM "CertificateTemplate" WHERE is_default = true ORDER BY updated_at DESC LIMIT 1
  `;
  const t = parseCertificateTemplateRow(rows[0] as Record<string, unknown> | undefined);
  if (t) return t;
  const any = await listCertificateTemplates();
  if (any[0]) return any[0];
  return createCertificateTemplate({ ...DEFAULT_CERTIFICATE_TEMPLATE, isDefault: true });
}

export async function resolveTemplateForCourse(courseId: string): Promise<CertificateTemplate> {
  await ensureCertificateTemplatesSchema();
  try {
    const rows = await sql`
      SELECT certificate_template_id FROM "Course" WHERE id = ${courseId} LIMIT 1
    `;
    const tid = (rows[0] as { certificate_template_id?: string | null } | undefined)?.certificate_template_id;
    if (tid) {
      const t = await getCertificateTemplate(String(tid));
      if (t) return t;
    }
  } catch {
    /* column missing */
  }
  return getDefaultCertificateTemplate();
}

export async function createCertificateTemplate(
  data: Partial<CertificateTemplate> & { name?: string }
): Promise<CertificateTemplate> {
  await ensureCertificateTemplatesSchema();
  const id = data.id || generateId();
  const base = { ...DEFAULT_CERTIFICATE_TEMPLATE, ...data };
  const signaturesJson = JSON.stringify(base.signatures?.length ? base.signatures : [{ ...DEFAULT_SIGNATURE }]);
  const isDefault = Boolean(base.isDefault);

  if (isDefault) {
    await sql`UPDATE "CertificateTemplate" SET is_default = false WHERE is_default = true`;
  }

  await sql`
    INSERT INTO "CertificateTemplate" (
      id, name, name_ar, is_default, orientation,
      primary_color, accent_color, gold_color, bg_color,
      title_ar, title_en, eyebrow_ar, eyebrow_en, body_ar, body_en,
      logo_url, logo_width_pct, logo_y_pct,
      seal_url, seal_width_pct, seal_x_pct, seal_y_pct,
      border_width, frame_style, font_family,
      show_score, show_pattern, show_qr, show_seal, signatures_json
    ) VALUES (
      ${id}, ${base.name || "Template"}, ${base.nameAr ?? null}, ${isDefault}, ${base.orientation},
      ${base.primaryColor}, ${base.accentColor}, ${base.goldColor}, ${base.bgColor},
      ${base.titleAr ?? null}, ${base.titleEn ?? null}, ${base.eyebrowAr ?? null}, ${base.eyebrowEn ?? null},
      ${base.bodyAr ?? null}, ${base.bodyEn ?? null},
      ${base.logoUrl ?? null}, ${base.logoWidthPct}, ${base.logoYPct},
      ${base.sealUrl ?? null}, ${base.sealWidthPct}, ${base.sealXPct}, ${base.sealYPct},
      ${base.borderWidth}, ${base.frameStyle}, ${base.fontFamily},
      ${base.showScore}, ${base.showPattern}, ${base.showQr}, ${base.showSeal}, ${signaturesJson}
    )
  `;

  const created = await getCertificateTemplate(id);
  if (!created) throw new Error("فشل إنشاء قالب الشهادة");
  return created;
}

export async function updateCertificateTemplate(
  id: string,
  data: Partial<CertificateTemplate>
): Promise<CertificateTemplate> {
  await ensureCertificateTemplatesSchema();
  const current = await getCertificateTemplate(id);
  if (!current) throw new Error("القالب غير موجود");

  if (data.isDefault === true) {
    await sql`UPDATE "CertificateTemplate" SET is_default = false WHERE is_default = true AND id <> ${id}`;
    await sql`UPDATE "CertificateTemplate" SET is_default = true, updated_at = NOW() WHERE id = ${id}`;
  } else if (data.isDefault === false) {
    await sql`UPDATE "CertificateTemplate" SET is_default = false, updated_at = NOW() WHERE id = ${id}`;
  }

  if (data.name !== undefined)
    await sql`UPDATE "CertificateTemplate" SET name = ${data.name.trim() || current.name}, updated_at = NOW() WHERE id = ${id}`;
  if (data.nameAr !== undefined)
    await sql`UPDATE "CertificateTemplate" SET name_ar = ${data.nameAr?.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (data.orientation !== undefined)
    await sql`UPDATE "CertificateTemplate" SET orientation = ${parseOrientation(data.orientation)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.primaryColor !== undefined)
    await sql`UPDATE "CertificateTemplate" SET primary_color = ${data.primaryColor}, updated_at = NOW() WHERE id = ${id}`;
  if (data.accentColor !== undefined)
    await sql`UPDATE "CertificateTemplate" SET accent_color = ${data.accentColor}, updated_at = NOW() WHERE id = ${id}`;
  if (data.goldColor !== undefined)
    await sql`UPDATE "CertificateTemplate" SET gold_color = ${data.goldColor}, updated_at = NOW() WHERE id = ${id}`;
  if (data.bgColor !== undefined)
    await sql`UPDATE "CertificateTemplate" SET bg_color = ${data.bgColor}, updated_at = NOW() WHERE id = ${id}`;
  if (data.titleAr !== undefined)
    await sql`UPDATE "CertificateTemplate" SET title_ar = ${data.titleAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.titleEn !== undefined)
    await sql`UPDATE "CertificateTemplate" SET title_en = ${data.titleEn}, updated_at = NOW() WHERE id = ${id}`;
  if (data.eyebrowAr !== undefined)
    await sql`UPDATE "CertificateTemplate" SET eyebrow_ar = ${data.eyebrowAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.eyebrowEn !== undefined)
    await sql`UPDATE "CertificateTemplate" SET eyebrow_en = ${data.eyebrowEn}, updated_at = NOW() WHERE id = ${id}`;
  if (data.bodyAr !== undefined)
    await sql`UPDATE "CertificateTemplate" SET body_ar = ${data.bodyAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.bodyEn !== undefined)
    await sql`UPDATE "CertificateTemplate" SET body_en = ${data.bodyEn}, updated_at = NOW() WHERE id = ${id}`;
  if (data.logoUrl !== undefined)
    await sql`UPDATE "CertificateTemplate" SET logo_url = ${data.logoUrl}, updated_at = NOW() WHERE id = ${id}`;
  if (data.logoWidthPct !== undefined)
    await sql`UPDATE "CertificateTemplate" SET logo_width_pct = ${clampPct(data.logoWidthPct, 14, 5, 40)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.logoYPct !== undefined)
    await sql`UPDATE "CertificateTemplate" SET logo_y_pct = ${clampPct(data.logoYPct, 8, 0, 40)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.sealUrl !== undefined)
    await sql`UPDATE "CertificateTemplate" SET seal_url = ${data.sealUrl}, updated_at = NOW() WHERE id = ${id}`;
  if (data.sealWidthPct !== undefined)
    await sql`UPDATE "CertificateTemplate" SET seal_width_pct = ${clampPct(data.sealWidthPct, 14, 5, 40)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.sealXPct !== undefined)
    await sql`UPDATE "CertificateTemplate" SET seal_x_pct = ${clampPct(data.sealXPct, 85, 0, 100)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.sealYPct !== undefined)
    await sql`UPDATE "CertificateTemplate" SET seal_y_pct = ${clampPct(data.sealYPct, 78, 0, 100)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.borderWidth !== undefined)
    await sql`UPDATE "CertificateTemplate" SET border_width = ${clampBorder(data.borderWidth)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.frameStyle !== undefined)
    await sql`UPDATE "CertificateTemplate" SET frame_style = ${parseFrameStyle(data.frameStyle)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.fontFamily !== undefined)
    await sql`UPDATE "CertificateTemplate" SET font_family = ${parseFontFamily(data.fontFamily)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.showScore !== undefined)
    await sql`UPDATE "CertificateTemplate" SET show_score = ${Boolean(data.showScore)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.showPattern !== undefined)
    await sql`UPDATE "CertificateTemplate" SET show_pattern = ${Boolean(data.showPattern)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.showQr !== undefined)
    await sql`UPDATE "CertificateTemplate" SET show_qr = ${Boolean(data.showQr)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.showSeal !== undefined)
    await sql`UPDATE "CertificateTemplate" SET show_seal = ${Boolean(data.showSeal)}, updated_at = NOW() WHERE id = ${id}`;
  if (data.signatures !== undefined) {
    const sigJson = JSON.stringify(parseSignaturesJson(data.signatures));
    await sql`UPDATE "CertificateTemplate" SET signatures_json = ${sigJson}, updated_at = NOW() WHERE id = ${id}`;
  }

  const updated = await getCertificateTemplate(id);
  if (!updated) throw new Error("فشل تحديث القالب");

  // Keep legacy singleton in sync when updating default template
  if (updated.isDefault) {
    try {
      const firstSig = updated.signatures[0];
      await sql`
        INSERT INTO "CertificateDesignSetting" (id)
        VALUES ('default')
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        UPDATE "CertificateDesignSetting" SET
          primary_color = ${updated.primaryColor},
          accent_color = ${updated.accentColor},
          gold_color = ${updated.goldColor},
          title_ar = ${updated.titleAr},
          title_en = ${updated.titleEn},
          eyebrow_ar = ${updated.eyebrowAr},
          eyebrow_en = ${updated.eyebrowEn},
          logo_url = ${updated.logoUrl},
          signature_url = ${firstSig?.imageUrl ?? null},
          signature_label_ar = ${firstSig?.nameAr ?? null},
          signature_label_en = ${firstSig?.nameEn ?? null},
          show_score = ${updated.showScore},
          show_pattern = ${updated.showPattern},
          border_width = ${updated.borderWidth},
          updated_at = NOW()
        WHERE id = 'default'
      `;
    } catch {
      /* legacy table optional */
    }
  }

  return updated;
}

export async function deleteCertificateTemplate(id: string): Promise<boolean> {
  await ensureCertificateTemplatesSchema();
  const t = await getCertificateTemplate(id);
  if (!t) return false;
  if (t.isDefault) throw new Error("لا يمكن حذف القالب الافتراضي");
  const used = await sql`
    SELECT COUNT(*)::int AS c FROM "Course" WHERE certificate_template_id = ${id}
  `.catch(() => [{ c: 0 }]);
  if (Number((used[0] as { c?: number }).c ?? 0) > 0) {
    throw new Error("القالب مستخدم في دورات — أزل التعيين أولاً");
  }
  const result = await sql`DELETE FROM "CertificateTemplate" WHERE id = ${id} RETURNING id`;
  return (result as { id: string }[]).length > 0;
}

export async function setCourseCertificateTemplate(
  courseId: string,
  templateId: string | null
): Promise<void> {
  await ensureCertificateTemplatesSchema();
  await sql`UPDATE "Course" SET certificate_template_id = ${templateId}, updated_at = NOW() WHERE id = ${courseId}`;
}

export async function getCourseCertificateTemplateId(courseId: string): Promise<string | null> {
  await ensureCertificateTemplatesSchema();
  try {
    const rows = await sql`SELECT certificate_template_id FROM "Course" WHERE id = ${courseId} LIMIT 1`;
    const tid = (rows[0] as { certificate_template_id?: string | null } | undefined)?.certificate_template_id;
    return tid ? String(tid) : null;
  } catch {
    return null;
  }
}

/** توافق مع واجهة التصميم القديمة — يقرأ/يكتب القالب الافتراضي */
export async function getCertificateDesignSettingsCompat(): Promise<{
  primaryColor: string;
  accentColor: string;
  goldColor: string;
  titleAr: string | null;
  titleEn: string | null;
  eyebrowAr: string | null;
  eyebrowEn: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  signatureLabelAr: string | null;
  signatureLabelEn: string | null;
  showScore: boolean;
  showPattern: boolean;
  borderWidth: number;
}> {
  const t = await getDefaultCertificateTemplate();
  const sig = t.signatures[0];
  return {
    primaryColor: t.primaryColor,
    accentColor: t.accentColor,
    goldColor: t.goldColor,
    titleAr: t.titleAr,
    titleEn: t.titleEn,
    eyebrowAr: t.eyebrowAr,
    eyebrowEn: t.eyebrowEn,
    logoUrl: t.logoUrl,
    signatureUrl: sig?.imageUrl ?? null,
    signatureLabelAr: sig?.nameAr ?? null,
    signatureLabelEn: sig?.nameEn ?? null,
    showScore: t.showScore,
    showPattern: t.showPattern,
    borderWidth: t.borderWidth,
  };
}
