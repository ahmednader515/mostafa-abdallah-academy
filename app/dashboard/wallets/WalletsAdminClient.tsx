"use client";

import { useCallback, useMemo, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { FormattedPrice } from "@/components/FormattedPrice";
import type { WalletTransaction, WalletTransactionType } from "@/lib/wallet";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  balance: number;
};

function typeLabel(
  t: (key: string, fallback: string) => string,
  type: WalletTransactionType,
): string {
  switch (type) {
    case "topup":
      return t("wallet.type.topup", "Top-up");
    case "debit":
      return t("wallet.type.debit", "Deduction");
    case "purchase":
      return t("wallet.type.purchase", "Purchase");
    case "refund":
      return t("wallet.type.refund", "Refund");
    case "gift":
      return t("wallet.type.gift", "Gift");
    case "adjustment":
      return t("wallet.type.adjustment", "Adjustment");
    default:
      return type;
  }
}

export function WalletsAdminClient({
  initialStudents,
  initialTransactions,
}: {
  initialStudents: StudentRow[];
  initialTransactions: WalletTransaction[];
}) {
  const t = useT();
  const [students, setStudents] = useState(initialStudents);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filterUserId, setFilterUserId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async (userId?: string, q?: string) => {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (q) params.set("q", q);
    const res = await fetch(`/api/dashboard/wallets?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      students?: StudentRow[];
      transactions?: WalletTransaction[];
    };
    if (data.students) setStudents(data.students);
    if (data.transactions) setTransactions(data.transactions);
  }, []);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [students, search]);

  async function applyAdjustment() {
    setError("");
    setSuccess("");
    if (!selectedUserId) {
      setError(t("wallet.selectStudent", "Select a student"));
      return;
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError(t("dashboard.studentsPage.invalidAmountError", "Enter a valid amount"));
      return;
    }
    if (!reason.trim()) {
      setError(t("wallet.reasonRequired", "Reason is required"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/wallets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: num,
          reason: reason.trim(),
          direction,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("wallet.adjustFailed", "Could not update wallet"));
        return;
      }
      setSuccess(t("wallet.adjustSuccess", "Wallet updated"));
      setAmount("");
      setReason("");
      await reload(filterUserId || undefined, search || undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="font-semibold">{t("wallet.adminAdjustTitle", "Add or deduct balance")}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            <option value="">{t("wallet.selectStudent", "Select a student")}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.email} ({s.balance.toFixed(2)})
              </option>
            ))}
          </select>
          <select
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value === "debit" ? "debit" : "credit")
            }
            className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            <option value="credit">{t("wallet.credit", "Add balance")}</option>
            <option value="debit">{t("wallet.debit", "Deduct balance")}</option>
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("dashboard.studentsPage.amountPlaceholderEgp", "Amount (EGP)")}
            className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("wallet.reasonPlaceholder", "Reason (required)")}
            className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void applyAdjustment()}
          className="mt-3 rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "…" : t("wallet.apply", "Apply")}
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">{t("wallet.adminStudentsTitle", "Student wallets")}</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => void reload(filterUserId || undefined, search || undefined)}
            placeholder={t("wallet.searchStudents", "Search students…")}
            className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-x-auto rounded border border-[var(--color-border)]">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b bg-[var(--color-surface)] text-[var(--color-muted)]">
                <th className="px-3 py-2 text-start">{t("wallet.colStudent", "Student")}</th>
                <th className="px-3 py-2 text-start">{t("wallet.colEmail", "Email")}</th>
                <th className="px-3 py-2 text-start">{t("wallet.colBalance", "Balance")}</th>
                <th className="px-3 py-2 text-start">{t("wallet.colActions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id} className="border-b border-[var(--color-border)]/70">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2" dir="ltr">
                    {s.email}
                  </td>
                  <td className="px-3 py-2">
                    <FormattedPrice amountEgp={s.balance} />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        setSelectedUserId(s.id);
                        setFilterUserId(s.id);
                        void reload(s.id, search || undefined);
                      }}
                    >
                      {t("wallet.viewHistory", "View history")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">{t("wallet.historyTitle", "Transaction history")}</h3>
          <div className="flex gap-2">
            {filterUserId ? (
              <button
                type="button"
                className="text-sm underline"
                onClick={() => {
                  setFilterUserId("");
                  void reload(undefined, search || undefined);
                }}
              >
                {t("wallet.clearFilter", "Show all")}
              </button>
            ) : null}
          </div>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t("wallet.historyEmpty", "No wallet transactions yet.")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded border border-[var(--color-border)]">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b bg-[var(--color-surface)] text-[var(--color-muted)]">
                  <th className="px-3 py-2 text-start">{t("wallet.colDate", "Date")}</th>
                  <th className="px-3 py-2 text-start">{t("wallet.colStudent", "Student")}</th>
                  <th className="px-3 py-2 text-start">{t("wallet.colType", "Type")}</th>
                  <th className="px-3 py-2 text-start">{t("wallet.colAmount", "Amount")}</th>
                  <th className="px-3 py-2 text-start">
                    {t("wallet.colBalanceAfter", "Balance after")}
                  </th>
                  <th className="px-3 py-2 text-start">{t("wallet.colReason", "Reason")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[var(--color-border)]/70">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {tx.userName || tx.userEmail || tx.userId}
                    </td>
                    <td className="px-3 py-2">{typeLabel(t, tx.type)}</td>
                    <td
                      className={`px-3 py-2 font-semibold ${
                        tx.amount >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : "−"}
                      <FormattedPrice amountEgp={Math.abs(tx.amount)} />
                    </td>
                    <td className="px-3 py-2">
                      <FormattedPrice amountEgp={tx.balanceAfter} />
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">
                      {tx.reason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
