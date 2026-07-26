import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteExternalTraining, updateExternalTraining } from "@/lib/lms-features-db";

async function staff() {
  const s = await getServerSession(authOptions);
  return s?.user.role === "ADMIN" || s?.user.role === "ASSISTANT_ADMIN";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await staff())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  try {
    const body = await request.json();
    await updateExternalTraining((await params).id, {
      title: body.title,
      titleAr: body.titleAr,
      description: body.description,
      descriptionAr: body.descriptionAr,
      launchUrl: body.launchUrl,
      credentialsJson: body.credentialsJson,
      isPublished: body.isPublished,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await staff())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  await deleteExternalTraining((await params).id);
  return NextResponse.json({ success: true });
}
