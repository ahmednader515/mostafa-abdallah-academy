import type { MetadataRoute } from "next";

/** Hard-coded for Search Console: always advertise the canonical www host. */
const SITEMAP_URL = "https://www.worldway.net/sitemap.xml";
const HOST = "www.worldway.net";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: SITEMAP_URL,
    host: HOST,
  };
}
