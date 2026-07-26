import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBrandAndAnalyticsSettings, updateBrandSettings } from "@/lib/lms-spec-db";
import { getHomepageSettings, updateHomepageSettings, sql } from "@/lib/db";

type HomepageSettingsPatch = Parameters<typeof updateHomepageSettings>[0];

async function ensureSeoColumns() {
  await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS seo_description TEXT`.catch(
    () => undefined,
  );
  await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS seo_description_en TEXT`.catch(
    () => undefined,
  );
  await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS contact_email TEXT`.catch(
    () => undefined,
  );
  await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS default_currency TEXT`.catch(
    () => undefined,
  );
  await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS meta_capi_access_token TEXT`.catch(
    () => undefined,
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    await ensureSeoColumns();
    const [brand, homepage] = await Promise.all([getBrandAndAnalyticsSettings(), getHomepageSettings()]);
    return NextResponse.json({
      ...brand,
      primaryColor: homepage.primaryColor ?? null,
      headerLogoUrl: homepage.headerLogoUrl ?? null,
      platformName: homepage.platformName ?? null,
      platformNameEn: homepage.platformNameEn ?? null,
      platformNameColor: homepage.platformNameColor ?? null,
      platformNameColor2: homepage.platformNameColor2 ?? null,
      showPlatformName: homepage.showPlatformName !== false,
      showPlatformLogo: homepage.showPlatformLogo !== false,
      contactEmail: (homepage as { contactEmail?: string | null }).contactEmail ?? null,
      defaultCurrency: (homepage as { defaultCurrency?: string | null }).defaultCurrency ?? "EGP",
      seoTitle: homepage.pageTitle ?? null,
      seoTitleEn: homepage.pageTitleEn ?? null,
      seoDescription: homepage.seoDescription ?? null,
      seoDescriptionEn: homepage.seoDescriptionEn ?? null,
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
    metaCapiAccessToken?: string | null;
    primaryColor?: string | null;
    headerLogoUrl?: string | null;
    platformName?: string | null;
    platformNameEn?: string | null;
    platformNameColor?: string | null;
    platformNameColor2?: string | null;
    showPlatformName?: boolean;
    showPlatformLogo?: boolean;
    contactEmail?: string | null;
    defaultCurrency?: string | null;
    seoTitle?: string | null;
    seoTitleEn?: string | null;
    seoDescription?: string | null;
    seoDescriptionEn?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    await ensureSeoColumns();
    await updateBrandSettings({
      secondaryColor: body.secondaryColor,
      accentColor: body.accentColor,
      backgroundColor: body.backgroundColor,
      faviconUrl: body.faviconUrl,
      ga4Id: body.ga4Id,
      gtmId: body.gtmId,
      facebookPixelId: body.facebookPixelId,
      ...(body.metaCapiAccessToken !== undefined
        ? { metaCapiAccessToken: body.metaCapiAccessToken }
        : {}),
    });
    const homepagePatch: HomepageSettingsPatch = {};
    if (body.primaryColor !== undefined) homepagePatch.primary_color = body.primaryColor;
    if (body.headerLogoUrl !== undefined) homepagePatch.header_logo_url = body.headerLogoUrl;
    if (body.platformName !== undefined) homepagePatch.platform_name = body.platformName;
    if (body.platformNameEn !== undefined) homepagePatch.platform_name_en = body.platformNameEn;
    if (body.platformNameColor !== undefined) homepagePatch.platform_name_color = body.platformNameColor;
    if (body.platformNameColor2 !== undefined) homepagePatch.platform_name_color_2 = body.platformNameColor2;
    if (body.showPlatformName !== undefined) homepagePatch.show_platform_name = body.showPlatformName;
    if (body.showPlatformLogo !== undefined) homepagePatch.show_platform_logo = body.showPlatformLogo;
    if (body.seoTitle !== undefined) homepagePatch.page_title = body.seoTitle;
    if (body.seoTitleEn !== undefined) homepagePatch.page_title_en = body.seoTitleEn;
    if (Object.keys(homepagePatch).length > 0) {
      await updateHomepageSettings(homepagePatch);
    }
    if (body.seoDescription !== undefined) {
      await sql`
        UPDATE "HomepageSetting"
        SET seo_description = ${body.seoDescription}, updated_at = NOW()
        WHERE id = 'default'
      `;
    }
    if (body.seoDescriptionEn !== undefined) {
      await sql`
        UPDATE "HomepageSetting"
        SET seo_description_en = ${body.seoDescriptionEn}, updated_at = NOW()
        WHERE id = 'default'
      `;
    }
    if (body.contactEmail !== undefined) {
      await sql`
        UPDATE "HomepageSetting"
        SET contact_email = ${body.contactEmail}, updated_at = NOW()
        WHERE id = 'default'
      `;
    }
    if (body.defaultCurrency !== undefined) {
      await sql`
        UPDATE "HomepageSetting"
        SET default_currency = ${body.defaultCurrency}, updated_at = NOW()
        WHERE id = 'default'
      `;
    }
    revalidateTag("homepage-settings", "max");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حفظ إعدادات الهوية البصرية" }, { status: 500 });
  }
}
