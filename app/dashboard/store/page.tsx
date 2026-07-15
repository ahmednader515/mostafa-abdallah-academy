import { permanentRedirect } from "next/navigation";

export default function StoreDashboardPage() {
  permanentRedirect("/dashboard/library");
}
