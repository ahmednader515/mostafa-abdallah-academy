import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getExternalTrainingById } from "@/lib/lms-features-db";

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const training = await getExternalTrainingById((await params).id);
  if (!training || !training.isPublished) return new NextResponse("Not found", { status: 404 });
  let credentials: Record<string, unknown> = {};
  try {
    credentials = training.credentialsJson ? JSON.parse(training.credentialsJson) : {};
  } catch {
    return new NextResponse("Invalid launch configuration", { status: 500 });
  }
  if (!credentials || Array.isArray(credentials) || typeof credentials !== "object") {
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
