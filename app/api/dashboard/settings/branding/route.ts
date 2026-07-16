import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBrandAndAnalyticsSettings, updateBrandSettings } from "@/lib/lms-spec-db";
import { getHomepageSettings, updateHomepageSettings } from "@/lib/db";

type HomepageSettingsPatch = Parameters<typeof updateHomepageSettings>[0];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const [brand, homepage] = await Promise.all([getBrandAndAnalyticsSettings(), getHomepageSettings()]);
    return NextResponse.json({
      ...brand,
      primaryColor: homepage.primaryColor ?? null,
      headerLogoUrl: homepage.headerLogoUrl ?? null,
      platformName: homepage.platformName ?? null,
      platformNameEn: homepage.platformNameEn ?? null,
    });
  } catch {
    return NextResponse.json({ error: "فشل جلب إعدادات الهوية البصرية" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    secondaryColor?: string | null;
    accentColor?: string | null;
    backgroundColor?: string | null;
    faviconUrl?: string | null;
    ga4Id?: string | null;
    gtmId?: string | null;
    facebookPixelId?: string | null;
    primaryColor?: string | null;
    headerLogoUrl?: string | null;
    platformName?: string | null;
    platformNameEn?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    await updateBrandSettings({
      secondaryColor: body.secondaryColor,
      accentColor: body.accentColor,
      backgroundColor: body.backgroundColor,
      faviconUrl: body.faviconUrl,
      ga4Id: body.ga4Id,
      gtmId: body.gtmId,
      facebookPixelId: body.facebookPixelId,
    });
    const homepagePatch: HomepageSettingsPatch = {};
    if (body.primaryColor !== undefined) homepagePatch.primary_color = body.primaryColor;
    if (body.headerLogoUrl !== undefined) homepagePatch.header_logo_url = body.headerLogoUrl;
    if (body.platformName !== undefined) homepagePatch.platform_name = body.platformName;
    if (body.platformNameEn !== undefined) homepagePatch.platform_name_en = body.platformNameEn;
    if (Object.keys(homepagePatch).length > 0) {
      await updateHomepageSettings(homepagePatch);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حفظ إعدادات الهوية البصرية" }, { status: 500 });
  }
}
