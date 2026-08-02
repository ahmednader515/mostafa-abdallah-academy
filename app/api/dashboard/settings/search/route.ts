import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql, getHomepageSettings } from "@/lib/db";
import { DEFAULT_SEARCH_FLAGS, parseSearchFlags, type SearchFlags } from "@/lib/search-flags";

function normalizeFlagsFromAdmin(raw: Partial<SearchFlags> | undefined): SearchFlags {
  const incoming = raw ?? DEFAULT_SEARCH_FLAGS;
  return {
    enabled: incoming.enabled !== false,
    courses: incoming.courses === true,
    library: incoming.library === true,
    jobs: incoming.jobs === true,
    forum: incoming.forum === true,
    live: incoming.live === true,
    consultations: incoming.consultations === true,
    trainers: incoming.trainers === true,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS search_flags_json TEXT`.catch(() => undefined);
  const settings = await getHomepageSettings();
  const raw =
    (settings as { searchFlagsJson?: string | null }).searchFlagsJson ??
    (settings as unknown as Record<string, unknown>).search_flags_json;
  return NextResponse.json({ flags: parseSearchFlags(raw != null ? String(raw) : null) });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { flags?: SearchFlags };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS search_flags_json TEXT`.catch(() => undefined);
  const normalized = normalizeFlagsFromAdmin(body.flags);
  await sql`
    UPDATE "HomepageSetting" SET search_flags_json = ${JSON.stringify(normalized)}, updated_at = NOW() WHERE id = 'default'
  `;
  return NextResponse.json({ success: true, flags: normalized });
}
