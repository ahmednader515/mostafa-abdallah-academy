import { redirect } from "next/navigation";

/** وسائل الدفع تُدار من صفحة إضافة الرصيد */
export default function DashboardPaymentMethodsRedirect() {
  redirect("/dashboard/settings/add-balance");
}
