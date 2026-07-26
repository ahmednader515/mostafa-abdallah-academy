import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createExternalTraining, listAllExternalTrainings } from "@/lib/lms-features-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const pages = await listAllExternalTrainings();
  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await request.json();
  const result = await createExternalTraining({
    title: String(body.title || body.name || "Training"),
    titleAr: body.titleAr ?? null,
    description: body.description ?? "",
    descriptionAr: body.descriptionAr ?? null,
    launchUrl: String(body.launchUrl || body.url || ""),
    credentialsJson: body.credentialsJson ?? null,
    isPublished: true,
  });
  return NextResponse.json(result);
}
