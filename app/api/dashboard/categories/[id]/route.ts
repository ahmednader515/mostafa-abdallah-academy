import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteCategory, sql } from "@/lib/db";
import { updateCategoryFields } from "@/lib/lms-spec-db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  let body: {
    name?: string;
    nameAr?: string | null;
    slug?: string;
    parentId?: string | null;
    isVisible?: boolean;
    isPinned?: boolean;
    pinOrder?: number | null;
    order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    if (
      body.parentId !== undefined ||
      body.isVisible !== undefined ||
      body.isPinned !== undefined ||
      body.pinOrder !== undefined
    ) {
      await updateCategoryFields(id, {
        parentId: body.parentId,
        isVisible: body.isVisible,
        isPinned: body.isPinned,
        pinOrder: body.pinOrder,
      });
    }
    if (body.name !== undefined) {
      await sql`UPDATE "Category" SET name = ${body.name} WHERE id = ${id}`;
    }
    if (body.nameAr !== undefined) {
      await sql`UPDATE "Category" SET name_ar = ${body.nameAr} WHERE id = ${id}`;
    }
    if (body.slug !== undefined) {
      await sql`UPDATE "Category" SET slug = ${body.slug} WHERE id = ${id}`;
    }
    if (body.order !== undefined) {
      await sql`UPDATE "Category" SET "order" = ${body.order} WHERE id = ${id}`;
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تحديث القسم" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف القسم" }, { status: 500 });
  }
}
