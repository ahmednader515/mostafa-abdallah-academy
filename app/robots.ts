import type { MetadataRoute } from "next";

function siteOrigin(): string {
  const primary = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN?.trim();
  if (primary) {
    return primary.startsWith("http")
      ? primary.replace(/\/$/, "")
      : `https://${primary.replace(/\/$/, "")}`;
  }
  const auth = process.env.NEXTAUTH_URL?.trim();
  if (auth) return auth.replace(/\/$/, "");
  return "http://localhost:3000";
}

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/login",
          "/register",
          "/login/forgot-password",
          "/forum/new",
          "/l/*/checkout",
          "/courses/*/complete",
          "/courses/*/quizzes/",
          "/courses/*/lessons/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
