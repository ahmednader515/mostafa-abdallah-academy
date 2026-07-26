import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buyStoreProduct } from "@/lib/db";
import { recordLandingPageEventBySlug } from "@/lib/landing-pages-db";
import { trackMetaCapiServer } from "@/lib/meta-capi-server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "الشراء متاح للطلاب فقط" }, { status: 403 });
  }

  let body: { productId?: string; landingPageSlug?: string; metaEventId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const productId = String(body.productId ?? "").trim();
  if (!productId) return NextResponse.json({ error: "productId مطلوب" }, { status: 400 });
  const landingPageSlug = body.landingPageSlug?.trim();
  const purchaseEventId =
    body.metaEventId?.trim() || request.headers.get("x-meta-event-id")?.trim() || undefined;

  try {
    if (landingPageSlug) {
      await recordLandingPageEventBySlug(landingPageSlug, "checkout_start", {
        type: "store_product",
        productId,
      });
    }
    const out = await buyStoreProduct(session.user.id, productId);
    if (landingPageSlug) {
      await recordLandingPageEventBySlug(landingPageSlug, "purchase", {
        type: "store_product",
        productId,
      });
    }
    await trackMetaCapiServer("Purchase", {
      eventId: purchaseEventId,
      request,
      customData: {
        content_ids: [productId],
        content_type: "product",
        content_name: "library_item",
        value: out.pricePaid,
        currency: "EGP",
        num_items: 1,
      },
      userData: {
        email: session.user.email,
        externalId: session.user.id,
        firstName: session.user.name?.split(/\s+/)[0] || session.user.name,
      },
    }).catch(() => undefined);
    return NextResponse.json({ success: true, ...out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل شراء المنتج";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
