import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { listWalletTransactionsForUser, type WalletTransactionType } from "@/lib/wallet";
import { getStudentDashboardFlags } from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";
import { FormattedPrice } from "@/components/FormattedPrice";

export const dynamic = "force-dynamic";

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

export default async function StudentWalletPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const flags = await getStudentDashboardFlags();
  if (!flags.wallet) redirect("/dashboard");

  const [t, user, transactions] = await Promise.all([
    getServerTranslator(),
    getUserById(session.user.id),
    listWalletTransactionsForUser(session.user.id, 150).catch(() => []),
  ]);

  const balance = Number(user?.balance ?? 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t("wallet.title", "Wallet")}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t(
              "wallet.subtitle",
              "View your balance, top up, and review wallet history.",
            )}
          </p>
        </div>
        <Link
          href="/dashboard/add-balance"
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {t("wallet.topUpButton", "Top up wallet")}
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-sm text-[var(--color-muted)]">
          {t("wallet.currentBalance", "Current balance")}
        </p>
        <p className="mt-2 text-3xl font-extrabold text-[var(--color-primary)]">
          <FormattedPrice amountEgp={balance} />
        </p>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {t(
            "wallet.useHint",
            "Your wallet balance can be used to buy courses and subscription plans.",
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="font-semibold">{t("wallet.historyTitle", "Transaction history")}</h3>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            {t("wallet.historyEmpty", "No wallet transactions yet.")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-start text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                  <th className="px-2 py-2 font-medium">{t("wallet.colDate", "Date")}</th>
                  <th className="px-2 py-2 font-medium">{t("wallet.colType", "Type")}</th>
                  <th className="px-2 py-2 font-medium">{t("wallet.colAmount", "Amount")}</th>
                  <th className="px-2 py-2 font-medium">
                    {t("wallet.colBalanceAfter", "Balance after")}
                  </th>
                  <th className="px-2 py-2 font-medium">{t("wallet.colReason", "Reason")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[var(--color-border)]/70">
                    <td className="px-2 py-2 whitespace-nowrap">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-2 py-2">{typeLabel(t, tx.type)}</td>
                    <td
                      className={`px-2 py-2 font-semibold ${
                        tx.amount >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      <FormattedPrice amountEgp={Math.abs(tx.amount)} />
                    </td>
                    <td className="px-2 py-2">
                      <FormattedPrice amountEgp={tx.balanceAfter} />
                    </td>
                    <td className="px-2 py-2 text-[var(--color-muted)]">
                      {tx.reason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
