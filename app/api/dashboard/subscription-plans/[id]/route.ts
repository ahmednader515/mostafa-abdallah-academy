import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteSubscriptionPlan, updateSubscriptionPlan } from "@/lib/db";
import { normalizeSubscriptionDurationKind } from "@/lib/subscription-duration";

type Params = { params: Promise<{ id: string }> };

function parseOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseIdList(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((x) => String(x).trim()).filter(Boolean))];
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
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

  const patch: Parameters<typeof updateSubscriptionPlan>[1] = {};
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.description !== undefined) patch.description = body.description.trim();
  if (body.imageUrl !== undefined) patch.image_url = body.imageUrl?.trim() || null;
  if (body.durationKind !== undefined) {
    const dk = normalizeSubscriptionDurationKind(body.durationKind);
    if (!dk) {
      return NextResponse.json({ error: "مدة غير صالحة" }, { status: 400 });
    }
    patch.duration_kind = dk;
  }
  if (body.durationValue !== undefined) {
    patch.duration_value = Math.max(1, Number(body.durationValue) || 1);
  }
  if (body.price !== undefined) patch.price = Math.max(0, Number(body.price) || 0);
  if (body.isActive !== undefined) patch.is_active = !!body.isActive;
  if (body.discountPrice !== undefined) patch.discount_price = parseOptionalNumber(body.discountPrice) ?? null;
  if (body.discountPercent !== undefined) patch.discount_percent = parseOptionalNumber(body.discountPercent) ?? null;
  if (body.buttonText !== undefined) patch.button_text = body.buttonText?.trim() || null;
  if (body.accentColor !== undefined) patch.accent_color = body.accentColor?.trim() || null;
  if (body.badgeText !== undefined) patch.badge_text = body.badgeText?.trim() || null;
  if (body.featuresJson !== undefined) patch.features_json = body.featuresJson?.trim() || null;
  if (body.sortOrder !== undefined) patch.sort_order = Math.max(0, Math.floor(Number(body.sortOrder) || 0));
  if (body.coversCourses !== undefined) patch.covers_courses = !!body.coversCourses;
  if (body.coversLibrary !== undefined) patch.covers_library = !!body.coversLibrary;
  if (body.coversExternalTraining !== undefined) {
    patch.covers_external_training = !!body.coversExternalTraining;
  }
  const courseIds = parseIdList(body.courseCategoryIds);
  const libraryIds = parseIdList(body.libraryCategoryIds);
  const externalIds = parseIdList(body.externalTrainingIds);
  if (courseIds !== undefined) patch.course_category_ids = courseIds;
  if (libraryIds !== undefined) patch.library_category_ids = libraryIds;
  if (externalIds !== undefined) patch.external_training_ids = externalIds;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "لا توجد حقول للتحديث" }, { status: 400 });
  }
  try {
    await updateSubscriptionPlan(id, patch);
    try {
      revalidateTag("subscriptions", "max");
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.error("PATCH subscription-plans/[id]", e);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteSubscriptionPlan(id);
    try {
      revalidateTag("subscriptions", "max");
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.error("DELETE subscription-plans/[id]", e);
    return NextResponse.json({ error: "تعذر الحذف — قد تكون الباقة مرتبطة بسجلات" }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
