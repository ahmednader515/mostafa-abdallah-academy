import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { listStudentBalances, listWalletTransactionsAll } from "@/lib/wallet";
import { WalletsAdminClient } from "./WalletsAdminClient";

export default async function WalletsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") {
    redirect("/dashboard");
  }

  const [t, students, transactions] = await Promise.all([
    getServerTranslator(),
    listStudentBalances({ limit: 300 }).catch(() => []),
    listWalletTransactionsAll({ limit: 300 }).catch(() => []),
  ]);

  return (
    <div>
      <h2 className="text-xl font-bold">{t("wallet.adminTitle", "Student wallets")}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "wallet.adminIntro",
          "Add or deduct wallet balance after reviewing transfers, and browse the full ledger.",
        )}
      </p>
      <WalletsAdminClient initialStudents={students} initialTransactions={transactions} />
    </div>
  );
}
