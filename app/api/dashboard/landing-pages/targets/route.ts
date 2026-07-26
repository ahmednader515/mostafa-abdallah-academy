import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCoursesPublished,
  listActiveSubscriptionPlansPublic,
  listStoreProductsAll,
} from "@/lib/db";
import { listAllConsultations } from "@/lib/lms-features-db";

/** Options for linking a landing page CTA to platform entities. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const [courses, plans, products, consultations] = await Promise.all([
    getCoursesPublished(false).catch(() => []),
    listActiveSubscriptionPlansPublic().catch(() => []),
    listStoreProductsAll().catch(() => []),
    listAllConsultations().catch(() => []),
  ]);

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: (c as { id: string }).id,
      title: (c as { titleAr?: string | null; title?: string }).titleAr || (c as { title?: string }).title || "",
      slug: (c as { slug?: string }).slug || "",
      price: Number((c as { price?: string | number }).price ?? 0),
    })),
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    })),
    libraryPlans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    })),
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      isActive: p.isActive,
    })),
    consultations: consultations.map((c) => ({
      id: c.id,
      title: c.titleAr || c.title,
      price: c.price,
    })),
  });
}
