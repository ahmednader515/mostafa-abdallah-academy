import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings, updateHomepageSettings } from "@/lib/db";
import { parsePolicyCards, type PolicyCard } from "@/lib/policy-cards";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const settings = await getHomepageSettings();
  const raw = (settings as { policyCardsJson?: string | null }).policyCardsJson;
  return NextResponse.json({ cards: parsePolicyCards(raw) });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { cards?: PolicyCard[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (!Array.isArray(body.cards)) {
    return NextResponse.json({ error: "cards مطلوب" }, { status: 400 });
  }
  await updateHomepageSettings({
    policy_cards_json: JSON.stringify(body.cards),
  });
  return NextResponse.json({ success: true });
}
