import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createExternalTraining, listAllExternalTrainings } from "@/lib/lms-features-db";
import { buildCredentialsJson } from "@/lib/external-training-credentials";

function isStaff(role: string | undefined) {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

function resolveCredentialsJson(body: Record<string, unknown>): string | null {
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
  if (body.credentialsJson != null) {
    return typeof body.credentialsJson === "string"
      ? body.credentialsJson
      : JSON.stringify(body.credentialsJson);
  }
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const pages = await listAllExternalTrainings();
  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title || body.name || "").trim();
  const launchUrl = String(body.launchUrl || body.url || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!launchUrl) {
    return NextResponse.json({ error: "Launch URL is required" }, { status: 400 });
  }

  const launchMethod =
    String(body.launchMethod || "POST").toUpperCase() === "GET" ? "GET" : "POST";
  const credentialsJson = resolveCredentialsJson(body);

  const result = await createExternalTraining({
    title,
    titleAr: body.titleAr != null ? String(body.titleAr) : null,
    description: body.description != null ? String(body.description) : "",
    descriptionAr: body.descriptionAr != null ? String(body.descriptionAr) : null,
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
    launchUrl,
    launchMethod,
    credentialsJson,
    isPublished: body.isPublished !== false && body.isPublished !== "false",
  });
  return NextResponse.json(result);
}
