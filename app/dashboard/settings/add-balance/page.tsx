import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
import { listPaymentMethods } from "@/lib/lms-spec-db";
import { AddBalanceSettingsForm } from "./AddBalanceSettingsForm";
import { PaymentMethodsAdmin } from "../payment-methods/PaymentMethodsAdmin";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function DashboardAddBalanceSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();

  const [settings, methods] = await Promise.all([
    getHomepageSettings(),
    listPaymentMethods().catch(() => []),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          {t("dashboard.addBalanceSettingsTitle", "Add balance page settings")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t(
            "dashboard.addBalanceSettingsDescription",
            "Manage all payment methods shown to students (Vodafone, Orange, Etisalat, InstaPay, PayPal…) and the shared page text / WhatsApp confirmation.",
          )}
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.addBalancePaymentMethodsHeading", "Payment methods")}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t(
            "dashboard.addBalancePaymentMethodsHint",
            "Enable, edit account/wallet numbers, and instructions for each method. Disabled methods are hidden from students.",
          )}
        </p>
        <PaymentMethodsAdmin initialMethods={methods} />
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.addBalancePageCopyHeading", "Page text & WhatsApp confirmation")}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t(
            "dashboard.addBalancePageCopyHint",
            "Shared title, subtitle, and WhatsApp confirmation message shown under all payment methods.",
          )}
        </p>
        <AddBalanceSettingsForm initialSettings={settings} />
      </section>
    </div>
  );
}
