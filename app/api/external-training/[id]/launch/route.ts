import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getExternalTrainingById } from "@/lib/lms-features-db";
import { credentialsForLaunch } from "@/lib/external-training-credentials";
import { userCanAccessExternalViaSubscription } from "@/lib/subscription-access";

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isStaff(role: string | undefined) {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const training = await getExternalTrainingById((await params).id);
  if (!training || !training.isPublished) {
    return new NextResponse("Not found", { status: 404 });
  }

  const staff = isStaff(session.user.role);
  if (!staff) {
    const allowed = await userCanAccessExternalViaSubscription(session.user.id, training.id);
    if (!allowed) {
      return new NextResponse(
        "This external training is not included in your current subscription.",
        { status: 403 },
      );
    }
  }

  const credentials = credentialsForLaunch(training.credentialsJson);
  if (Object.keys(credentials).length === 0) {
    return new NextResponse("Invalid launch configuration", { status: 500 });
  }

  const inputs = Object.entries(credentials)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`,
    )
    .join("");
  const method = training.launchMethod.toUpperCase() === "GET" ? "GET" : "POST";
  return new NextResponse(
    `<!doctype html><html><body><form id="launch" action="${escapeHtml(training.launchUrl)}" method="${method}">${inputs}</form><script>document.getElementById("launch").submit()</script></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
