import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteLibraryCategory, updateLibraryCategory } from "@/lib/db";
import { permissionDeniedResponse } from "@/lib/require-permission";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(
    session.user.id,
    session.user.role,
    "canManageLibrary",
  );
  if (denied) return denied;
  const { id } = await params;
  let body: {
    name?: string;
    nameAr?: string | null;
    slug?: string;
    parentId?: string | null;
    order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    await updateLibraryCategory(id, {
      name: body.name,
      name_ar: body.nameAr,
      slug: body.slug,
      parent_id: body.parentId,
      order: body.order,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تحديث التصنيف" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(
    session.user.id,
    session.user.role,
    "canManageLibrary",
  );
  if (denied) return denied;
  const { id } = await params;
  try {
    await deleteLibraryCategory(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف التصنيف" }, { status: 500 });
  }
}
