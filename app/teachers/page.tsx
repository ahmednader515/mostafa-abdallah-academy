import { unstable_noStore } from "next/cache";
import { listTeachersForHomepage } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { TeachersBrowseClient } from "./TeachersBrowseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const t = await getServerTranslator();
  return {
    title: `${t("teachers.pageTitle", "Choose the trainers")} | ${t("footer.defaultTitle", "WorldWay")}`,
    description: t(
      "teachers.pageDescription",
      "Browse platform trainers and the courses available for each trainer",
    ),
  };
}

export default async function TeachersPage() {
  unstable_noStore();
  const teachers = await listTeachersForHomepage().catch(() => []);

  return <TeachersBrowseClient initialTeachers={teachers} />;
}
