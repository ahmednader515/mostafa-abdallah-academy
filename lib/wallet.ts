import { sql, getUserById, updateUser } from "@/lib/db";
import { generateId } from "@/lib/lms-features-db";

export type WalletTransactionType =
  | "topup"
  | "debit"
  | "purchase"
  | "refund"
  | "gift"
  | "adjustment";

export type WalletTransaction = {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: string;
  userName?: string | null;
  userEmail?: string | null;
};

const ensureOnceMap = new Map<string, Promise<void>>();
function ensureOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const existing = ensureOnceMap.get(key);
  if (existing) return existing;
  const p = fn();
  ensureOnceMap.set(key, p);
  return p;
}

export async function ensureWalletSchema(): Promise<void> {
  return ensureOnce("ensureWalletSchema", async () => {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "WalletTransaction" (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          amount NUMERIC(12,2) NOT NULL,
          balance_after NUMERIC(12,2) NOT NULL,
          reason TEXT,
          reference_type TEXT,
          reference_id TEXT,
          created_by TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "WalletTransaction_user_created_idx" ON "WalletTransaction"(user_id, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS "WalletTransaction_created_idx" ON "WalletTransaction"(created_at DESC)`;
    } catch {
      /* noop */
    }
  });
}

function mapTx(r: Record<string, unknown>): WalletTransaction {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    type: String(r.type) as WalletTransactionType,
    amount: Number(r.amount ?? 0),
    balanceAfter: Number(r.balance_after ?? 0),
    reason: r.reason != null ? String(r.reason) : null,
    referenceType: r.reference_type != null ? String(r.reference_type) : null,
    referenceId: r.reference_id != null ? String(r.reference_id) : null,
    createdBy: r.created_by != null ? String(r.created_by) : null,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at ?? ""),
    userName: r.user_name != null ? String(r.user_name) : undefined,
    userEmail: r.user_email != null ? String(r.user_email) : undefined,
  };
}

export async function adjustWalletBalance(input: {
  userId: string;
  /** Signed delta: positive credits, negative debits */
  amount: number;
  type: WalletTransactionType;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdBy?: string | null;
}): Promise<{ balanceAfter: number; transactionId: string }> {
  await ensureWalletSchema();
  const uid = input.userId.trim();
  if (!uid) throw new Error("المستخدم غير موجود");
  const delta = Number(input.amount);
  if (!Number.isFinite(delta) || delta === 0) {
    throw new Error("المبلغ غير صالح");
  }

  const user = await getUserById(uid);
  if (!user) throw new Error("المستخدم غير موجود");

  const current = Number(user.balance ?? 0) || 0;
  const next = Math.round((current + delta) * 100) / 100;
  if (next < -0.0001) {
    throw new Error("رصيدك غير كافٍ");
  }
  const balanceAfter = Math.max(0, next);
  const txId = generateId();

  await updateUser(uid, { balance: String(balanceAfter) });
  await sql`
    INSERT INTO "WalletTransaction" (
      id, user_id, type, amount, balance_after, reason,
      reference_type, reference_id, created_by
    ) VALUES (
      ${txId}, ${uid}, ${input.type}, ${delta}, ${balanceAfter},
      ${input.reason?.trim() || null},
      ${input.referenceType?.trim() || null},
      ${input.referenceId?.trim() || null},
      ${input.createdBy?.trim() || null}
    )
  `;

  return { balanceAfter, transactionId: txId };
}

export async function listWalletTransactionsForUser(
  userId: string,
  limit = 100,
): Promise<WalletTransaction[]> {
  await ensureWalletSchema();
  const lim = Math.min(Math.max(1, limit), 500);
  const rows = await sql`
    SELECT * FROM "WalletTransaction"
    WHERE user_id = ${userId.trim()}
    ORDER BY created_at DESC
    LIMIT ${lim}
  `;
  return (rows as Record<string, unknown>[]).map(mapTx);
}

export async function listWalletTransactionsAll(opts?: {
  userId?: string | null;
  limit?: number;
}): Promise<WalletTransaction[]> {
  await ensureWalletSchema();
  const lim = Math.min(Math.max(1, opts?.limit ?? 200), 1000);
  const uid = opts?.userId?.trim() || null;
  if (uid) {
    const rows = await sql`
      SELECT wt.*, u.name AS user_name, u.email AS user_email
      FROM "WalletTransaction" wt
      LEFT JOIN "User" u ON u.id = wt.user_id
      WHERE wt.user_id = ${uid}
      ORDER BY wt.created_at DESC
      LIMIT ${lim}
    `;
    return (rows as Record<string, unknown>[]).map(mapTx);
  }
  const rows = await sql`
    SELECT wt.*, u.name AS user_name, u.email AS user_email
    FROM "WalletTransaction" wt
    LEFT JOIN "User" u ON u.id = wt.user_id
    ORDER BY wt.created_at DESC
    LIMIT ${lim}
  `;
  return (rows as Record<string, unknown>[]).map(mapTx);
}

export async function listStudentBalances(opts?: {
  search?: string | null;
  limit?: number;
}): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    balance: number;
  }>
> {
  const lim = Math.min(Math.max(1, opts?.limit ?? 200), 500);
  const q = opts?.search?.trim() || "";
  if (q) {
    const like = `%${q}%`;
    const rows = await sql`
      SELECT id, name, email, balance FROM "User"
      WHERE role = 'STUDENT'
        AND (name ILIKE ${like} OR email ILIKE ${like})
      ORDER BY name ASC
      LIMIT ${lim}
    `;
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
      email: String(r.email ?? ""),
      balance: Number(r.balance ?? 0) || 0,
    }));
  }
  const rows = await sql`
    SELECT id, name, email, balance FROM "User"
    WHERE role = 'STUDENT'
    ORDER BY name ASC
    LIMIT ${lim}
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    balance: Number(r.balance ?? 0) || 0,
  }));
}
