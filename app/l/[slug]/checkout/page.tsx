import { Suspense } from "react";
import { LandingCheckoutClient } from "./LandingCheckoutClient";

type Props = { params: Promise<{ slug: string }> };

export default async function LandingCheckoutPage({ params }: Props) {
  const { slug: raw } = await params;
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    /* keep */
  }
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm">…</p>}>
      <LandingCheckoutClient slug={slug} />
    </Suspense>
  );
}
