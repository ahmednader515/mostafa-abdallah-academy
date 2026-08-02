import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSubscriptionPlan, listSubscriptionPlansAll } from "@/lib/db";
import { normalizeSubscriptionDurationKind } from "@/lib/subscription-duration";

function parseOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((x) => String(x).trim()).filter(Boolean))];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const plans = await listSubscriptionPlansAll();
    return NextResponse.json({ plans });
  } catch (e) {
    console.error("GET subscription-plans", e);
    return NextResponse.json({ error: "فشل جلب الباقات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    name?: string;
    description?: string;
    imageUrl?: string | null;
    durationKind?: string;
    durationValue?: number;
    price?: number;
    discountPrice?: number | null;
    discountPercent?: number | null;
    buttonText?: string | null;
    accentColor?: string | null;
    badgeText?: string | null;
    featuresJson?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    coversCourses?: boolean;
    coversLibrary?: boolean;
    coversExternalTraining?: boolean;
    courseCategoryIds?: string[];
    libraryCategoryIds?: string[];
    externalTrainingIds?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "اسم الاشتراك مطلوب" }, { status: 400 });
  const dk = normalizeSubscriptionDurationKind(body.durationKind);
  if (!dk) {
    return NextResponse.json({ error: "اختر مدة صالحة" }, { status: 400 });
  }
  const price = typeof body.price === "number" && Number.isFinite(body.price) ? Math.max(0, body.price) : 0;
  const discountPrice = parseOptionalNumber(body.discountPrice);
  const discountPercent = parseOptionalNumber(body.discountPercent);
  const coversCourses = body.coversCourses !== false;
  const coversLibrary = body.coversLibrary !== false;
  const coversExternal = body.coversExternalTraining === true;
  try {
    const { id } = await createSubscriptionPlan({
      name,
      description: body.description?.trim() ?? "",
      image_url: body.imageUrl?.trim() || null,
      duration_kind: dk,
      price,
      is_active: body.isActive !== false,
      duration_value: Math.max(1, Number(body.durationValue) || 1),
      discount_price: discountPrice === undefined ? null : discountPrice,
      discount_percent: discountPercent === undefined ? null : discountPercent,
      button_text: body.buttonText?.trim() || null,
      accent_color: body.accentColor?.trim() || null,
      badge_text: body.badgeText?.trim() || null,
      features_json: body.featuresJson?.trim() || null,
      sort_order: Math.max(0, Math.floor(Number(body.sortOrder) || 0)),
      covers_courses: coversCourses,
      covers_library: coversLibrary,
      covers_external_training: coversExternal,
      course_category_ids: parseIdList(body.courseCategoryIds),
      library_category_ids: parseIdList(body.libraryCategoryIds),
      external_training_ids: parseIdList(body.externalTrainingIds),
    });
    try {
      revalidateTag("subscriptions", "max");
    } catch {
      /* ignore */
    }
    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("POST subscription-plans", e);
    return NextResponse.json({ error: "فشل إنشاء الباقة" }, { status: 500 });
  }
}
