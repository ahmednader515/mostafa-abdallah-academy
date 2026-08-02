import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteExternalTraining, updateExternalTraining } from "@/lib/lms-features-db";
import { buildCredentialsJson } from "@/lib/external-training-credentials";

async function staff() {
  const s = await getServerSession(authOptions);
  return s?.user.role === "ADMIN" || s?.user.role === "ASSISTANT_ADMIN";
}

function resolveCredentialsJson(
  body: Record<string, unknown>,
): string | null | undefined {
  if (body.username != null || body.password != null || body.officeId != null) {
    return buildCredentialsJson({
      username: String(body.username ?? ""),
      password: String(body.password ?? ""),
      officeId: body.officeId != null ? String(body.officeId) : "",
      fieldNames: {
        username: body.usernameField != null ? String(body.usernameField) : undefined,
        password: body.passwordField != null ? String(body.passwordField) : undefined,
        officeId: body.officeIdField != null ? String(body.officeIdField) : undefined,
      },
    });
  }
  if (body.credentialsJson !== undefined) {
    if (body.credentialsJson == null) return null;
    return typeof body.credentialsJson === "string"
      ? body.credentialsJson
      : JSON.stringify(body.credentialsJson);
  }
  return undefined;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await staff())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const credentialsJson = resolveCredentialsJson(body);
    const patch: Parameters<typeof updateExternalTraining>[1] = {};

    if (body.title !== undefined) patch.title = String(body.title);
    if (body.titleAr !== undefined) patch.titleAr = body.titleAr == null ? null : String(body.titleAr);
    if (body.description !== undefined) patch.description = String(body.description);
    if (body.descriptionAr !== undefined) {
      patch.descriptionAr = body.descriptionAr == null ? null : String(body.descriptionAr);
    }
    if (body.imageUrl !== undefined) {
      patch.imageUrl = body.imageUrl == null || body.imageUrl === "" ? null : String(body.imageUrl);
    }
    if (body.launchUrl !== undefined) patch.launchUrl = String(body.launchUrl);
    if (body.launchMethod !== undefined) {
      patch.launchMethod =
        String(body.launchMethod).toUpperCase() === "GET" ? "GET" : "POST";
    }
    if (credentialsJson !== undefined) patch.credentialsJson = credentialsJson;
    if (body.isPublished !== undefined) {
      patch.isPublished = body.isPublished === true || body.isPublished === "true";
    }
    if (body.order !== undefined) patch.order = Number(body.order);

    if (patch.launchUrl !== undefined && !patch.launchUrl.trim()) {
      return NextResponse.json({ error: "Launch URL is required" }, { status: 400 });
    }
    if (patch.title !== undefined && !patch.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await updateExternalTraining((await params).id, patch);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await staff())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  await deleteExternalTraining((await params).id);
  return NextResponse.json({ success: true });
}
