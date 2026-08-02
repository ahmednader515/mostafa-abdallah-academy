import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings, updateHomepageSettings } from "@/lib/db";
import {
  parsePolicyCards,
  RESERVED_POLICY_SLUGS,
  sanitizePolicySlug,
  serializePolicyCards,
  type PolicyCard,
  type PolicyPlacement,
  type PolicyStatus,
} from "@/lib/policy-cards";

function normalizeIncomingCards(raw: unknown[]): PolicyCard[] | { error: string } {
  const cards: PolicyCard[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.length; i++) {
    const o = raw[i] as Record<string, unknown>;
    const slug = sanitizePolicySlug(String(o.slug ?? ""));
    if (!slug) return { error: "كل صفحة تحتاج معرف رابط صالح (slug)" };
    if (RESERVED_POLICY_SLUGS.has(slug)) {
      return { error: `المعرّف محجوز ولا يمكن استخدامه: ${slug}` };
    }
    if (seen.has(slug)) return { error: "معرّف الرابط يجب أن يكون فريداً" };
    seen.add(slug);
    const status: PolicyStatus = o.status === "draft" ? "draft" : "published";
    const placementRaw = String(o.placement ?? "footer");
    const placement: PolicyPlacement = (
      ["header", "footer", "both", "none"] as string[]
    ).includes(placementRaw)
      ? (placementRaw as PolicyPlacement)
      : "footer";
    cards.push({
      id: String(o.id ?? `policy-${i}`),
      slug,
      titleAr: String(o.titleAr ?? ""),
      titleEn: String(o.titleEn ?? ""),
      bodyAr: String(o.bodyAr ?? ""),
      bodyEn: String(o.bodyEn ?? ""),
      icon: o.icon != null ? String(o.icon) : null,
      link: `/${slug}`,
      isVisible: status === "published",
      status,
      placement,
      order: typeof o.order === "number" ? o.order : i,
    });
  }
  return cards;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const settings = await getHomepageSettings();
  const raw = (settings as { policyCardsJson?: string | null }).policyCardsJson;
  return NextResponse.json({ cards: parsePolicyCards(raw) });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { cards?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (!Array.isArray(body.cards)) {
    return NextResponse.json({ error: "cards مطلوب" }, { status: 400 });
  }
  const normalized = normalizeIncomingCards(body.cards);
  if ("error" in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }
  await updateHomepageSettings({
    policy_cards_json: serializePolicyCards(normalized),
  });
  try {
    revalidatePath("/", "layout");
    revalidatePath("/policies");
    for (const c of normalized) {
      revalidatePath(`/${c.slug}`);
      revalidatePath(`/policies/${c.slug}`);
    }
  } catch {
    /* ignore */
  }
  return NextResponse.json({ success: true, cards: normalized });
}
