import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  adjustWalletBalance,
  listStudentBalances,
  listWalletTransactionsAll,
} from "@/lib/wallet";
import { getUserById } from "@/lib/db";

function isStaff(role: string | undefined) {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const search = searchParams.get("q");
  const [students, transactions] = await Promise.all([
    listStudentBalances({ search, limit: 300 }),
    listWalletTransactionsAll({ userId, limit: 300 }),
  ]);
  return NextResponse.json({ students, transactions });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    userId?: string;
    amount?: number;
    reason?: string;
    direction?: "credit" | "debit";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const userId = String(body.userId ?? "").trim();
  const amountAbs = Math.abs(Number(body.amount));
  const reason = String(body.reason ?? "").trim();
  if (!userId) return NextResponse.json({ error: "المستخدم مطلوب" }, { status: 400 });
  if (!Number.isFinite(amountAbs) || amountAbs <= 0) {
    return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
  }
  if (!reason) return NextResponse.json({ error: "سبب العملية مطلوب" }, { status: 400 });

  const student = await getUserById(userId);
  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
  }

  const direction = body.direction === "debit" ? "debit" : "credit";
  const signed = direction === "debit" ? -amountAbs : amountAbs;

  try {
    const result = await adjustWalletBalance({
      userId,
      amount: signed,
      type: direction === "credit" ? "topup" : "debit",
      reason,
      referenceType: "admin_adjustment",
      referenceId: session.user.id,
      createdBy: session.user.id,
    });
    return NextResponse.json({
      success: true,
      balance: result.balanceAfter,
      transactionId: result.transactionId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "تعذر تحديث الرصيد";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
